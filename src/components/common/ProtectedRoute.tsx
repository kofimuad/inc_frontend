"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Spinner from "./Spinner";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ("customer" | "employee" | "admin")[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, isAuthenticated, isLoading, sessionExpired, sessionEndReason } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // If not loading and not authenticated, redirect to login. A session that
        // timed out says so on arrival — previously the page simply emptied and
        // left the user to guess.
        if (!isLoading && !isAuthenticated) {
            // The reason rides along so the login page can distinguish "you were
            // idle" from "your session ended" rather than guessing.
            router.push(
                sessionExpired
                    ? `/auth/login?expired=${sessionEndReason ?? "1"}`
                    : "/auth/login"
            );
            return;
        }

        // If authenticated but role not allowed, redirect to home
        if (!isLoading && isAuthenticated && user && allowedRoles && !allowedRoles.includes(user.role)) {
            router.push("/");
        }
    }, [isAuthenticated, isLoading, user, allowedRoles, router, sessionExpired, sessionEndReason]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[200] flex flex-col items-center justify-center gap-4">
                <Spinner size="xl" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">
                    Verifying Authentication...
                </p>
            </div>
        );
    }

    // If not authenticated, don't render children (redirect will happen in useEffect)
    if (!isAuthenticated) {
        return null;
    }

    // If role not allowed, don't render children (redirect will happen in useEffect)
    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
        return null;
    }

    // User is authenticated and role is allowed
    return <>{children}</>;
}
