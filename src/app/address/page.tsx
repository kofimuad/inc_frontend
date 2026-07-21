"use client";

import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { Copy, AlertTriangle, Phone, MapPin } from "lucide-react";
import { useState } from "react";

const addresses = [
    {
        title: "FOSHAN WAREHOUSE (SEA)",
        subtitle: "广东省佛山市南海区",
        type: "sea",
        accentColor: "#039B81",
        fields: [
            { label: "Full Address (Chinese)", value: "广东省佛山市南海区里水镇甘蕉上街工业区金辉工业园15号楼一楼" },
            { label: "Contact Person", value: "刘先生" },
            { label: "Phone", value: "19878765606" },
            { label: "Agent", value: "CLINETTE CARGO" },
        ],
        shippingMark: {
            label: "Shipping Mark Format",
            template: `CLINETTE CARGO\nName: [Your Name]\nContact: [Your Phone]\nGoods Description: [Item]\nGoods Count: [Qty]\nSupplier Contact: [Supplier Phone]`,
        },
        warning: null,
    },
    {
        title: "YIWU WAREHOUSE (SEA)",
        subtitle: "浙江省东阳市江北街道",
        type: "sea",
        accentColor: "#FC6100",
        fields: [
            { label: "Full Address (Chinese)", value: "浙江省东阳市江北街道歌山北路280号蓝鸟冷库6号荷园仓库-转伟成" },
            { label: "Contact Person", value: "张召 转伟成（CLINETTE LOGISTICS）" },
            { label: "Phone", value: "17757965609" },
            { label: "Agent", value: "CLINETTE CARGO + 深圳伟成" },
        ],
        shippingMark: {
            label: "Shipping Mark Template (唛头模板)",
            template: `CLINETTE CARGO + 深圳伟成\nCustomer Name / 客户姓名:\nCustomer Phone / 客户电话:\nGoods Description / 货物品名:\nGoods Count / 货物件数:\nSupplier Contact / 供应商联系方式:`,
        },
        warning: [
            "① Pre-booking required — provide packing list before delivery. Unbooked shipments will be REFUSED.",
            "② Special export/customs requirements must be confirmed in advance.",
            "③ STRICTLY FORBIDDEN: goods with oil, batteries/electronics, liquids, or other dangerous items. For sensitive cargo, contact Guangzhou warehouse instead.",
            "⚠️ '伟成' label MUST be clearly visible (handwritten accepted). No label or unclear label = REFUSED. Unbooked / prohibited / incomplete info = REFUSED.",
        ],
    },
    {
        title: "AIR CARGO ADDRESS (CHINA)",
        subtitle: "广州市越秀区",
        type: "air",
        accentColor: "#FC6100",
        fields: [
            { label: "Full Address (Chinese)", value: "广州市越秀区广园西路66号壹号都汇钟表城4018室空运" },
            { label: "Contact Person", value: "蒋小姐" },
            { label: "Phone", value: "19924759953" },
            { label: "Agent", value: "CLINETTE CARGO" },
        ],
        shippingMark: null,
        warning: null,
    },
    {
        title: "AIR CARGO (GHANA AGENT)",
        subtitle: "Accra, Ghana",
        type: "air",
        accentColor: "#039B81",
        fields: [
            { label: "Agent", value: "Clinette Cargo (Office)" },
            { label: "Location", value: "TAMALE-TAM | TAKORADI-TKD | KUMASI-KSI | ACCRA-ACC" },

        ],
        shippingMark: null,
        warning: null,
    },
];

export default function AddressPage() {
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    return (
        <>
            <Navbar />
            <main className="bg-gray-50 pb-20">
                {/* Hero */}
                <section className="pt-32 pb-10 bg-white shadow-sm">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">
                            Our Warehouse Addresses
                        </h1>
                        <p className="text-gray-600 max-w-2xl mx-auto mb-6">
                            Use the correct warehouse address based on your shipment type. Always include your shipping mark on all packages.
                        </p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 md:p-6 max-w-4xl mx-auto flex items-start gap-4 text-left">
                            <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" size={24} />
                            <div>
                                <h3 className="text-lg font-bold text-red-700 mb-1">IMPORTANT: Shipping Mark Required</h3>
                                <p className="text-gray-700">
                                    All packages <strong>must</strong> display a clear shipping mark with your name and contact number.
                                    <br />
                                    Format: <span className="font-mono bg-white px-2 py-0.5 rounded border">CLINETTE CARGO — [Your Name] — [Your Phone]</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Address Cards */}
                <section className="py-12">
                    <div className="container mx-auto px-4">
                        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                            {addresses.map((addr, idx) => (
                                <div key={idx} className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow flex flex-col">
                                    {/* Card Header */}
                                    <div className="px-6 py-4" style={{ backgroundColor: addr.accentColor }}>
                                        <h2 className="text-white font-bold text-lg tracking-wide">{addr.title}</h2>
                                        <p className="text-white/70 text-sm mt-0.5">{addr.subtitle}</p>
                                    </div>

                                    {/* Fields */}
                                    <div className="p-6 space-y-3 flex-1">
                                        {addr.fields.map((field, fidx) => (
                                            <div key={fidx} className="flex items-start gap-3">
                                                <span className="text-gray-500 text-xs uppercase font-bold mt-0.5 w-36 flex-shrink-0">{field.label}</span>
                                                <div className="flex items-center gap-2 flex-1">
                                                    <span className="text-gray-800 font-medium text-sm leading-snug">{field.value}</span>
                                                    <button
                                                        onClick={() => handleCopy(field.value, `${idx}-${fidx}`)}
                                                        className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
                                                        title="Copy"
                                                    >
                                                        {copiedKey === `${idx}-${fidx}` ? (
                                                            <span className="text-xs font-bold text-green-600">✓</span>
                                                        ) : (
                                                            <Copy size={13} />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Shipping Mark */}
                                        {addr.shippingMark && (
                                            <>
                                                <div className="border-t border-gray-100 my-3" />
                                                <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-orange-800 text-xs uppercase font-bold">{addr.shippingMark.label}</span>
                                                        <button
                                                            onClick={() => handleCopy(addr.shippingMark!.template, `mark-${idx}`)}
                                                            className="text-orange-500 hover:text-orange-700 transition-colors"
                                                            title="Copy template"
                                                        >
                                                            {copiedKey === `mark-${idx}` ? (
                                                                <span className="text-xs font-bold text-green-600">Copied!</span>
                                                            ) : (
                                                                <Copy size={14} />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <pre className="text-xs text-orange-900 font-mono whitespace-pre-wrap leading-relaxed">
                                                        {addr.shippingMark.template}
                                                    </pre>
                                                </div>
                                            </>
                                        )}

                                        {/* Warning */}
                                        {addr.warning && (
                                            <>
                                                <div className="border-t border-gray-100 my-3" />
                                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <AlertTriangle size={15} className="text-red-500 flex-shrink-0" />
                                                        <span className="text-red-700 text-xs font-bold uppercase">Mandatory Requirements</span>
                                                    </div>
                                                    <ul className="space-y-1.5">
                                                        {addr.warning.map((w, wi) => (
                                                            <li key={wi} className="text-red-700 text-xs leading-snug">{w}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </>
                                        )}
                                    </div>
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
