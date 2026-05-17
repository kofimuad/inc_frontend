"use client";

import { useState, useEffect } from "react";
import { Search, Package } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const sliderImages = [
  "/assets/inc.JPG",
  "/assets/IMG_5623.JPG",
  "/assets/IMG_5624.JPG",
  "/assets/IMG_5626.JPG",
  "/assets/IMG_5627.JPG",
];

export default function HeroSection() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sliderImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const query = trackingNumber.trim();
    if (!query) return;
    router.push(`/tracking?q=${encodeURIComponent(query)}`);
  };

  return (
    <section className="relative bg-white pt-32 pb-20">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-16 leading-tight">
            Your Trusted Partner for
            <span className="text-[#039B81] block mt-2">Global Logistics</span>
          </h1>

          {/* Tracking Form */}
          <form
            onSubmit={handleTrack}
            className="max-w-2xl mx-auto mb-16 relative z-20"
          >
            <div className="bg-white border border-teal-100 p-2 rounded-lg shadow-sm flex flex-col sm:flex-row gap-2">
              <div className="relative grow">
                <Package
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Enter your tracking number..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 text-gray-900 rounded-md placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#039B81]"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-8 py-3 bg-[#039B81] hover:bg-[#027a65] text-white font-semibold rounded-md transition-colors"
              >
                <Search size={20} />
                <span>Track</span>
              </button>
            </div>
          </form>

          {/* Image Slider */}
          <div className="relative w-full aspect-video md:aspect-21/9 rounded-3xl overflow-hidden shadow-sm">
            {sliderImages.map((src, index) => (
              <div
                key={src}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentIndex ? "opacity-100" : "opacity-0"
                }`}
              >
                <Image
                  src={src}
                  alt={`Slide ${index + 1}`}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  sizes="100vw"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
