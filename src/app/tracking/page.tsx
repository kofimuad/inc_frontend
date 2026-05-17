"use client";

import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { Package, Search, Truck, CheckCircle, Clock, MapPin } from "lucide-react";
import { useState } from "react";
import { getPublicTracking } from "@/services/shipments";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const formatLocation = (loc: any) => {
    if (!loc) return "N/A";
    if (typeof loc === 'string') return loc;
    const parts = [loc.city, loc.country].filter(Boolean);
    return parts.join(', ') || loc.address || "N/A";
};

function formatDate(date?: string | Date | null): string {
    if (!date) return "—";
    try {
        return new Date(date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return "—";
    }
}

function fakeContainerRef(id: string): string {
    if (!id) return "ICL-PENDING";
    return "ICL-" + id.slice(-6).toUpperCase();
}

// Map status to timeline props
const getStatusDisplay = (status: string) => {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
};

function TrackingContent() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get("q") || "";
    const [trackingNumber, setTrackingNumber] = useState(initialQuery);
    const [isSearching, setIsSearching] = useState(false);
    const [result, setResult] = useState<null | "found" | "not-found">(null);
    const [shipment, setShipment] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (trackingNumber.trim()) {
            setIsSearching(true);
            try {
                // API returns { shipment, events }
                const data = await getPublicTracking(trackingNumber);
                setShipment(data);
                setEvents(data?.timeline || []);
                setResult("found");
            } catch (error) {
                console.error("Tracking API Error", error);
                setShipment(null);
                setEvents([]);
                setResult("not-found");
            } finally {
                setIsSearching(false);
            }
        }
    };

    return (
        <main className="bg-slate-50 min-h-screen">
            {/* Hero Section */}
            <section className="bg-white pt-32 pb-20 border-b border-slate-100">
                <div className="container mx-auto px-4 mt-10">
                    <div className="max-w-2xl mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                            Track Your Shipment
                        </h1>
                        <p className="text-lg text-slate-500 font-medium mb-12">
                            Enter your tracking number to get real-time updates on your package
                        </p>

                        {/* Tracking Form */}
                        <form onSubmit={handleTrack} className="bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl shadow-slate-200 border border-slate-100">
                            <div className="relative flex-grow">
                                <Package className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Enter your tracking number"
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                    className="w-full pl-14 pr-4 py-4 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 focus:bg-white focus:border-[#039B81]/30 transition-all font-medium text-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSearching}
                                className="flex items-center justify-center gap-2 px-8 py-4 bg-[#039B81] hover:bg-[#027a65] disabled:bg-slate-300 disabled:shadow-none text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#039B81]/20 shrink-0"
                            >
                                {isSearching ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Search size={18} />
                                )}
                                <span>{isSearching ? "Searching..." : "Track Item"}</span>
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Results Section */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    {result === null && (
                        <div className="max-w-2xl mx-auto text-center py-12">
                            <Truck className="mx-auto mb-4 text-gray-300" size={64} />
                            <h2 className="text-xl font-semibold text-gray-600 mb-2">Enter a Tracking Number</h2>
                            <p className="text-gray-500">Your shipment details will appear here once you search</p>
                        </div>
                    )}

                    {result === "not-found" && (
                        <div className="max-w-2xl mx-auto text-center py-12">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Package className="text-red-500" size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Tracking Number Not Found</h2>
                            <p className="text-slate-500 font-medium mb-6">
                                We couldn't find a shipment with the tracking number <span className="font-bold">"{trackingNumber}"</span>.
                                Please check the number and try again.
                            </p>
                            <p className="text-sm text-slate-400 font-medium">
                                If you believe this is an error, please <a href="/contact" className="text-[#039B81] hover:underline font-bold uppercase tracking-widest text-[10px]">Contact Support</a>.
                            </p>
                        </div>
                    )}

                    {result === "found" && shipment && (() => {
                        const tracking = shipment.waybillNo || shipment.trackingNumber || "—";
                        const dateReceived = shipment.receivedAt || shipment.dates?.receivedAt || shipment.createdAt;
                        const dateLoaded = shipment.loadingDate || shipment.shippedAt || shipment.dates?.shippedAt;
                        const cbm = shipment.cbm || shipment.cargo?.cbm;
                        const productName = shipment.productDescription || shipment.description || shipment.goodsType || "—";
                        const qty = shipment.quantity ?? shipment.itemsCount ?? 0;
                        const batchId = shipment.shippedBatch?._id || shipment.intakeBatch?._id || shipment._id || shipment.id || "";
                        const container = fakeContainerRef(batchId);
                        const eta = shipment.estimatedDelivery || shipment.dates?.estimatedDelivery || shipment.eta;
                        const statusLabel = getStatusDisplay(shipment.status?.code || shipment.status);

                        return (
                        <div className="max-w-5xl mx-auto">
                            {/* Shipment Table */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-8 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tracking Number</p>
                                        <p className="text-xl font-black text-slate-800 tracking-tight font-mono">{tracking}</p>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-[#039B81]/10 rounded-xl self-start sm:self-auto">
                                        <div className="w-2 h-2 bg-[#039B81] rounded-full animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#039B81]">{statusLabel}</span>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/60">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">Date Received</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">Date Loaded</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">CBM</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">Product Name</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">Packages</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">Container No.</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">ETA</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="hover:bg-slate-50/60 transition-colors">
                                                <td className="px-6 py-5 text-sm font-medium text-slate-600 tabular-nums whitespace-nowrap">{formatDate(dateReceived)}</td>
                                                <td className="px-6 py-5 text-sm font-medium text-slate-600 tabular-nums whitespace-nowrap">{formatDate(dateLoaded)}</td>
                                                <td className="px-6 py-5 text-sm font-bold text-slate-700 tabular-nums">
                                                    {cbm != null ? <>{cbm} <span className="text-[10px] font-medium text-slate-400">m³</span></> : <span className="text-slate-300">—</span>}
                                                </td>
                                                <td className="px-6 py-5 text-sm font-medium text-slate-700 max-w-[200px] truncate" title={productName}>{productName}</td>
                                                <td className="px-6 py-5">
                                                    <span className="text-sm font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">{qty}</span>
                                                </td>
                                                <td className="px-6 py-5 text-sm font-bold text-[#039B81] font-mono">{container}</td>
                                                <td className="px-6 py-5 text-sm font-medium text-slate-600 tabular-nums whitespace-nowrap">{formatDate(eta)}</td>
                                                <td className="px-6 py-5">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#039B81]/10 text-[#039B81]">
                                                        {statusLabel}
                                                    </span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8">Shipment Timeline</h3>
                                {events.length > 0 ? (
                                    <div className="space-y-0">
                                        {events.map((event: any, index: number) => {
                                            const isLatest = index === 0;
                                            const isCompleted = index > 0;
                                            
                                            return (
                                                <div key={event._id || event.id || index} className="flex gap-4">
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                            isLatest ? "bg-[#039B81]" : isCompleted ? "bg-[#10b981]" : "bg-gray-200"
                                                        }`}>
                                                            {isLatest ? (
                                                                <Truck className="text-white" size={16} />
                                                            ) : isCompleted ? (
                                                                <CheckCircle className="text-white" size={16} />
                                                            ) : (
                                                                <Clock className="text-slate-400" size={16} />
                                                            )}
                                                        </div>
                                                        {index < events.length - 1 && (
                                                            <div className={`w-0.5 h-12 ${isCompleted ? "bg-[#10b981]" : "bg-slate-200"}`} />
                                                        )}
                                                    </div>
                                                    <div className="pb-8">
                                                        <p className={`font-black text-sm uppercase tracking-wide ${isLatest ? "text-[#039B81]" : "text-slate-800"}`}>
                                                            {getStatusDisplay(event.status)}
                                                        </p>
                                                        <p className="text-xs text-slate-500 font-medium font-mono mt-0.5">
                                                            {event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                                                        </p>
                                                        {event.location && (
                                                            <div className="flex items-center gap-1 text-xs text-slate-400 font-medium mt-1">
                                                                <MapPin size={12} />
                                                                <span>{formatLocation(event.location)}</span>
                                                            </div>
                                                        )}
                                                        {event.note && (
                                                            <p className="text-xs text-slate-500 mt-1">{event.note}</p>
                                                        )}
                                                        {event.carrier && (
                                                            <p className="text-xs text-slate-400 mt-0.5">Carrier: {event.carrier}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-slate-400 text-sm font-medium text-center py-8">No tracking events recorded yet.</p>
                                )}
                            </div>
                        </div>
                    );
                    })()}
                </div>
            </section>
        </main>
    );
}

export default function TrackingPage() {
    return (
        <>
            <Navbar />
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                <TrackingContent />
            </Suspense>
            <Footer />
        </>
    );
}
