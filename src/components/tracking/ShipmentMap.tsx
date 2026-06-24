"use client";

import React from "react";
import { MapPin, Navigation } from "lucide-react";

interface ShipmentMapProps {
    origin: string;
    destination: string;
    currentLocation: string;
}

const ShipmentMap: React.FC<ShipmentMapProps> = ({ 
    origin, 
    destination, 
    currentLocation 
}) => {
    return (
        <div className="bg-slate-100 rounded-3xl p-8 relative min-h-[400px] overflow-hidden border-2 border-white shadow-inner">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]" />
            
            {/* Visual Route Representation */}
            <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md p-4 rounded-xl border border-white shadow-sm self-start">
                    <MapPin className="text-slate-400" size={20} />
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Origin</p>
                        <p className="font-bold text-slate-800">{origin}</p>
                    </div>
                </div>

                {/* Animated Track Line */}
                <div className="flex-grow flex items-center justify-center py-10">
                    <div className="w-full max-w-lg h-1 bg-slate-200 relative rounded-full overflow-hidden">
                        <div className="absolute top-0 left-0 h-full w-2/3 bg-gradient-to-r from-[#039B81] to-[#FC6100] animate-pulse" />
                        <div className="absolute top-1/2 left-2/3 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-[#FC6100] flex items-center justify-center">
                            <Navigation className="text-[#FC6100] animate-bounce" size={14} />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-[#FC6100]/10 backdrop-blur-md p-4 rounded-xl border border-[#FC6100]/20 shadow-sm self-end">
                    <MapPin className="text-[#FC6100]" size={20} />
                    <div>
                        <p className="text-xs text-[#FC6100]/60 uppercase font-bold tracking-wider">Destination</p>
                        <p className="font-bold text-slate-800">{destination}</p>
                    </div>
                </div>
            </div>
            
            {/* Overlay Info */}
            <div className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded-full shadow-md flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">
                    Status: {currentLocation}
                </span>
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-slate-300 font-bold uppercase tracking-[1em] text-4xl opacity-20 -rotate-12">
                    CLINETTE LOGISTICS
                </p>
            </div>
        </div>
    );
};

export default ShipmentMap;
