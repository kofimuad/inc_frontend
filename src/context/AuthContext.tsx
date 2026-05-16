"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api, { setAccessToken } from "@/services/api";
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
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

    const login = async (credentials: { email: string; password: string }) => {
        try {
            setIsLoading(true);
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
            isLoading
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
