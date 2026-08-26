"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    forceRefresh,
    getAccessTokenTimeToExpiry,
    SessionEndedError,
    type SessionEndReason,
} from "@/services/api";
import {
    SESSION_IDLE_MS,
    SESSION_WARN_MS,
    LAST_ACTIVITY_KEY,
    SESSION_ENDED_KEY,
} from "@/config/constants";

// Events that count as "someone is using this". Deliberately excludes mousemove:
// a nudged desk or a hovering cursor is not work, and counting it would keep an
// unattended dashboard signed in forever.
const ACTIVITY_EVENTS = ["mousedown", "keydown", "wheel", "touchstart", "scroll"] as const;

// Activity is written to localStorage so other tabs see it. Throttled, because
// the alternative is a synchronous disk write on every keystroke.
const ACTIVITY_WRITE_THROTTLE_MS = 5_000;

// How close to expiry the access token has to be before an active session
// refreshes it early. Comfortably inside the 15-minute token lifetime.
const REFRESH_AHEAD_MS = 3 * 60 * 1000;

const TICK_MS = 1_000;

// After a refresh fails for a transient reason (throttled, offline), wait before
// trying again. Without this the tick below would retry once a second and turn a
// brief throttle into a sustained one.
const REFRESH_RETRY_COOLDOWN_MS = 60_000;

const readNumber = (key: string): number => {
    try {
        const raw = localStorage.getItem(key);
        const n = raw ? parseInt(raw, 10) : NaN;
        return Number.isFinite(n) ? n : 0;
    } catch {
        // Private mode, blocked site data — fall back to this tab's own clock.
        return 0;
    }
};

const writeNumber = (key: string, value: number) => {
    try { localStorage.setItem(key, String(value)); } catch { /* not worth failing over */ }
};

interface Options {
    /** Only run the clock for roles the timeout applies to, while signed in. */
    enabled: boolean;
    /** Called once when the session should end. */
    onExpire: (reason: SessionEndReason) => void;
}

interface IdleSession {
    /** True while the final warning is on screen. */
    isWarning: boolean;
    /** Whole seconds left before sign-out, for the countdown. */
    secondsLeft: number;
    /** "Stay signed in" — records activity and renews the token. */
    extend: () => void;
}

/**
 * The 30-minute staff idle timeout.
 *
 * Three things had to be true for this to be worth anything:
 *
 *  - It has to notice on its own. The old behaviour only discovered a dead
 *    session when the user clicked something, so an abandoned dashboard sat
 *    there looking signed in.
 *  - It has to warn before it acts, or half-finished work disappears.
 *  - It must not renew a session nobody is using. The proactive refresh below
 *    runs only while someone is genuinely active, which is what lets the
 *    server's matching idle window on the refresh token actually lapse.
 */
export function useIdleSession({ enabled, onExpire }: Options): IdleSession {
    const [isWarning, setIsWarning] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(0);

    // Refs, not state: these change on every mouse click and every tick, and
    // none of them should re-render anything on their own.
    // 0 until resolved on mount — seeding it with Date.now() would mean every
    // page load silently reset a clock that other tabs had been running.
    const lastActivityRef = useRef(0);
    const lastWriteRef = useRef(0);
    const refreshInFlightRef = useRef(false);
    const refreshBlockedUntilRef = useRef(0);
    const expiredRef = useRef(false);
    const warningRef = useRef(false);
    const onExpireRef = useRef(onExpire);
    onExpireRef.current = onExpire;

    const recordActivity = useCallback((force = false) => {
        const now = Date.now();
        lastActivityRef.current = now;
        if (force || now - lastWriteRef.current > ACTIVITY_WRITE_THROTTLE_MS) {
            lastWriteRef.current = now;
            writeNumber(LAST_ACTIVITY_KEY, now);
        }
    }, []);

    const expire = useCallback((reason: SessionEndReason) => {
        if (expiredRef.current) return;
        expiredRef.current = true;
        // Tell the other tabs before this one tears itself down.
        writeNumber(SESSION_ENDED_KEY, Date.now());
        onExpireRef.current(reason);
    }, []);

    const extend = useCallback(() => {
        recordActivity(true);
        setIsWarning(false);
        warningRef.current = false;
        // Renew the token immediately so the server's idle window moves too —
        // otherwise "Stay signed in" only fools this tab.
        forceRefresh()
            .then(() => { refreshBlockedUntilRef.current = 0; })
            .catch((err) => {
                if (err instanceof SessionEndedError) expire(err.reason);
                // A transient failure is fine — the clock has been reset either
                // way, so the user keeps working and the next tick tries again.
            });
    }, [expire, recordActivity]);

    // ── Activity listeners ───────────────────────────────────────────────────
    // Suspended while the warning is up. Otherwise the very act of reaching for
    // the "Stay signed in" button would dismiss the dialog silently, and the
    // user would never learn the session had been about to end.
    useEffect(() => {
        if (!enabled || isWarning) return;
        const handler = () => recordActivity();
        ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handler, { passive: true }));
        return () => ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handler));
    }, [enabled, isWarning, recordActivity]);

    // ── Cross-tab sign-out ───────────────────────────────────────────────────
    useEffect(() => {
        if (!enabled) return;
        const onStorage = (e: StorageEvent) => {
            if (e.key === SESSION_ENDED_KEY && e.newValue) {
                expiredRef.current = true; // another tab already broadcast it
                onExpireRef.current('expired');
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [enabled]);

    // ── The clock ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!enabled) {
            expiredRef.current = false;
            warningRef.current = false;
            setIsWarning(false);
            return;
        }

        // Adopt whatever the tabs already agreed on, so opening a second tab —
        // or reloading this one — does not reset a session that has been idle for
        // 29 minutes. Only a genuine interaction moves the clock, and the
        // listeners above pick that up the moment it happens.
        const stored = readNumber(LAST_ACTIVITY_KEY);
        if (stored > 0) {
            lastActivityRef.current = stored;
        } else {
            recordActivity(true); // first tab of a new session — start the clock
        }

        const id = window.setInterval(() => {
            const idleFor = Date.now() - Math.max(lastActivityRef.current, readNumber(LAST_ACTIVITY_KEY));
            const msLeft = SESSION_IDLE_MS - idleFor;

            if (msLeft <= 0) {
                expire('idle_timeout');
                return;
            }

            if (msLeft <= SESSION_WARN_MS) {
                if (!warningRef.current) {
                    warningRef.current = true;
                    setIsWarning(true);
                }
                setSecondsLeft(Math.ceil(msLeft / 1000));
                return;
            }

            if (warningRef.current) {
                warningRef.current = false;
                setIsWarning(false);
            }

            // Active session: keep the token (and the server's idle window) fresh.
            const timeToExpiry = getAccessTokenTimeToExpiry();
            const canTryRefresh =
                !refreshInFlightRef.current && Date.now() >= refreshBlockedUntilRef.current;
            if (timeToExpiry !== null && timeToExpiry < REFRESH_AHEAD_MS && canTryRefresh) {
                refreshInFlightRef.current = true;
                forceRefresh()
                    .then(() => { refreshBlockedUntilRef.current = 0; })
                    .catch((err) => {
                        if (err instanceof SessionEndedError) expire(err.reason);
                        else refreshBlockedUntilRef.current = Date.now() + REFRESH_RETRY_COOLDOWN_MS;
                    })
                    .finally(() => { refreshInFlightRef.current = false; });
            }
        }, TICK_MS);

        return () => window.clearInterval(id);
    }, [enabled, expire, recordActivity]);

    return { isWarning, secondsLeft, extend };
}
