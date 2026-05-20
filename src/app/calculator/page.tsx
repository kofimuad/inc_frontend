"use client";

import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { useState, useEffect } from "react";
import { Suspense } from "react";
import { Phone, Search, Copy, Check, Package, ArrowLeft, AlertCircle } from "lucide-react";
import { getPublicTrackingByPhone } from "@/services/shipments";
import { getSettings, AppSettings } from "@/services/settings";

// ─── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
    in_warehouse:    "bg-blue-50 text-blue-700",
    shipped:         "bg-[#039B81]/10 text-[#039B81]",
    customs:         "bg-purple-50 text-purple-700",
    out_for_delivery:"bg-orange-50 text-orange-700",
    delivered:       "bg-emerald-50 text-emerald-700",
    held:            "bg-amber-50 text-amber-700",
};
const STATUS_LABELS: Record<string, string> = {
    in_warehouse:    "In Warehouse",
    shipped:         "Shipped",
    customs:         "Customs",
    out_for_delivery:"Out for Delivery",
    delivered:       "Delivered",
    held:            "On Hold",
};

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-500"}`}>
            {STATUS_LABELS[status] ?? status.replace(/_/g, " ")}
        </span>
    );
}

// ─── Shipment row ──────────────────────────────────────────────────────────────
function ShipmentRow({ item, onSelect, selected }: { item: any; onSelect: () => void; selected: boolean }) {
    return (
        <button
            onClick={onSelect}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
                selected
                    ? "border-[#039B81] bg-[#039B81]/5 shadow-sm"
                    : "border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white"
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-wide truncate">
                        {item.waybillNo || item.invoiceNo || "—"}
                    </p>
                    {item.productDescription && (
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">{item.productDescription}</p>
                    )}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <StatusBadge status={item.status} />
                    <span className="text-xs font-black text-slate-700 tabular-nums">
                        {item.cbm != null ? `${item.cbm} m³` : "CBM pending"}
                    </span>
                </div>
            </div>
        </button>
    );
}

// ─── Main content ──────────────────────────────────────────────────────────────
function CalculatorContent() {
    const [phone, setPhone] = useState("");
    const [phoneTouched, setPhoneTouched] = useState(false);
    const [lookupState, setLookupState] = useState<"idle" | "loading" | "found" | "not-found" | "error">("idle");
    const [grouped, setGrouped] = useState<Record<string, any[]> | null>(null);
    const [selected, setSelected] = useState<any | null>(null);
    const [settings, setSettings] = useState<AppSettings>({ cbmRate: 230, usdToGhsRate: 15.2 });
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        getSettings()
            .then(setSettings)
            .catch(() => {}); // fall back to defaults silently
    }, []);

    const allItems = grouped ? Object.values(grouped).flat() : [];

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = phone.trim();
        if (!trimmed) return;
        setLookupState("loading");
        setSelected(null);
        setGrouped(null);
        try {
            const data = await getPublicTrackingByPhone(trimmed);
            if (!data || data.total === 0) {
                setLookupState("not-found");
            } else {
                setGrouped(data.grouped);
                setLookupState("found");
            }
        } catch (err: any) {
            if (err?.response?.status === 404) {
                setLookupState("not-found");
            } else {
                setLookupState("error");
            }
        }
    };

    const reset = () => {
        setLookupState("idle");
        setGrouped(null);
        setSelected(null);
    };

    // Cost values
    const cbm = selected?.cbm ?? null;
    const feeUsd = cbm != null ? cbm * settings.cbmRate : null;
    const feeGhs = feeUsd != null ? feeUsd * settings.usdToGhsRate : null;

    const copyQuote = async () => {
        if (feeUsd == null || feeGhs == null || !selected) return;
        const lines = [
            "I&C Shipping and Logistics — Cost Estimate",
            "",
            `Waybill: ${selected.waybillNo || selected.invoiceNo || "—"}`,
            `Volume (CBM): ${cbm} m³`,
            `Rate: USD ${settings.cbmRate.toFixed(2)} / CBM`,
            `Estimated Shipping Fee: USD ${feeUsd.toFixed(2)}`,
            `GHS Equivalent: GH₵ ${feeGhs.toFixed(2)} (at ${settings.usdToGhsRate} GHS/USD)`,
            "",
            "This is an estimation. Final shipping cost is confirmed when your shipment is weighed and measured at our Ghana warehouse.",
        ];
        await navigator.clipboard.writeText(lines.join("\n"));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <main className="bg-slate-50 min-h-screen">
            {/* Hero */}
            <section className="bg-white pt-32 pb-12 border-b border-slate-100">
                <div className="container mx-auto px-4 mt-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                            Shipping Cost Calculator
                        </h1>
                        <p className="text-lg text-slate-500 font-medium">
                            Enter the phone number on your shipment to look up your CBM and get an instant cost estimate.
                        </p>
                    </div>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-6 items-start">

                        {/* ── Left card ──────────────────────────────────── */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">

                            {/* Phone lookup form */}
                            {lookupState === "idle" || lookupState === "loading" || lookupState === "not-found" || lookupState === "error" ? (
                                <>
                                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
                                        Find Your Shipment
                                    </h2>
                                    <form onSubmit={handleLookup} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                                Phone Number
                                            </label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input
                                                    type="tel"
                                                    placeholder="e.g. 0244000000"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    onBlur={() => setPhoneTouched(true)}
                                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 focus:border-[#039B81]/30 transition-all font-medium text-sm"
                                                />
                                            </div>
                                            {phoneTouched && !phone.trim() && (
                                                <p className="text-xs text-red-500 font-medium mt-1">Please enter your phone number</p>
                                            )}
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={lookupState === "loading" || !phone.trim()}
                                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#039B81] hover:bg-[#027a65] disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#039B81]/20"
                                        >
                                            {lookupState === "loading" ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Search size={16} />
                                            )}
                                            {lookupState === "loading" ? "Searching…" : "Look Up Shipments"}
                                        </button>
                                    </form>

                                    {/* Not found */}
                                    {lookupState === "not-found" && (
                                        <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                                            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                                            <div>
                                                <p className="text-sm font-black text-slate-800">No shipments found</p>
                                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                    We couldn&apos;t find any shipments linked to <strong>{phone}</strong>. Check the number and try again, or contact us.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Error */}
                                    {lookupState === "error" && (
                                        <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3">
                                            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                                            <p className="text-xs text-slate-600 font-medium">
                                                Something went wrong. Please try again in a moment.
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* Shipment list */
                                <>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                            Your Shipments
                                        </h2>
                                        <button
                                            onClick={reset}
                                            className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-[#039B81] uppercase tracking-widest transition-colors"
                                        >
                                            <ArrowLeft size={12} />
                                            Change number
                                        </button>
                                    </div>

                                    <p className="text-xs text-slate-500 font-medium mb-4">
                                        Found <span className="font-black text-slate-800">{allItems.length}</span> shipment{allItems.length !== 1 ? "s" : ""} for <span className="font-black text-slate-800">{phone}</span>. Select one to calculate cost.
                                    </p>

                                    <div className="space-y-2">
                                        {allItems.map((item, i) => (
                                            <ShipmentRow
                                                key={item._id ?? i}
                                                item={item}
                                                selected={selected?._id === item._id}
                                                onSelect={() => setSelected(item)}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* ── Right card — Result ────────────────────────── */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:sticky lg:top-28">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
                                Cost Estimate
                            </h2>

                            {selected == null ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                        <Package className="text-slate-300" size={28} />
                                    </div>
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                                        No shipment selected
                                    </p>
                                    <p className="text-xs text-slate-400 font-medium mt-1">
                                        Look up your phone number and pick a shipment from the list.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Waybill */}
                                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Waybill</p>
                                            <p className="text-sm font-black text-slate-800">{selected.waybillNo || selected.invoiceNo || "—"}</p>
                                        </div>
                                        <StatusBadge status={selected.status} />
                                    </div>

                                    {/* CBM */}
                                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                            Volume (CBM)
                                        </p>
                                        <p className="text-3xl font-black text-slate-900 tracking-tight">
                                            {cbm != null ? cbm : "—"}
                                            <span className="text-sm font-semibold text-slate-400 ml-1.5">m³</span>
                                        </p>
                                        <p className="text-xs text-slate-400 font-medium mt-2">
                                            Measured and confirmed by I&amp;C at the origin warehouse.
                                        </p>
                                    </div>

                                    {cbm == null ? (
                                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                                            <p className="text-xs font-black text-amber-700">CBM not yet recorded</p>
                                            <p className="text-[11px] text-amber-600 mt-0.5 font-medium">
                                                Your CBM will appear here once your shipment has been processed at the warehouse.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* USD Fee */}
                                            <div className="bg-[#039B81]/5 rounded-xl p-5 border border-[#039B81]/10">
                                                <p className="text-[10px] font-black text-[#039B81] uppercase tracking-widest mb-2">
                                                    Shipping Fee
                                                </p>
                                                <p className="text-3xl font-black text-slate-900 tracking-tight">
                                                    <span className="text-[#039B81]">USD</span>{" "}
                                                    {feeUsd!.toFixed(2)}
                                                </p>
                                                <p className="text-[11px] text-slate-400 font-medium mt-1">
                                                    {cbm} m³ × USD {settings.cbmRate} / CBM
                                                </p>
                                            </div>

                                            {/* GHS equivalent */}
                                            <div className="bg-[#FC6100]/5 rounded-xl p-5 border border-[#FC6100]/10">
                                                <p className="text-[10px] font-black text-[#FC6100] uppercase tracking-widest mb-2">
                                                    GHS Equivalent
                                                </p>
                                                <p className="text-3xl font-black text-slate-900 tracking-tight">
                                                    <span className="text-[#FC6100]">GH₵</span>{" "}
                                                    {feeGhs!.toFixed(2)}
                                                </p>
                                                <p className="text-[11px] text-slate-400 font-medium mt-1">
                                                    at {settings.usdToGhsRate} GHS / USD
                                                </p>
                                            </div>

                                            <p className="text-xs text-slate-400 italic text-center">
                                                These numbers update automatically when rates change.
                                            </p>

                                            {/* Copy Quote */}
                                            <button
                                                onClick={copyQuote}
                                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#039B81] hover:bg-[#027a65] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#039B81]/20"
                                            >
                                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                                {copied ? "Copied!" : "Copy Quote"}
                                            </button>
                                        </>
                                    )}

                                    {/* Disclaimer */}
                                    <p className="text-[11px] text-slate-400 font-medium text-center leading-relaxed pt-2 border-t border-slate-100">
                                        This is an estimation. Final shipping cost is confirmed when your shipment is weighed and measured at our Ghana warehouse.
                                    </p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </section>
        </main>
    );
}

export default function CalculatorPage() {
    return (
        <>
            <Navbar />
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
                <CalculatorContent />
            </Suspense>
            <Footer />
        </>
    );
}
