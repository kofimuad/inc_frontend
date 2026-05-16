"use client";

import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { Ship, Anchor, Package, Search, Loader2, MapPin, Clock } from "lucide-react";
import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    listContainerLoadings,
    searchContainerLoadings,
    type ContainerLoading,
} from "@/services/containerLoadings";

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; classes: string; dot: string }> = {
    loading: { label: "Loading",            classes: "bg-yellow-100 text-yellow-700",  dot: "bg-yellow-500" },
    shipped: { label: "Shipped",            classes: "bg-blue-100 text-blue-700",      dot: "bg-blue-500" },
    arrived: { label: "Arrived",            classes: "bg-emerald-100 text-emerald-700",dot: "bg-emerald-500" },
    ready:   { label: "Ready for Pickup",   classes: "bg-[#039B81]/10 text-[#039B81]", dot: "bg-[#039B81]" },
};

function StatusBadge({ status }: { status: string }) {
    const meta = STATUS_META[status] || { label: status.toUpperCase(), classes: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${meta.classes}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
        </span>
    );
}

function ItemStatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        in_warehouse: "bg-yellow-50 text-yellow-600",
        shipped:      "bg-blue-50 text-blue-600",
        arrived:      "bg-emerald-50 text-emerald-600",
        delivered:    "bg-[#039B81]/10 text-[#039B81]",
        held:         "bg-red-50 text-red-500",
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${colors[status] || "bg-slate-100 text-slate-500"}`}>
            {status.replace(/_/g, " ")}
        </span>
    );
}

function formatDate(dateStr?: string) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Derive a public-facing reference ID from the container's DB _id.
// Real container numbers (e.g. MSBU8308501) are never shown to the public.
function publicContainerRef(id: string) {
    return "ICL-" + id.slice(-6).toUpperCase();
}

// ─── Container card — public view (no expandable items table) ─────────────────

function ContainerCard({ container }: { container: ContainerLoading }) {
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all overflow-hidden">
            <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Icon */}
                    <div className="hidden sm:flex shrink-0 w-14 h-14 bg-[#039B81]/10 rounded-2xl items-center justify-center">
                        <Ship className="text-[#039B81]" size={26} />
                    </div>

                    {/* Main info */}
                    <div className="flex-grow min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight truncate">
                                {publicContainerRef(container._id)}
                            </h3>
                            <StatusBadge status={container.status} />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 text-sm">
                            {container.vesselName && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vessel</p>
                                    <p className="font-bold text-slate-700 truncate">{container.vesselName}</p>
                                </div>
                            )}
                            {container.volume && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Volume</p>
                                    <p className="font-bold text-slate-700">{container.volume}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ETD</p>
                                <p className="font-bold text-slate-700">{formatDate(container.etd)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ETA</p>
                                <p className="font-bold text-slate-700">{formatDate(container.eta)}</p>
                            </div>
                        </div>

                        {/* Route */}
                        <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 font-medium">
                            <MapPin size={12} className="text-slate-300" />
                            <span>{container.portOfLoading}</span>
                            <span className="text-slate-300">→</span>
                            <span>{container.portOfDischarge}</span>
                        </div>

                        {container.notes && (
                            <p className="mt-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg font-medium">
                                {container.notes}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Tracking number match result card ────────────────────────────────────────

function TrackingMatchCard({ item, container }: { item: any; container: ContainerLoading }) {
    return (
        <div className="bg-[#039B81]/5 border-2 border-[#039B81]/20 rounded-3xl p-6 mb-6">
            <p className="text-[10px] font-black text-[#039B81] uppercase tracking-widest mb-3">Tracking Number Found</p>
            <div className="flex flex-wrap items-center gap-4 mb-4">
                <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Tracking Number</p>
                    <p className="font-black text-slate-800 text-lg">{item.waybillNo}</p>
                </div>
                {item.destinationCity && (
                    <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Destination</p>
                        <p className="font-bold text-slate-700">{item.destinationCity}</p>
                    </div>
                )}
                <ItemStatusBadge status={item.status} />
            </div>
            <div className="border-t border-[#039B81]/10 pt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Container</p>
                <div className="flex flex-wrap items-center gap-3">
                    <span className="font-black text-slate-800">{publicContainerRef(container._id)}</span>
                    <StatusBadge status={container.status} />
                    {container.eta && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock size={12} />
                            ETA: {formatDate(container.eta)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main content (needs useSearchParams so must be wrapped in Suspense) ──────

function ContainerLoadingsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialQ = searchParams.get("q") || "";

    const [searchValue, setSearchValue]   = useState(initialQ);
    const [containers, setContainers]     = useState<ContainerLoading[]>([]);
    const [waybillMatch, setWaybillMatch] = useState<{ item: any; container: ContainerLoading } | null>(null);
    const [isLoading, setIsLoading]       = useState(true);
    const [isSearching, setIsSearching]   = useState(false);
    const [error, setError]               = useState<string | null>(null);
    const [pagination, setPagination]     = useState<any>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const loadAll = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setWaybillMatch(null);
        try {
            const result = await listContainerLoadings({ limit: 50 });
            setContainers(result.containers);
            setPagination(result.pagination);
        } catch (err: any) {
            // 401 means the deployed backend still has auth on this public route.
            // Show empty state rather than a hard error so the page is still usable.
            if (err?.response?.status === 401) {
                setContainers([]);
            } else {
                setError("Failed to load container data. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const doSearch = useCallback(async (q: string) => {
        if (q.length < 2) {
            loadAll();
            return;
        }
        setIsSearching(true);
        setError(null);
        setWaybillMatch(null);
        try {
            const result = await searchContainerLoadings(q);
            setContainers(result.containers);
            setWaybillMatch(result.waybillMatch);
        } catch {
            setError("Search failed. Please try again.");
        } finally {
            setIsSearching(false);
        }
    }, [loadAll]);

    useEffect(() => {
        if (initialQ.length >= 2) {
            doSearch(initialQ);
        } else {
            loadAll();
        }
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value;
        setSearchValue(q);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            const params = new URLSearchParams(window.location.search);
            if (q) params.set("q", q); else params.delete("q");
            router.replace(`/container-loadings?${params.toString()}`, { scroll: false });
            doSearch(q.trim());
        }, 500);
    };

    const loading = isLoading || isSearching;

    return (
        <main className="bg-slate-50 min-h-screen">
            {/* Hero header */}
            <section className="pt-32 pb-12 bg-white border-b border-slate-100">
                <div className="container mx-auto px-4 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#039B81]/10 rounded-2xl mb-6 mx-auto">
                        <Anchor className="text-[#039B81]" size={30} />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-4">
                        Container Loadings
                    </h1>
                    <p className="text-slate-500 font-medium max-w-xl mx-auto mb-8">
                        Track shipping containers from Guangzhou to Tema Port. Enter your tracking number to find your shipment.
                    </p>

                    {/* Search bar */}
                    <div className="relative max-w-lg mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                        {isSearching && (
                            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-[#039B81] animate-spin" size={18} />
                        )}
                        <input
                            type="text"
                            placeholder="Enter your tracking number..."
                            value={searchValue}
                            onChange={handleSearchChange}
                            className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 focus:border-[#039B81]/50 transition-all font-medium shadow-sm"
                        />
                    </div>

                    {/* Status legend */}
                    <div className="flex flex-wrap justify-center gap-3 mt-6">
                        {Object.entries(STATUS_META).map(([key, meta]) => (
                            <span key={key} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${meta.classes}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                                {meta.label}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Results */}
            <section className="py-10 pb-24">
                <div className="container mx-auto px-4 max-w-4xl">
                    {loading ? (
                        <div className="py-24 flex flex-col items-center gap-4 text-slate-400">
                            <Loader2 className="animate-spin text-[#039B81]" size={32} />
                            <span className="text-xs font-black uppercase tracking-widest">
                                {isSearching ? "Searching..." : "Loading containers..."}
                            </span>
                        </div>
                    ) : error ? (
                        <div className="py-24 text-center">
                            <p className="text-red-500 font-medium mb-4">{error}</p>
                            <button onClick={loadAll} className="text-[#039B81] font-black text-sm underline">
                                Retry
                            </button>
                        </div>
                    ) : (
                        <>
                            {waybillMatch && (
                                <TrackingMatchCard item={waybillMatch.item} container={waybillMatch.container} />
                            )}

                            {containers.length === 0 && !waybillMatch ? (
                                <div className="py-24 text-center">
                                    <Package className="mx-auto text-slate-200 mb-4" size={48} />
                                    <p className="text-slate-400 font-black text-sm uppercase tracking-widest">
                                        {searchValue.length >= 2
                                            ? "No tracking number found. Please check and try again."
                                            : "No container loadings available yet."}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {containers.length > 0 && (
                                        <div className="mb-4 flex items-center justify-between">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                                {pagination ? `${pagination.total} container${pagination.total !== 1 ? "s" : ""}` : `${containers.length} container${containers.length !== 1 ? "s" : ""}`}
                                            </p>
                                            {searchValue.length >= 2 && (
                                                <button
                                                    onClick={() => { setSearchValue(""); loadAll(); router.replace("/container-loadings"); }}
                                                    className="text-xs text-[#039B81] font-black hover:underline"
                                                >
                                                    Clear search
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-4">
                                        {containers.map((c) => (
                                            <ContainerCard key={c._id} container={c} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </section>
        </main>
    );
}

export default function ContainerLoadingsPage() {
    return (
        <>
            <Navbar />
            <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                    <Loader2 className="animate-spin text-[#039B81]" size={32} />
                </div>
            }>
                <ContainerLoadingsContent />
            </Suspense>
            <Footer />
        </>
    );
}
