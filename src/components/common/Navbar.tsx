"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight, Globe, TrendingUp } from "lucide-react";

const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Container Loadings", href: "/container-loadings" },
    { name: "Cost Calculator", href: "/calculator" },
    { name: "Shipping Address", href: "/address" },
    { name: "Contact", href: "/contact" },
];

const tickerItems = [
    { type: "news", text: "Port of Tema expands capacity for 2026 shipments." },
    { type: "rate", text: "USD: 12.45 GHC" },
    { type: "news", text: "New direct shipping route from Shenzhen to Accra launched." },
    { type: "rate", text: "EUR: 13.52 GHC" },
    { type: "news", text: "I&C Logistics wins 'Best Clearing Agent' award." },
    { type: "rate", text: "RMB: 1.72 GHC" },
    { type: "news", text: "Holiday Schedule: Port operations remain open 24/7." },
];

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    
    // Check if the current route is a dashboard page
    const isDashboard = pathname?.startsWith('/dashboard');

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
                                    width={240}
                                    height={80}
                                    className="w-auto h-12 lg:h-20 object-contain"
                                    style={{ width: 'auto', height: 'auto' }}
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
                            <div className="hidden lg:flex items-center gap-4">
                                <Link
                                    href="/auth/login"
                                    className="px-5 py-2 rounded-lg border-1 border-[#039B81] text-[#039B81] hover:bg-[#039B81] hover:text-white transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/contact"
                                    className="px-5 py-2 bg-[#039B81] border-1 border-[#039B81] text-white rounded-lg hover:text-[#039B81] hover:bg-white transition-colors flex items-center gap-2"
                                >
                                    Get Quote
                                    <ArrowUpRight size={18} />
                                </Link>
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
