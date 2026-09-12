"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { setAccessToken, setRefreshToken } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

function GoogleCallbackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { fetchUser, user, isAuthenticated } = useAuth();
    const [error, setError] = useState("");

    useEffect(() => {
        const token = searchParams.get("token");
        const rt = searchParams.get("rt");
        const errorParam = searchParams.get("error");

        if (errorParam) {
            setError("Google authentication failed. Please try again.");
            setTimeout(() => router.push("/auth/login"), 3000);
            return;
        }

        if (token) {
            // Store token in localStorage so it persists across page reloads
            setAccessToken(token);
            // Refresh-token fallback for when the cross-site cookie is dropped.
            if (rt) setRefreshToken(rt);
            // Then fetch the user profile
            fetchUser().catch(() => {
                setError("Failed to load user profile.");
                setTimeout(() => router.push("/auth/login"), 3000);
            });
        } else {
            setError("No authentication token received.");
            setTimeout(() => router.push("/auth/login"), 3000);
        }
    }, [searchParams, fetchUser, router]);

    // Redirect once user is loaded
    useEffect(() => {
        if (isAuthenticated && user) {
            const role = user.role?.toLowerCase();
            if (role === "admin" || role === "employee") router.push("/parcels");
            else router.push("/dashboard/customer");
        }
    }, [isAuthenticated, user, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                {error ? (
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <p className="text-red-600 font-semibold">{error}</p>
                        <p className="text-slate-400 text-sm">Redirecting to login...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="w-12 h-12 border-4 border-[#039B81] border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-slate-600 font-semibold">Completing sign in...</p>
                        <p className="text-slate-400 text-sm">Please wait while we verify your account.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function GoogleCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-12 h-12 border-4 border-[#039B81] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <GoogleCallbackContent />
        </Suspense>
    );
}
