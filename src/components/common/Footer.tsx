import Link from "next/link";
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin } from "lucide-react";

const TiktokIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.04.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.23-.9 4.4-2.32 5.92-1.53 1.63-3.69 2.64-5.91 2.87-2.31.24-4.71-.16-6.68-1.44-1.89-1.22-3.21-3.23-3.61-5.46-.46-2.61.12-5.44 1.72-7.46 1.34-1.68 3.39-2.72 5.56-3.05.35-.05.7-.09 1.05-.12v4.02c-1.74.2-3.24 1.39-3.9 3.02-.67 1.64-.47 3.66.52 5.12.98 1.45 2.8 2.27 4.56 2.05 1.71-.21 3.12-1.46 3.66-3.09.43-1.32.33-2.78.33-4.17V.02z" />
    </svg>
);

const WhatsappIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M12.031 0C5.385 0 0 5.388 0 12.034c0 2.128.552 4.195 1.6 6.017L.203 24l6.096-1.597a12.051 12.051 0 0 0 5.732 1.442h.005c6.645 0 12.033-5.387 12.033-12.033 0-3.218-1.252-6.246-3.528-8.524A11.968 11.968 0 0 0 12.031 0zm0 21.849h-.004a10.024 10.024 0 0 1-5.111-1.39l-.367-.218-3.799 1.002.996-3.705-.24-.38a10.038 10.038 0 0 1-1.53-5.308c0-5.545 4.514-10.059 10.059-10.059 2.686 0 5.21 1.045 7.108 2.945 1.898 1.898 2.943 4.42 2.943 7.11 0 5.545-4.515 10.062-10.055 10.062zm5.518-7.53c-.303-.152-1.791-.884-2.068-.985-.278-.1-.481-.151-.682.152-.202.302-.782.984-.96 1.185-.177.202-.355.228-.658.076-1.558-.781-2.73-1.637-3.766-3.136-.201-.302-.021-.466.13-.617.135-.136.303-.353.454-.53.15-.176.2-.303.303-.505.101-.202.05-.38-.026-.531-.076-.151-.682-1.644-.935-2.25-.246-.594-.496-.513-.682-.522l-.582-.01c-.202 0-.53.076-.808.38-.278.303-1.06 1.034-1.06 2.522 0 1.488 1.086 2.926 1.237 3.128.152.202 2.133 3.253 5.168 4.56.721.31 1.283.495 1.722.634.723.23 1.382.197 1.902.12.582-.086 1.791-.732 2.043-1.439.253-.706.253-1.31.177-1.438-.076-.128-.278-.204-.582-.356z" />
    </svg>
);

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
                        <h3 className="text-xl font-bold mb-4 text-[#039B81]">Clinette Shipping & Logistics</h3>
                        <p className="text-gray-300 mb-4 leading-relaxed">
                            Your trusted partner for all freight and logistics needs. We deliver excellence across air, sea, and land.
                        </p>
                        <div className="flex gap-4">
                            <a href="https://www.facebook.com/people/Clinette-Shipping-and-Logistics/100070166457076/" target="blank" rel="noopener noreferrer" className="text-gray-300 hover:text-[#039B81] transition-colors">
                                <Facebook size={20} />
                            </a>
                            <a href="https://www.tiktok.com/@clinetteshipping?_r=1&_t=ZS-97VOcUXpw3x" target="blank" rel="noopener noreferrer" className="text-gray-300 hover:text-[#039B81] transition-colors">
                                <TiktokIcon size={20} />
                            </a>
                            <a href="https://www.instagram.com/clinette_shipping_logistics?igsh=MXVpYmRqbnJweHhwdg%3D%3D&utm_source=qr" target="blank" rel="noopener noreferrer" className="text-gray-300 hover:text-[#039B81] transition-colors">
                                <Instagram size={20} />
                            </a>
                            <a href="" target="blank" rel="noopener noreferrer" className="text-gray-300 hover:text-[#039B81] transition-colors">
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
                                <span className="text-gray-300">+233 55 216 1900</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-[#039B81] flex-shrink-0" />
                                <span className="text-gray-300">clinetteshipping@gmail.com</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <WhatsappIcon size={18} className="text-[#039B81] flex-shrink-0" />
                                <Link
                                    href="https://whatsapp.com/channel/0029VbAo4TQAzNbn6WIMfO3R"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-300 hover:text-[#039B81] transition-colors"
                                >
                                    Join Whatsapp Channel
                                </Link>
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
                            © {new Date().getFullYear()} Clinette Shipping & Logistics. All rights reserved.
                        </p>
                        <p className="text-gray-400 text-sm">
                            Powered by YongiTechnologies
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
