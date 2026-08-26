"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api, {
    setAccessToken,
    onSessionExpired,
    resetSessionExpiry,
    endSession,
    type SessionEndReason,
} from "@/services/api";
import { LAST_ACTIVITY_KEY, SESSION_ENDED_KEY } from "@/config/constants";
import { useRouter } from "next/navigation";

// localStorage is unavailable in private modes and when site data is blocked;
// none of these writes are worth breaking a sign-in over.
const safeSet = (key: string, value: string) => {
    try { localStorage.setItem(key, value); } catch { /* ignore */ }
};
const safeRemove = (key: string) => {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
};

interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: "customer" | "employee" | "admin";
    isActive?: boolean;
    isVerified?: boolean;
    createdAt?: string;
}

interface AuthContextType {
    user: User | null;
    login: (credentials: { email: string; password: string }) => Promise<void>;
    loginWithToken: (tokenData: { accessToken: string; user: User }) => void;
    register: (userData: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
    logout: () => Promise<void>;
    fetchUser: () => Promise<void>;
    isAuthenticated: boolean;
    isLoading: boolean;
    /** True when the session ended on its own rather than by signing out. */
    sessionExpired: boolean;
    /** Why it ended, so the login page can say something specific. */
    sessionEndReason: SessionEndReason | null;
    clearSessionExpired: () => void;
    /** End the session deliberately (idle timeout, or "Sign out now"). */
    expireSession: (reason: SessionEndReason) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionExpired, setSessionExpired] = useState(false);
    const [sessionEndReason, setSessionEndReason] = useState<SessionEndReason | null>(null);
    const router = useRouter();

    const fetchUser = useCallback(async () => {
        try {
            const { data: envelope } = await api.get("/api/auth/me");
            // Backend returns { success, message, data: User }
            const userData = envelope.data || envelope;
            setUser(userData);
        } catch (error) {
            // It's expected to fail if no valid refresh cookie exists. Just stay logged out silently.
            setUser(null);
            setAccessToken(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Attempt to fetch user profile on load.
        // If a refresh token cookie is present, the axios interceptor will silently
        // fetch an access token and this request will succeed, logging the user in.
        fetchUser();
    }, [fetchUser]);

    // The session can end long after that initial fetch — the access token lasts
    // 15 minutes and the refresh token can be revoked or expire at any point.
    // Nothing used to re-check, so the user stayed "signed in" with a dead token
    // and watched every panel come back empty. Clearing the user here lets
    // ProtectedRoute send them to the login page with an explanation.
    useEffect(() => onSessionExpired((reason) => {
        setUser(null);
        setSessionExpired(true);
        setSessionEndReason(reason);
        setIsLoading(false);
    }), []);

    const clearSessionExpired = useCallback(() => {
        setSessionExpired(false);
        setSessionEndReason(null);
    }, []);

    /**
     * End the session on the client's initiative — the idle timeout firing, or
     * the user choosing "Sign out now" from the warning.
     *
     * The logout call is best-effort but matters: it revokes the refresh token
     * server-side, so a browser left open on a shared machine cannot be revived
     * by simply reloading the page.
     */
    const expireSession = useCallback((reason: SessionEndReason) => {
        api.post("/api/auth/logout").catch(() => { /* the local session ends regardless */ });
        setAccessToken(null);
        safeRemove(LAST_ACTIVITY_KEY);
        // Announce through the api client so its own "session is over" latch is
        // set too, and any in-flight request stops retrying the refresh endpoint.
        endSession(reason);
        setUser(null);
        setSessionExpired(true);
        setSessionEndReason(reason);
        setIsLoading(false);
    }, []);

    const login = async (credentials: { email: string; password: string }) => {
        try {
            setIsLoading(true);
            // A fresh sign-in ends the expired state and re-arms the notifier so
            // the next expiry is announced too.
            setSessionExpired(false);
            setSessionEndReason(null);
            resetSessionExpiry();
            safeRemove(SESSION_ENDED_KEY);
            safeSet(LAST_ACTIVITY_KEY, String(Date.now()));
            const { data: envelope } = await api.post("/api/auth/login", credentials);
            // Backend returns { success, message, data: { accessToken, user } }
            const token = envelope.data?.accessToken || envelope.accessToken;

            console.log('[AuthContext] Login response:', envelope);
            console.log('[AuthContext] Extracted token:', token ? '***' + token.slice(-8) : 'NONE');

            if (token) {
                setAccessToken(token);
                console.log('[AuthContext] Token set in memory');
            }

            // If the backend returned user data directly, use it; otherwise fetch
            if (envelope.data?.user) {
                setUser(envelope.data.user);
                console.log('[AuthContext] User set from login response:', envelope.data.user.email);
                setIsLoading(false);
            } else {
                console.log('[AuthContext] No user in login response, fetching...');
                await fetchUser();
            }
        } catch (error: any) {
            console.error("Login failed:", error);
            if (error.response) {
                console.error("Login Error Response Body:", error.response.data);
                console.error("Login Error Status:", error.response.status);
            }
            setIsLoading(false);
            throw error;
        }
    };

    const loginWithToken = (tokenData: { accessToken: string; user: User }) => {
        setAccessToken(tokenData.accessToken);
        setUser(tokenData.user);
        setSessionExpired(false);
        setSessionEndReason(null);
        resetSessionExpiry();
        safeRemove(SESSION_ENDED_KEY);
        safeSet(LAST_ACTIVITY_KEY, String(Date.now()));
    };

    const register = async (userData: { name: string; email: string; password: string; phone?: string }) => {
        try {
            setIsLoading(true);
            await api.post("/api/auth/register", userData);
            
            // Follow immediately by logging in
            await login({
                email: userData.email,
                password: userData.password
            });
        } catch (error) {
            console.error("Registration failed:", error);
            setIsLoading(false);
            throw error;
        }
    };

    const logout = async () => {
        try {
            setIsLoading(true);
            // Hit the logout endpoint to instruct the backend to clear the httpOnly refresh cookie
            await api.post("/api/auth/logout");
        } catch (error) {
            console.error("Logout request failed, proceeding to wipe local state:", error);
        } finally {
            setUser(null);
            setAccessToken(null);
            // Signing out deliberately is not an expiry — no warning belongs on
            // the login page afterwards.
            setSessionExpired(false);
            setSessionEndReason(null);
            resetSessionExpiry();
            safeRemove(LAST_ACTIVITY_KEY);
            // Sign the other tabs out too, so a second window is not left
            // rendering a dashboard for a session that no longer exists.
            safeSet(SESSION_ENDED_KEY, String(Date.now()));
            setIsLoading(false);
            router.push("/");
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            loginWithToken,
            register,
            logout,
            fetchUser,
            isAuthenticated: !!user,
            isLoading,
            sessionExpired,
            sessionEndReason,
            clearSessionExpired,
            expireSession
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
