import React from "react";
import { Ship, Plane, Package, ArrowRight, Calendar, Clock } from "lucide-react";
import Link from "next/link";

// containerRef is intentionally excluded from this component.
// It is staff-only data (physical container number). Do not add it here.
interface ShipmentCardProps {
    id: string;
    trackingNumber: string;
    origin: string;
    destination: string;
    status: string;
    estimatedDelivery?: string;
    description?: string;
    packageType?: string;
    onViewDetail?: (id: string) => void;
}

const statusColors: Record<string, string> = {
    "delivered": "bg-green-100 text-green-700",
    "in_transit": "bg-blue-100 text-blue-700",
    "pending": "bg-amber-100 text-amber-700",
    "picked_up": "bg-indigo-100 text-indigo-700",
    "customs": "bg-purple-100 text-purple-700",
    "out_for_delivery": "bg-cyan-100 text-cyan-700",
    "failed": "bg-red-100 text-red-700",
    "returned": "bg-orange-100 text-orange-700",
    // Batch workflow statuses
    "in_warehouse": "bg-amber-100 text-amber-700",
    "shipped": "bg-sky-100 text-sky-700",
    "at_port": "bg-orange-100 text-orange-700",
    "ready_for_pickup": "bg-emerald-100 text-emerald-700",
    "held": "bg-teal-100 text-teal-700",
};

const ShipmentCard: React.FC<ShipmentCardProps> = ({
    id,
    trackingNumber,
    origin,
    destination,
    status,
    estimatedDelivery,
    description,
    packageType,
    onViewDetail,
}) => {
    const displayStatus = status?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN';
    const badgeClass = statusColors[status] || 'bg-gray-100 text-gray-700';
    const formattedEta = estimatedDelivery 
        ? new Date(estimatedDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'TBD';

    const Icon = packageType === 'container' ? Ship : packageType === 'document' ? Package : Package;

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl text-[10px] font-black tracking-widest uppercase ${badgeClass}`}>
                {displayStatus}
            </div>

            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                        <Icon className="text-[#039B81]" size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 tracking-tight">{trackingNumber}</h4>
                        <p className="text-xs text-slate-400 font-medium">{description || `Shipment`}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex flex-col gap-1 min-w-[80px]">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Origin</span>
                    <span className="text-sm font-bold text-slate-700 truncate">{origin}</span>
                </div>
                <div className="flex-grow flex items-center justify-center">
                    <div className="w-full h-px bg-slate-100 relative">
                        <ArrowRight className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-slate-200" size={14} />
                    </div>
                </div>
                <div className="flex flex-col gap-1 min-w-[80px] text-right">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Destination</span>
                    <span className="text-sm font-bold text-slate-700 truncate">{destination}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-dotted border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-xs font-medium text-slate-600">{formattedEta}</span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                    <Clock size={14} className="text-slate-400" />
                    <span className="text-xs font-medium text-slate-600">ETA</span>
                </div>
            </div>

            <Link 
                href={`/tracking?q=${trackingNumber}`}
                className="w-full py-2.5 text-[#039B81] font-bold text-xs uppercase tracking-widest hover:bg-[#039B81]/5 rounded-lg transition-colors border border-[#039B81]/20 flex items-center justify-center"
            >
                View Tracking Detail
            </Link>
        </div>
    );
};

export default ShipmentCard;
