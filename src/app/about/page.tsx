"use client";

import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { Target, Eye, Users, Award } from "lucide-react";
import Image from "next/image";

const teamMembers = [
    { name: "Management Team", role: "Leadership", image: "/assets/IMG_5624.JPG", desc: "Guiding our strategic vision with decades of industry expertise." },
    { name: "Operations Staff", role: "Logistics", image: "/assets/IMG_5623.JPG", desc: "Ensuring efficient handling and timely delivery of every shipment." },
    { name: "Customer Support", role: "Service", image: "/assets/IMG_5626.JPG", desc: "Dedicated to providing personalized assistance 24/7." },
];

const capabilities = [
    { title: "Global Reach", icon: "/assets/global-marketing.png", desc: "Connecting you to over 25 countries with our expansive network." },
    { title: "Ocean Freight", icon: "/assets/ocean-freight.png", desc: "Reliable sea shipping solutions for large volume cargo." },
    { title: "Air Freight", icon: "/assets/air-cargo.png", desc: "Fast and efficient air transport for time-sensitive shipments." },
];

export default function AboutPage() {
    return (
        <>
            <Navbar />
            <main className="bg-white">
                {/* Hero / Who Are We */}
                <section className="pt-32 pb-20">
                    <div className="container mx-auto px-4">
                        <div className="grid lg:grid-cols-2 gap-12 items-center py-10">
                            {/* Left: Content */}
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold text-black mb-6">
                                    Who Are We?
                                </h1>
                                <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                                    At Clinette Shipping & Logistics™, we are committed to providing reliable, efficient, and customer-focused shipping solutions that connect businesses and individuals across international markets. We specialize in freight forwarding, cargo consolidation, procurement support, repackaging, and end-to-end logistics services designed to make global shipping simple and stress-free.
                                </p>
                                <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                                    With a strong focus on transparency, professionalism, and timely delivery, we help our clients move goods from overseas suppliers to their final destination with confidence. Whether you are importing personal effects, commercial cargo, furniture, electronics, event equipment, or wholesale goods, our experienced team ensures that every shipment is handled with care and attention to detail.
                                </p>
                                <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                                    At Clinette Shipping, we understand that every shipment represents an investment. That is why we provide regular updates, responsive customer support, and tailored logistics solutions to meet the unique needs of each client. Our commitment to excellence has earned us the trust of businesses, entrepreneurs, and families who rely on us for dependable shipping services.
                                </p>
                                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                                    Our mission is to simplify international trade and logistics by delivering secure, affordable, and efficient shipping solutions while building lasting relationships with our customers through integrity, accountability, and exceptional service.
                                </p>

                                {/* Social Proof */}
                                <div className="flex items-center gap-4">
                                    <div className="flex -space-x-4">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500">
                                                U{i}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-black font-semibold">
                                        <span className="text-[#039B81]">800+</span> Happy Clients
                                    </div>
                                </div>
                            </div>

                            {/* Right: Image */}
                            <div className="relative h-[400px] lg:h-[500px] rounded-3xl overflow-hidden shadow-sm">
                                <Image
                                    src="/assets/inc.JPG"
                                    alt="Who We Are"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mission / Capabilities */}
                <section className="py-20 bg-gray-50">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
                                Connecting China and Ghana Through Reliable Logistics
                            </h2>
                            <p className="text-gray-600 max-w-2xl mx-auto">
                                We leverage our deep industry knowledge and robust network to provide superior shipping services.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {capabilities.map((cap, idx) => (
                                <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                    <div className="w-14 h-14 bg-[#039B81]/10 rounded-xl flex items-center justify-center mb-6 p-2">
                                        <Image src={cap.icon} alt={cap.title} width={40} height={40} className="w-full h-full object-contain" />
                                    </div>
                                    <h3 className="text-xl font-bold text-black mb-3">{cap.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {cap.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Team Section */}
                <section className="py-20">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            {/* <span className="inline-block px-4 py-1 bg-[#039B81]/10 text-[#039B81] rounded-full text-sm font-semibold mb-4">
                                OUR TEAM MEMBERS
                            </span> */}
                            <h2 className="text-3xl md:text-4xl font-bold text-black">
                                Dedicated Professionals Driving Our Success
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {teamMembers.map((member, idx) => (
                                <div key={idx} className="group">
                                    <div className="relative h-64 mb-6 rounded-2xl overflow-hidden shadow-lg">
                                        <Image
                                            src={member.image}
                                            alt={member.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                    </div>
                                    <h3 className="text-xl font-bold text-black mb-1">{member.name}</h3>
                                    <span className="text-[#039B81] font-medium block mb-2">{member.role}</span>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        {member.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

            </main>
            <Footer />
        </>
    );
}

