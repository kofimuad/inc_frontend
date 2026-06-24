"use client";

import Image from "next/image";

const AuthSlider = () => (
    <div className="absolute inset-0 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-70">
            <Image
                src="/assets/Shipping-from-China-to-Ghana.webp"
                alt="Clinette Logistics"
                fill
                className="object-cover"
                priority
                sizes="50vw"
            />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#000322]/60 to-transparent pointer-events-none" />
    </div>
);

export default AuthSlider;
