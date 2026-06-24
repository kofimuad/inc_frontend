"use client";

import Button from "@/components/common/Button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Mail, Lock, ArrowLeft, User, Phone, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import AuthSlider from "@/components/common/AuthSlider";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { register, user, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated && user) {
            const role = user.role?.toLowerCase();
            if (role === 'admin') router.push('/dashboard/admin');
            else if (role === 'employee') router.push('/dashboard/employee');
            else router.push('/dashboard/customer');
        }
    }, [isAuthenticated, user, router]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        setIsLoading(true);
        try {
            await register({ name, email, password, phone: phone || undefined });
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data?.errors?.join(', ') || "An error occurred during registration.";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        // Redirect to the backend's Google OAuth endpoint
        window.location.href = `${API_BASE}/api/auth/google`;
    };

    return (
        <main className="md:h-screen md:overflow-hidden flex flex-col md:flex-row bg-white">
            {/* Left Column: Form Section */}
            <div className="w-full md:w-1/2 flex flex-col px-8 md:px-16 lg:px-24 py-12 relative md:h-full md:overflow-y-auto hide-scrollbar">
                <div className="mb-12 flex justify-center md:justify-start">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-slate-500 hover:text-[#039B81] transition-colors font-bold text-sm uppercase tracking-widest"
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </Link>
                </div>

                <div className="flex-grow flex flex-col justify-center max-w-md w-full mx-auto">
                    <div className="mb-10 text-center text-gray-800">
                        <h1 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Create Account</h1>
                        <p className="text-gray-500 text-sm">Join Clinette Shipping & Logistics by creating an account.</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="text-left">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                            <div className="relative flex items-center">
                                <User className="absolute left-4 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    className="w-full pl-12 pr-4 py-3.5 text-sm bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 focus:bg-white focus:border-[#039B81]/30 transition-all text-gray-900"
                                    placeholder="John Mensah"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    minLength={2}
                                />
                            </div>
                        </div>

                        <div className="text-left">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email</label>
                            <div className="relative flex items-center">
                                <Mail className="absolute left-4 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    className="w-full pl-12 pr-4 py-3.5 text-sm bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 focus:bg-white focus:border-[#039B81]/30 transition-all text-gray-900"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="text-left">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Phone <span className="text-gray-300 normal-case">(optional)</span></label>
                            <div className="relative flex items-center">
                                <Phone className="absolute left-4 text-gray-400" size={18} />
                                <input
                                    type="tel"
                                    className="w-full pl-12 pr-4 py-3.5 text-sm bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 focus:bg-white focus:border-[#039B81]/30 transition-all text-gray-900"
                                    placeholder="+233 26 123 4567"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="text-left">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Password</label>
                            <div className="relative flex items-center">
                                <Lock className="absolute left-4 text-gray-400" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="w-full pl-12 pr-12 py-3.5 text-sm bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 focus:bg-white focus:border-[#039B81]/30 transition-all text-gray-900"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 text-gray-400 hover:text-[#039B81] transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="text-left">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Confirm Password</label>
                            <div className="relative flex items-center">
                                <Lock className="absolute left-4 text-gray-400" size={18} />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    className="w-full pl-12 pr-12 py-3.5 text-sm bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 focus:bg-white focus:border-[#039B81]/30 transition-all text-gray-900"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 text-gray-400 hover:text-[#039B81] transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" isLoading={isLoading} className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] shadow-sm shadow-[#039B81]/20 mt-4">
                            Register Now
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Or</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Google OAuth */}
                    <button
                        onClick={handleGoogleLogin}
                        type="button"
                        className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold text-gray-700"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Sign up with Google
                    </button>

                    <div className="mt-10 text-center">
                        <p className="text-gray-500 text-sm font-medium">
                            Already have an account? <Link href="/auth/login" className="text-[#039B81] font-bold hover:underline">Log in</Link>
                        </p>
                    </div>
                </div>

                <div className="mt-12 pt-8 text-xs text-gray-400 font-medium tracking-tight text-center">
                    © 2026 Clinette Shipping & Logistics. All rights reserved.
                </div>
            </div>

            {/* Right Column: Dynamic Slider Section */}
            <div className="hidden md:block md:w-1/2 relative bg-slate-900 overflow-hidden md:h-full">
                <AuthSlider />
                <div className="absolute top-8 right-8 z-20 opacity-50">
                    <Image
                        src="/assets/clinette_logo.jpg"
                        alt="Clinette Logo"
                        width={180}
                        height={60}
                        className="object-contain"
                    />
                </div>
            </div>
        </main>
    );
}
