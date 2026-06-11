"use client";

import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { Phone, Mail, MapPin, Clock, Send, MessageCircle, ExternalLink } from "lucide-react";
import { useState } from "react";
import { submitContact } from "@/services/contact";

const phoneDepartments = [
    { label: "Update Department", number: "+233 54 901 4200" },
    { label: "Invoice Department", number: "+233 55 216 1900" },
    { label: "Accra Warehouse", number: "+233 54 900 9957" },
    { label: "Kumasi Warehouse", number: "+233 59 197 6752" },
    { label: "Air Cargo", number: "+233 54 486 8482" },
];

const contactInfo = [
    {
        icon: Phone,
        title: "Phone Lines",
        details: ["+233 54 901 4200", "+233 55 216 1900"],
        action: "tel:+233549014200",
    },
    {
        icon: Mail,
        title: "Email",
        details: ["info@incshipping.com", "support@incshipping.com"],
        action: "mailto:info@incshipping.com",
    },
    {
        icon: MapPin,
        title: "Address",
        details: ["Accra Warehouse", "Kumasi Warehouse"],
        action: "#phone-lines",
    },
    {
        icon: Clock,
        title: "Working Hours",
        details: ["Mon – Fri: 8:00 AM – 6:00 PM", "Sat: 9:00 AM – 2:00 PM"],
        action: "#",
    },
];

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

    const handleCopy = (number: string) => {
        navigator.clipboard.writeText(number);
        setCopiedNumber(number);
        setTimeout(() => setCopiedNumber(null), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSuccessMsg("");
        setErrorMsg("");
        try {
            const result = await submitContact({
                name: formData.name,
                email: formData.email,
                phone: formData.phone || undefined,
                subject: formData.subject,
                message: formData.message,
            });
            setSuccessMsg(result.message || "Thank you for your message! We will get back to you soon.");
            setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || "Failed to send message. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <>
            <Navbar />
            <main>
                {/* Hero */}
                <section className="pt-32 pb-10 bg-white shadow-sm">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">Contact Us</h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Have questions? We&apos;d love to hear from you. Get in touch with our team.
                        </p>
                    </div>
                </section>

                {/* Quick Info Cards */}
                <section className="py-12 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {contactInfo.map((info) => (
                                <a
                                    key={info.title}
                                    href={info.action}
                                    className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow text-center"
                                >
                                    <div className="w-14 h-14 bg-[#039B81]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <info.icon className="text-[#039B81]" size={28} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{info.title}</h3>
                                    {info.details.map((detail, idx) => (
                                        <p key={idx} className="text-gray-600 text-sm">{detail}</p>
                                    ))}
                                </a>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Official Phone Numbers */}
                <section id="phone-lines" className="py-10 bg-gray-50">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                            <div className="bg-[#039B81] px-6 py-4 flex items-center gap-3">
                                <Phone className="text-white" size={22} />
                                <h2 className="text-white font-bold text-xl">Official Phone Numbers</h2>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {phoneDepartments.map((dept, idx) => (
                                    <div key={idx} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                                        <div>
                                            <p className="text-gray-500 text-xs uppercase font-semibold mb-0.5">{dept.label}</p>
                                            <a
                                                href={`tel:${dept.number.replace(/\s/g, "")}`}
                                                className="text-gray-900 font-mono font-semibold text-base hover:text-[#039B81] transition-colors"
                                            >
                                                {dept.number}
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={`tel:${dept.number.replace(/\s/g, "")}`}
                                                className="p-2 bg-[#039B81]/10 hover:bg-[#039B81]/20 text-[#039B81] rounded-full transition-colors"
                                                title="Call"
                                            >
                                                <Phone size={16} />
                                            </a>
                                            <button
                                                onClick={() => handleCopy(dept.number)}
                                                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors text-xs font-semibold"
                                                title="Copy number"
                                            >
                                                {copiedNumber === dept.number ? (
                                                    <span className="text-green-600">✓</span>
                                                ) : (
                                                    <span>Copy</span>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* WhatsApp Channel */}
                        <div className="mt-6 bg-[#25D366] rounded-2xl shadow-md overflow-hidden">
                            <div className="px-6 py-5 flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white/20 p-3 rounded-full">
                                        <MessageCircle className="text-white" size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">WhatsApp Channel</h3>
                                        <p className="text-white/80 text-sm">Follow I&C Shipping &amp; Logistics 🇨🇳🇬🇭 for updates</p>
                                    </div>
                                </div>
                                <a
                                    href="https://whatsapp.com/channel/0029VbAo4TQAzNbn6WIMfO3R"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-white text-[#25D366] font-bold px-5 py-2.5 rounded-full hover:bg-gray-50 transition-colors text-sm shadow"
                                >
                                    Follow Channel <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact Form & Info */}
                <section className="py-16 bg-gray-50">
                    <div className="container mx-auto px-4">
                        <div className="grid lg:grid-cols-2 gap-12">
                            {/* Form */}
                            <div className="bg-white rounded-2xl p-8 shadow-sm">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6">Send us a Message</h2>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#039B81] focus:border-transparent outline-none transition"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#039B81] focus:border-transparent outline-none transition"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#039B81] focus:border-transparent outline-none transition"
                                                placeholder="+233 XX XXX XXXX"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                            <select
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#039B81] focus:border-transparent outline-none transition"
                                            >
                                                <option value="">Select a subject</option>
                                                <option value="quote">Get a Quote</option>
                                                <option value="tracking">Tracking Inquiry</option>
                                                <option value="support">Customer Support</option>
                                                <option value="partnership">Business Partnership</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Message</label>
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            rows={5}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#039B81] focus:border-transparent outline-none transition resize-none"
                                            placeholder="How can we help you?"
                                        />
                                    </div>
                                    {successMsg && <div className="p-3 bg-green-50 text-green-700 text-sm font-medium rounded-lg">{successMsg}</div>}
                                    {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg">{errorMsg}</div>}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#039B81] hover:bg-[#026b5a] focus:bg-[#026b5a] disabled:bg-slate-300 text-white font-semibold rounded-lg transition-colors"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Send size={20} />
                                        )}
                                        {isSubmitting ? "Sending..." : "Send Message"}
                                    </button>
                                </form>
                            </div>

                            {/* Location Info */}
                            <div className="space-y-6">
                                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                                    <div className="bg-gray-800 px-6 py-4">
                                        <h3 className="text-white font-bold text-lg">Ghana Offices</h3>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-start gap-3">
                                            <MapPin className="text-[#039B81] mt-1 flex-shrink-0" size={18} />
                                            <div>
                                                <p className="font-semibold text-gray-800">Accra Warehouse</p>
                                                <p className="text-gray-600 text-sm">Accra, Ghana</p>
                                                <a href="tel:+233549009957" className="text-[#039B81] text-sm font-mono hover:underline">+233 54 900 9957</a>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <MapPin className="text-[#FC6100] mt-1 flex-shrink-0" size={18} />
                                            <div>
                                                <p className="font-semibold text-gray-800">Kumasi Warehouse</p>
                                                <p className="text-gray-600 text-sm">Kumasi, Ghana</p>
                                                <a href="tel:+233591976752" className="text-[#FC6100] text-sm font-mono hover:underline">+233 59 197 6752</a>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <MapPin className="text-blue-500 mt-1 flex-shrink-0" size={18} />
                                            <div>
                                                <p className="font-semibold text-gray-800">Air Cargo Office</p>
                                                <p className="text-gray-600 text-sm">Accra, Ghana</p>
                                                <a href="tel:+233544868482" className="text-blue-500 text-sm font-mono hover:underline">+233 54 486 8482</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Clock className="text-[#039B81]" size={20} />
                                        <h3 className="font-bold text-gray-800 text-lg">Working Hours</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Monday – Friday</span>
                                            <span className="font-semibold text-gray-800">8:00 AM – 6:00 PM</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Saturday</span>
                                            <span className="font-semibold text-gray-800">9:00 AM – 2:00 PM</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Sunday</span>
                                            <span className="font-semibold text-gray-500">Closed</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
