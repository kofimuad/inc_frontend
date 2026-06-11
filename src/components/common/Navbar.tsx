"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight, Globe, TrendingUp, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getTickerItems, TickerItem } from "@/utils/ticker";

const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Container Loadings", href: "/container-loadings" },
    { name: "Cost Calculator", href: "/calculator" },
    { name: "Shipping Address", href: "/address" },
    { name: "Contact", href: "/contact" },
];


export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuth();

    const isDashboard = pathname?.startsWith('/dashboard');

    const dashboardHref = user?.role === "admin"
        ? "/dashboard/admin"
        : user?.role === "employee"
            ? "/dashboard/employee"
            : "/dashboard/customer";

    useEffect(() => {
        // Load ticker items on mount and whenever admin updates them
        const load = () => setTickerItems(getTickerItems());
        load();
        window.addEventListener("ticker-updated", load);
        return () => window.removeEventListener("ticker-updated", load);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header className="fixed top-0 z-50 w-full transition-all duration-300">
            {/* Top Ticker Bar */}
            <div className={`bg-[#000322] text-white text-[11px] md:text-sm font-medium transition-all duration-300 overflow-hidden ${(scrolled && !isDashboard) ? 'max-h-0 opacity-0 py-0' : 'max-h-12 opacity-100 py-2.5'}`}>
                <div className="relative flex overflow-hidden group">
                    <div className="animate-ticker flex whitespace-nowrap w-max">
                        {/* First set of items */}
                        {tickerItems.map((item, i) => (
                            <div key={`ticker-1-${i}`} className="flex items-center mx-6">
                                {item.type === 'news' ? (
                                    <Globe size={14} className="text-[#039B81] mr-2 shrink-0" />
                                ) : (
                                    <TrendingUp size={14} className="text-[#FC6100] mr-2 shrink-0" />
                                )}
                                <span>{item.text}</span>
                            </div>
                        ))}
                        {/* Duplicate set for seamless looping */}
                        {tickerItems.map((item, i) => (
                            <div key={`ticker-2-${i}`} className="flex items-center mx-6">
                                {item.type === 'news' ? (
                                    <Globe size={14} className="text-[#039B81] mr-2 shrink-0" />
                                ) : (
                                    <TrendingUp size={14} className="text-[#FC6100] mr-2 shrink-0" />
                                )}
                                <span>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Navigation (Hidden on Dashboard) */}
            {!isDashboard && (
                <nav className={`transition-all duration-300 border-b border-white/10 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent backdrop-blur-md'}`}>
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between h-16 lg:h-20">
                            {/* Logo */}
                            <Link href="/" className="flex items-center gap-3">
                                <Image
                                    src="/assets/inc_logo.png"
                                    alt="I&C Shipping and Logistics"
                                    width={160}
                                    height={52}
                                    className="h-8 w-auto lg:h-12 object-contain"
                                    priority
                                />
                            </Link>

                            {/* Desktop Navigation */}
                            <div className="hidden lg:flex items-center gap-8">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className={` transition-colors ${scrolled ? 'text-[#000322] text-sm hover:text-[#027a65]' : 'text-slate-800 hover:text-[#039B81]'}`}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>

                            {/* CTA Buttons */}
                            <div className="hidden lg:flex items-center gap-3">
                                {isAuthenticated && user ? (
                                    <>
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#039B81]/10">
                                            <div className="w-7 h-7 rounded-full bg-[#039B81] text-white flex items-center justify-center text-sm font-bold shrink-0">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-medium text-[#039B81]">
                                                {user.name.split(" ")[0]}
                                            </span>
                                        </div>
                                        <Link
                                            href={dashboardHref}
                                            className="flex items-center gap-2 px-5 py-2 rounded-lg border border-[#039B81] text-[#039B81] hover:bg-[#039B81] hover:text-white transition-colors"
                                        >
                                            <LayoutDashboard size={16} />
                                            Dashboard
                                        </Link>
                                        <button
                                            onClick={() => logout()}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Logout"
                                        >
                                            <LogOut size={18} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            href="/auth/login"
                                            className="px-5 py-2 rounded-lg border border-[#039B81] text-[#039B81] hover:bg-[#039B81] hover:text-white transition-colors"
                                        >
                                            Login
                                        </Link>
                                        <Link
                                            href="/contact"
                                            className="px-5 py-2 bg-[#039B81] border border-[#039B81] text-white rounded-lg hover:text-[#039B81] hover:bg-white transition-colors flex items-center gap-2"
                                        >
                                            Get Quote
                                            <ArrowUpRight size={18} />
                                        </Link>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="lg:hidden p-2 text-[#000322]"
                                aria-label="Toggle menu"
                            >
                                {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                            </button>
                        </div>

                        {/* Mobile Navigation */}
                        {mobileMenuOpen && (
                            <div className="lg:hidden pb-6 border-t animate-in slide-in-from-top duration-300 bg-white">
                                <div className="flex flex-col gap-2 pt-4">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.name}
                                            href={link.href}
                                            className="px-4 py-3 text-[#000322] hover:bg-slate-50 rounded-lg font-bold transition-colors"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            {link.name}
                                        </Link>
                                    ))}
                                    <div className="flex flex-col gap-3 mt-4 px-4">
                                        {isAuthenticated && user ? (
                                            <>
                                                <div className="flex items-center gap-3 px-2 py-3 rounded-lg bg-[#039B81]/10">
                                                    <div className="w-8 h-8 rounded-full bg-[#039B81] text-white flex items-center justify-center font-bold shrink-0">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-[#039B81] text-sm">{user.name}</p>
                                                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                                                    </div>
                                                </div>
                                                <Link
                                                    href={dashboardHref}
                                                    className="w-full text-center px-5 py-3 border-2 border-[#039B81] text-[#039B81] rounded-lg font-bold flex items-center justify-center gap-2"
                                                    onClick={() => setMobileMenuOpen(false)}
                                                >
                                                    <LayoutDashboard size={18} />
                                                    Dashboard
                                                </Link>
                                                <button
                                                    onClick={() => { setMobileMenuOpen(false); logout(); }}
                                                    className="w-full text-center px-5 py-3 border-2 border-red-400 text-red-500 rounded-lg font-bold flex items-center justify-center gap-2"
                                                >
                                                    <LogOut size={18} />
                                                    Logout
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <Link
                                                    href="/auth/login"
                                                    className="w-full text-center px-5 py-3 border-2 border-[#039B81] text-[#039B81] rounded-lg font-bold"
                                                    onClick={() => setMobileMenuOpen(false)}
                                                >
                                                    Login
                                                </Link>
                                                <Link
                                                    href="/contact"
                                                    className="w-full justify-center px-5 py-3 bg-[#039B81] text-white rounded-lg font-bold shadow-lg shadow-[#039B81]/20 flex items-center gap-2"
                                                    onClick={() => setMobileMenuOpen(false)}
                                                >
                                                    Get Quote
                                                    <ArrowUpRight size={18} />
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </nav>
            )}
        </header>
    );
}
