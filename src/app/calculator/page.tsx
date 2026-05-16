"use client";

import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Copy, Check } from "lucide-react";

const UNIT_DIVISORS = {
    Cm: 1_000_000,
    M: 1,
    In: 61_023.7,
} as const;

type Unit = keyof typeof UNIT_DIVISORS;

function CalculatorContent() {
    const searchParams = useSearchParams();
    const initialRate = searchParams.get("rate") || "230";

    const [length, setLength] = useState("");
    const [width, setWidth] = useState("");
    const [height, setHeight] = useState("");
    const [unit, setUnit] = useState<Unit>("Cm");
    const [quantity, setQuantity] = useState("1");
    const [rate, setRate] = useState(initialRate);

    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [copied, setCopied] = useState(false);

    const parsePositive = (val: string) => {
        const n = parseFloat(val);
        return isNaN(n) || n <= 0 ? null : n;
    };

    const l = parsePositive(length);
    const w = parsePositive(width);
    const h = parsePositive(height);
    const q = parsePositive(quantity);
    const r = parsePositive(rate);

    const allValid = l !== null && w !== null && h !== null && q !== null && r !== null;

    let cbm: number | null = null;
    let fee: number | null = null;
    if (allValid) {
        cbm = (l! * w! * h! * q!) / UNIT_DIVISORS[unit];
        fee = cbm * r!;
    }

    const handleBlur = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

    const showError = (field: string, val: string) =>
        !!touched[field] && parsePositive(val) === null;

    const copyQuote = async () => {
        if (cbm === null || fee === null) return;
        const text = [
            "I&C Shipping and Logistics — Cost Estimate",
            "",
            `Dimensions: ${length} × ${width} × ${height} ${unit}`,
            `Quantity: ${quantity}`,
            `Volume (CBM): ${cbm.toFixed(4)} m³`,
            `Rate: USD ${parseFloat(rate).toFixed(2)} / CBM`,
            `Estimated Shipping Fee: USD ${fee.toFixed(2)}`,
            "",
            "This is an estimation. Final shipping cost is confirmed when your shipment is weighed and measured at our Ghana warehouse.",
        ].join("\n");

        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const inputCls = (err: boolean) =>
        `w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all font-medium text-sm ${
            err
                ? "border-red-300 focus:ring-red-200"
                : "border-slate-200 focus:ring-[#039B81]/20 focus:border-[#039B81]/30"
        }`;

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
                            Enter your package dimensions to get an instant CBM and cost estimate.
                        </p>
                    </div>
                </div>
            </section>

            {/* Calculator */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-6 items-start">

                        {/* Left Card — Inputs */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
                                Package Details
                            </h2>

                            <div className="space-y-5">
                                {/* Unit toggle */}
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                        Units
                                    </label>
                                    <div className="flex gap-2">
                                        {(["Cm", "M", "In"] as Unit[]).map((u) => (
                                            <button
                                                key={u}
                                                type="button"
                                                onClick={() => setUnit(u)}
                                                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                                    unit === u
                                                        ? "bg-[#039B81] text-white shadow-md shadow-[#039B81]/20"
                                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                                }`}
                                            >
                                                {u}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Dimensions */}
                                <div className="grid grid-cols-3 gap-3">
                                    {(
                                        [
                                            { label: "Length", field: "length", value: length, setter: setLength },
                                            { label: "Width", field: "width", value: width, setter: setWidth },
                                            { label: "Height", field: "height", value: height, setter: setHeight },
                                        ] as const
                                    ).map(({ label, field, value, setter }) => (
                                        <div key={field}>
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                                {label}
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                placeholder="0"
                                                value={value}
                                                onChange={(e) => setter(e.target.value)}
                                                onBlur={() => handleBlur(field)}
                                                className={inputCls(showError(field, value))}
                                            />
                                            {showError(field, value) && (
                                                <p className="text-xs text-red-500 font-medium mt-1">
                                                    Must be greater than 0
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Quantity */}
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                        Quantity
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        placeholder="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        onBlur={() => handleBlur("quantity")}
                                        className={inputCls(showError("quantity", quantity))}
                                    />
                                    {showError("quantity", quantity) && (
                                        <p className="text-xs text-red-500 font-medium mt-1">
                                            Must be greater than 0
                                        </p>
                                    )}
                                </div>

                                {/* Rate per CBM */}
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                        Rate per CBM (USD)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                                            $
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            placeholder="230"
                                            value={rate}
                                            onChange={(e) => setRate(e.target.value)}
                                            onBlur={() => handleBlur("rate")}
                                            className={`${inputCls(showError("rate", rate))} pl-8`}
                                        />
                                    </div>
                                    {showError("rate", rate) && (
                                        <p className="text-xs text-red-500 font-medium mt-1">
                                            Must be greater than 0
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Card — Results */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:sticky lg:top-28">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
                                Cost Estimate
                            </h2>

                            <div className="space-y-4">
                                {/* CBM */}
                                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Volume (CBM)
                                    </p>
                                    <p className="text-3xl font-black text-slate-900 tracking-tight">
                                        {cbm !== null ? cbm.toFixed(4) : "—"}
                                        <span className="text-sm font-semibold text-slate-400 ml-1.5">m³</span>
                                    </p>
                                    <p className="text-xs text-slate-400 font-medium mt-2">
                                        CBM = (L × W × H × Quantity), converted to cubic metres.
                                    </p>
                                </div>

                                {/* Fee */}
                                <div className="bg-[#039B81]/5 rounded-xl p-5 border border-[#039B81]/10">
                                    <p className="text-[10px] font-black text-[#039B81] uppercase tracking-widest mb-2">
                                        Shipping Fee
                                    </p>
                                    <p className="text-3xl font-black text-slate-900 tracking-tight">
                                        {fee !== null ? (
                                            <>
                                                <span className="text-[#039B81]">USD</span>{" "}
                                                {fee.toFixed(2)}
                                            </>
                                        ) : (
                                            "—"
                                        )}
                                    </p>
                                </div>

                                <p className="text-xs text-slate-400 italic text-center">
                                    These numbers update live as you type.
                                </p>

                                {/* Copy Quote */}
                                <button
                                    onClick={copyQuote}
                                    disabled={!allValid}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#039B81] hover:bg-[#027a65] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#039B81]/20"
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? "Copied!" : "Copy Quote"}
                                </button>

                                {/* Disclaimer */}
                                <p className="text-[11px] text-slate-400 font-medium text-center leading-relaxed pt-2 border-t border-slate-100">
                                    This is an estimation. Final shipping cost is confirmed when your
                                    shipment is weighed and measured at our Ghana warehouse.
                                </p>
                            </div>
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
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                <CalculatorContent />
            </Suspense>
            <Footer />
        </>
    );
}
