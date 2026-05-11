import Link from "next/link";
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const services = [
    { name: "Air Freight", href: "/services#air-freight" },
    { name: "Ocean Freight", href: "/services#ocean-freight" },
    { name: "Customs Clearance", href: "/services#customs" },
    { name: "Procurement", href: "/services#procurement" },
    { name: "Warehousing", href: "/services#warehousing" },
];

const quickLinks = [
    { name: "About Us", href: "/about" },
    { name: "Get Quote", href: "/contact" },
    { name: "Terms & Conditions", href: "/terms" },
    { name: "Privacy Policy", href: "/privacy" },
];

export default function Footer() {
    return (
        <footer className="bg-[#000322] text-white pt-16 pb-8">
            {/* Main Footer */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-[#039B81]">I&C Shipping and Logistics</h3>
                        <p className="text-gray-300 mb-4 leading-relaxed">
                            Your trusted partner for all freight and logistics needs. We deliver excellence across air, sea, and land.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-gray-300 hover:text-[#039B81] transition-colors">
                                <Facebook size={20} />
                            </a>
                            <a href="#" className="text-gray-300 hover:text-[#039B81] transition-colors">
                                <Twitter size={20} />
                            </a>
                            <a href="#" className="text-gray-300 hover:text-[#039B81] transition-colors">
                                <Instagram size={20} />
                            </a>
                            <a href="#" className="text-gray-300 hover:text-[#039B81] transition-colors">
                                <Linkedin size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/container-loadings" className="text-gray-300 hover:text-[#039B81] transition-colors">
                                    Container Loadings
                                </Link>
                            </li>
                            <li>
                                <Link href="/address" className="text-gray-300 hover:text-[#039B81] transition-colors">
                                    Shipping Address
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal & Help */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Legal & Help</h3>
                        <ul className="space-y-2">
                            {quickLinks.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-300 hover:text-[#039B81] transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <MapPin size={18} className="text-[#039B81] mt-1 flex-shrink-0" />
                                <span className="text-gray-300">Accra, Ghana</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-[#039B81] flex-shrink-0" />
                                <span className="text-gray-300">+233 XX XXX XXXX</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-[#039B81] flex-shrink-0" />
                                <span className="text-gray-300">info@incshipping.com</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-700">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-400 text-sm">
                            © {new Date().getFullYear()} I&C Shipping and Logistics. All rights reserved.
                        </p>
                        <p className="text-gray-400 text-sm">
                            Powered by Pharasees
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
