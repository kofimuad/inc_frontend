"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api, { setAccessToken, onSessionExpired, resetSessionExpiry } from "@/services/api";
import { useRouter } from "next/navigation";

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
    clearSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionExpired, setSessionExpired] = useState(false);
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
    useEffect(() => onSessionExpired(() => {
        setUser(null);
        setSessionExpired(true);
        setIsLoading(false);
    }), []);

    const clearSessionExpired = useCallback(() => setSessionExpired(false), []);

    const login = async (credentials: { email: string; password: string }) => {
        try {
            setIsLoading(true);
            // A fresh sign-in ends the expired state and re-arms the notifier so
            // the next expiry is announced too.
            setSessionExpired(false);
            resetSessionExpiry();
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
        resetSessionExpiry();
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
            resetSessionExpiry();
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
            clearSessionExpired
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
