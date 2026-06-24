"use client";

import Button from "@/components/common/Button";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { Mail, Lock, Phone, Eye, EyeOff, ArrowLeft, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import AuthSlider from "@/components/common/AuthSlider";
import Image from "next/image";
import { phoneCheck, phoneLogin, phoneSetPassword, phoneSignup } from "@/services/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// ─── Shared helpers ────────────────────────────────────────────────────────────
function useRedirectAfterLogin() {
    const searchParams = useSearchParams();
    return {
        redirectTo: searchParams.get("redirect") || null,
        trackingParam: searchParams.get("tracking") || null,
    };
}

function useAutoRedirect() {
    const { isAuthenticated, user } = useAuth();
    const router = useRouter();
    const { redirectTo, trackingParam } = useRedirectAfterLogin();

    useEffect(() => {
        if (!isAuthenticated || !user) return;
        if (redirectTo && trackingParam) {
            router.push(`${redirectTo}?q=${encodeURIComponent(trackingParam)}`);
        } else if (redirectTo) {
            router.push(redirectTo);
        } else {
            const role = user.role?.toLowerCase();
            if (role === "admin") router.push("/dashboard/admin");
            else if (role === "employee") router.push("/dashboard/employee");
            else router.push("/dashboard/customer");
        }
    }, [isAuthenticated, user, router, redirectTo, trackingParam]);
}

// ─── Input ─────────────────────────────────────────────────────────────────────
function InputField({
    label, icon: Icon, type = "text", value, onChange, placeholder, required, autoFocus,
    rightSlot,
}: {
    label: string; icon: any; type?: string; value: string; onChange: (v: string) => void;
    placeholder?: string; required?: boolean; autoFocus?: boolean; rightSlot?: React.ReactNode;
}) {
    return (
        <div className="text-left">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{label}</label>
            <div className="relative flex items-center">
                <Icon className="absolute left-4 text-gray-400" size={18} />
                <input
                    type={type}
                    className="w-full pl-12 pr-12 py-3.5 text-sm bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 focus:bg-white focus:border-[#039B81]/30 transition-all text-gray-900"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={required}
                    autoFocus={autoFocus}
                />
                {rightSlot && <div className="absolute right-4">{rightSlot}</div>}
            </div>
        </div>
    );
}

function PasswordInput({ label = "Password", value, onChange }: { label?: string; value: string; onChange: (v: string) => void }) {
    const [show, setShow] = useState(false);
    return (
        <InputField
            label={label}
            icon={Lock}
            type={show ? "text" : "password"}
            value={value}
            onChange={onChange}
            placeholder="••••••••"
            required
            rightSlot={
                <button type="button" onClick={() => setShow(!show)} className="text-gray-400 hover:text-[#039B81] transition-colors">
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            }
        />
    );
}

function ErrorBanner({ msg }: { msg: string }) {
    return (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
            {msg}
        </div>
    );
}

// ─── Email login ───────────────────────────────────────────────────────────────
function EmailLoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            await login({ email, password });
        } catch (err: any) {
            const status = err.response?.status;
            const data = err.response?.data;
            if (status === 429) setError(data?.message || "Too many attempts. Try again later.");
            else if (status === 500) setError("Server error. Please try again later.");
            else setError(data?.message || "Invalid email or password");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => { window.location.href = `${API_BASE}/api/auth/google`; };

    return (
        <form onSubmit={handleLogin} className="space-y-6">
            {error && <ErrorBanner msg={error} />}
            <InputField label="Email" icon={Mail} type="email" value={email} onChange={setEmail} placeholder="your@email.com" required />
            <div>
                <PasswordInput value={password} onChange={setPassword} />
                <div className="flex justify-end mt-2">
                    <Link href="#" className="text-xs font-bold text-[#039B81] hover:underline">Forgot Password?</Link>
                </div>
            </div>
            <Button type="submit" isLoading={isLoading} className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] shadow-sm shadow-[#039B81]/20">
                Sign In
            </Button>
            <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Or</span>
                <div className="flex-1 h-px bg-gray-200" />
            </div>
            <button
                onClick={handleGoogleLogin}
                type="button"
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold text-gray-700"
            >
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
            </button>
        </form>
    );
}

// ─── Phone login ───────────────────────────────────────────────────────────────
type PhoneStep =
    | "enter-phone"          // Step 1: just the phone input
    | "enter-password"       // Step 2a: account exists + has password
    | "create-password"      // Step 2b: account exists, NO password → set one
    | "signup";              // Step 2c: no account → full sign-up

function PhoneLoginForm() {
    const { loginWithToken } = useAuth();
    const [step, setStep] = useState<PhoneStep>("enter-phone");
    const [phone, setPhone] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [knownName, setKnownName] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const resetToPhone = () => { setStep("enter-phone"); setError(""); setPassword(""); setConfirm(""); };

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            const result = await phoneCheck(phone.trim());
            if (!result.exists) {
                setStep("signup");
            } else if (!result.hasPassword) {
                setKnownName(result.name);
                setStep("create-password");
            } else {
                setKnownName(result.name);
                setStep("enter-password");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Could not check phone number. Try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            const data = await phoneLogin(phone.trim(), password);
            loginWithToken(data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Incorrect password.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) { setError("Passwords do not match."); return; }
        if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }
        setError("");
        setIsLoading(true);
        try {
            const data = await phoneSetPassword(phone.trim(), password, name.trim() || undefined);
            loginWithToken(data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Could not set password. Try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim())         { setError("Please enter your name."); return; }
        if (password !== confirm) { setError("Passwords do not match."); return; }
        if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }
        setError("");
        setIsLoading(true);
        try {
            const data = await phoneSignup(phone.trim(), name.trim(), password);
            loginWithToken(data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Could not create account. Try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Step 1: enter phone ───────────────────────────────────────────────────
    if (step === "enter-phone") {
        return (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
                {error && <ErrorBanner msg={error} />}
                <InputField
                    label="Phone Number"
                    icon={Phone}
                    type="tel"
                    value={phone}
                    onChange={setPhone}
                    placeholder="e.g. 0244000000"
                    required
                    autoFocus
                />
                <p className="text-xs text-gray-400 font-medium -mt-3">
                    Enter the phone number on your shipment with I&amp;C.
                </p>
                <Button type="submit" isLoading={isLoading} className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] shadow-sm shadow-[#039B81]/20">
                    Continue
                </Button>
            </form>
        );
    }

    // ── Step 2a: has password ─────────────────────────────────────────────────
    if (step === "enter-password") {
        return (
            <form onSubmit={handlePasswordLogin} className="space-y-6">
                {error && <ErrorBanner msg={error} />}
                <div className="p-4 bg-[#039B81]/5 border border-[#039B81]/10 rounded-xl">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-0.5">Signing in as</p>
                    <p className="text-sm font-black text-slate-800">{knownName || phone}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{phone}</p>
                </div>
                <PasswordInput value={password} onChange={setPassword} />
                <Button type="submit" isLoading={isLoading} className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] shadow-sm shadow-[#039B81]/20">
                    Sign In
                </Button>
                <button type="button" onClick={resetToPhone} className="w-full text-center text-xs font-bold text-gray-400 hover:text-[#039B81] transition-colors">
                    ← Use a different number
                </button>
            </form>
        );
    }

    // ── Step 2b: no password yet ──────────────────────────────────────────────
    if (step === "create-password") {
        return (
            <form onSubmit={handleSetPassword} className="space-y-5">
                {error && <ErrorBanner msg={error} />}
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-1">First time here?</p>
                    <p className="text-sm text-slate-600 font-medium">
                        We found your shipments for <span className="font-black text-slate-800">{phone}</span>.
                        Create a password to access your account.
                    </p>
                </div>
                {!knownName && (
                    <InputField label="Your Name" icon={User} value={name} onChange={setName} placeholder="e.g. Kwame Mensah" />
                )}
                <PasswordInput label="Create Password" value={password} onChange={setPassword} />
                <PasswordInput label="Confirm Password" value={confirm} onChange={setConfirm} />
                <Button type="submit" isLoading={isLoading} className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] shadow-sm shadow-[#039B81]/20">
                    Create Password &amp; Sign In
                </Button>
                <button type="button" onClick={resetToPhone} className="w-full text-center text-xs font-bold text-gray-400 hover:text-[#039B81] transition-colors">
                    ← Use a different number
                </button>
            </form>
        );
    }

    // ── Step 2c: no account → signup ──────────────────────────────────────────
    return (
        <form onSubmit={handleSignup} className="space-y-5">
            {error && <ErrorBanner msg={error} />}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">New Account</p>
                <p className="text-sm text-slate-600 font-medium">
                    No account found for <span className="font-black text-slate-800">{phone}</span>. Fill in your details to sign up.
                </p>
            </div>
            <InputField label="Full Name" icon={User} value={name} onChange={setName} placeholder="e.g. Kwame Mensah" required />
            <PasswordInput label="Create Password" value={password} onChange={setPassword} />
            <PasswordInput label="Confirm Password" value={confirm} onChange={setConfirm} />
            <Button type="submit" isLoading={isLoading} className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] shadow-sm shadow-[#039B81]/20">
                Create Account &amp; Sign In
            </Button>
            <button type="button" onClick={resetToPhone} className="w-full text-center text-xs font-bold text-gray-400 hover:text-[#039B81] transition-colors">
                ← Use a different number
            </button>
        </form>
    );
}

// ─── Tab switcher + combined form ──────────────────────────────────────────────
function LoginForm() {
    useAutoRedirect();
    const [tab, setTab] = useState<"email" | "phone">("phone");

    return (
        <div className="flex-grow flex flex-col justify-center max-w-md w-full mx-auto">
            <div className="mb-8 text-center">
                <h1 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Welcome Back</h1>
                <p className="text-gray-500 text-sm">Sign in to track and manage your shipments.</p>
            </div>

            {/* Tab toggle */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
                <button
                    type="button"
                    onClick={() => setTab("phone")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                        tab === "phone" ? "bg-white text-[#039B81] shadow-sm" : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                    <Phone size={14} />
                    Phone
                </button>
                <button
                    type="button"
                    onClick={() => setTab("email")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                        tab === "email" ? "bg-white text-[#039B81] shadow-sm" : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                    <Mail size={14} />
                    Email
                </button>
            </div>

            {tab === "phone" ? <PhoneLoginForm /> : <EmailLoginForm />}

            <div className="mt-8 text-center">
                <p className="text-gray-500 text-sm font-medium">
                    New customer?{" "}
                    <Link href="/auth/register" className="text-[#039B81] font-bold hover:underline">Register with email</Link>
                </p>
            </div>
        </div>
    );
}

// ─── Page shell ────────────────────────────────────────────────────────────────
export default function LoginPage() {
    return (
        <main className="md:h-screen md:overflow-hidden flex flex-col md:flex-row bg-white">
            <div className="w-full md:w-1/2 flex flex-col px-8 md:px-16 lg:px-24 py-12 relative md:h-full md:overflow-y-auto hide-scrollbar">
                <div className="mb-12 flex justify-center md:justify-start">
                    <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-[#039B81] transition-colors font-bold text-sm uppercase tracking-widest">
                        <ArrowLeft size={18} />
                        Go Back
                    </Link>
                </div>

                <Suspense fallback={<div className="flex-grow flex items-center justify-center text-slate-400">Loading...</div>}>
                    <LoginForm />
                </Suspense>

                <div className="mt-12 pt-8 text-xs text-gray-400 font-medium tracking-tight text-center">
                    © 2026 Clinette Shipping &amp; Logistics. All rights reserved.
                </div>
            </div>

            <div className="hidden md:block md:w-1/2 relative bg-slate-900 overflow-hidden md:h-full">
                <AuthSlider />
                <div className="absolute top-8 right-8 z-20 opacity-50">
                    <Image src="/assets/clinette.png" alt="Clinette Logo" width={180} height={60} className="object-contain" style={{ width: "auto", height: "auto" }} sizes="180px" />
                </div>
            </div>
        </main>
    );
}
