"use client";

import { Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useIdleSession } from "@/hooks/useIdleSession";
import { SESSION_IDLE_ROLES } from "@/config/constants";
import Button from "@/components/common/Button";

const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
};

/**
 * Runs the staff idle clock and shows the warning before it lands.
 *
 * Kept as its own leaf component rather than living in AuthProvider: the
 * countdown re-renders once a second while the warning is up, and only this
 * subtree should pay for that.
 */
export default function SessionTimeoutGuard() {
    const { user, isAuthenticated, expireSession } = useAuth();

    const enabled =
        isAuthenticated &&
        !!user &&
        (SESSION_IDLE_ROLES as readonly string[]).includes(user.role);

    const { isWarning, secondsLeft, extend } = useIdleSession({
        enabled,
        onExpire: expireSession,
    });

    if (!enabled || !isWarning) return null;

    return (
        <div
            className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="session-timeout-title"
        >
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 p-8 text-center">
                <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
                    <Clock className="text-amber-500" size={26} />
                </div>

                <h2 id="session-timeout-title" className="text-xl font-black text-slate-800 tracking-tight">
                    Still there?
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">
                    You&apos;ll be signed out shortly because of inactivity. Anything you
                    haven&apos;t saved will be lost.
                </p>

                <p className="my-6 text-4xl font-black tabular-nums text-amber-500" aria-live="polite">
                    {formatCountdown(secondsLeft)}
                </p>

                <div className="flex flex-col gap-3">
                    <Button
                        onClick={extend}
                        className="w-full py-3.5 text-xs font-black uppercase tracking-widest shadow-xl shadow-[#039B81]/20"
                    >
                        Stay signed in
                    </Button>
                    <button
                        onClick={() => expireSession('expired')}
                        className="w-full py-3 text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                    >
                        Sign out now
                    </button>
                </div>
            </div>
        </div>
    );
}
