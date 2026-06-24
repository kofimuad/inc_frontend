"use client";

import Image from "next/image";

const features = [
    {
        icon: "/assets/review.png",
        title: "Reliable Service",
        description: "Consistent on-time deliveries with real-time tracking for complete transparency.",
    },
    {
        icon: "/assets/patronage.png",
        title: "Secure Handling",
        description: "Your cargo is protected with our comprehensive insurance and secure facilities.",
    },
    {
        icon: "/assets/courier-services.png",
        title: "Fast Delivery",
        description: "Optimized routes and efficient processes ensure your shipments arrive quickly.",
    },
    {
        icon: "/assets/customer-support.png",
        title: "24/7 Support",
        description: "Our dedicated team is always available to assist you with any inquiries.",
    },
];

export default function WhyChooseUs() {
    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Why Choose Clinette Shipping?
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        With years of experience in the logistics industry, we have built a reputation for excellence and reliability. Here's what sets us apart:
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {features.map((feature) => (
                        <div key={feature.title} className="flex gap-4 p-6 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-[#039B81]/10 rounded-xl flex items-center justify-center p-2">
                                    <Image src={feature.icon} alt={feature.title} width={32} height={32} className="w-full h-full object-contain" />
                                </div>
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
