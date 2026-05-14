"use client";

import { useState } from "react";
import { X, AlertTriangle, Save } from "lucide-react";
import Button from "@/components/common/Button";
import { updateBatchItem } from "@/services/shipments";

interface EditItemModalProps {
    item: any;
    onClose: () => void;
    onSaved: (updated: any) => void;
}

// Fields that are important enough to flag as "missing" when empty
const REQUIRED_FIELDS = ["customerName", "customerPhone", "destinationCity", "productDescription", "quantity"];

type FieldDef = { key: string; label: string; type?: "text" | "number"; placeholder?: string };

const FIELD_GROUPS: { group: string; fields: FieldDef[] }[] = [
    {
        group: "Shipment",
        fields: [
            { key: "waybillNo",  label: "Tracking / Job Number", placeholder: "e.g. 301977756976" },
            { key: "invoiceNo",  label: "Invoice Number",         placeholder: "e.g. INV-2026-001" },
            { key: "containerRef", label: "Container Ref",        placeholder: "e.g. MSBU7337022" },
        ],
    },
    {
        group: "Customer",
        fields: [
            { key: "customerName",  label: "Customer Name",  placeholder: "Full name" },
            { key: "customerPhone", label: "Customer No. / Phone", placeholder: "e.g. 0244123456" },
            { key: "destinationCity", label: "Destination",  placeholder: "e.g. ACCRA" },
        ],
    },
    {
        group: "Cargo",
        fields: [
            { key: "productDescription", label: "Description",  placeholder: "e.g. Phone accessories" },
            { key: "goodsType",          label: "Goods Type",   placeholder: "e.g. Electronics" },
            { key: "quantity",  label: "Quantity",  type: "number", placeholder: "e.g. 3" },
            { key: "cbm",       label: "CBM",       type: "number", placeholder: "e.g. 0.15" },
            { key: "remarks",   label: "Remarks",   placeholder: "Any special notes" },
        ],
    },
    {
        group: "Financials",
        fields: [
            { key: "freightTerm",   label: "Freight Term",    placeholder: "e.g. COLLECT" },
            { key: "freightAmount", label: "Freight Amount $", type: "number", placeholder: "e.g. 68.00" },
            { key: "loan",          label: "Loan",             type: "number", placeholder: "e.g. 0" },
            { key: "interest",      label: "Interest",         type: "number", placeholder: "e.g. 0" },
            { key: "otherFee",      label: "Other Fee",        type: "number", placeholder: "e.g. 0" },
            { key: "invoiceAmount", label: "Invoice Amount $", type: "number", placeholder: "e.g. 68.00" },
        ],
    },
    {
        group: "Staff",
        fields: [
            { key: "staffNotes", label: "Staff Notes (internal)", placeholder: "Not visible to customers" },
        ],
    },
];

function isEmpty(val: any): boolean {
    return val === null || val === undefined || String(val).trim() === "";
}

export default function EditItemModal({ item, onClose, onSaved }: EditItemModalProps) {
    const [form, setForm] = useState<Record<string, any>>(() => {
        const init: Record<string, any> = {};
        FIELD_GROUPS.forEach(({ fields }) =>
            fields.forEach(({ key }) => { init[key] = item[key] ?? ""; })
        );
        return init;
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const missingCount = REQUIRED_FIELDS.filter((k) => isEmpty(form[k])).length;

    const handleChange = (key: string, val: string) => {
        setForm((prev) => ({ ...prev, [key]: val }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            // Only send fields that differ from original or were previously empty
            const updates: Record<string, any> = {};
            FIELD_GROUPS.forEach(({ fields }) =>
                fields.forEach(({ key, type }) => {
                    const val = form[key];
                    if (val === "" || val === null || val === undefined) return;
                    updates[key] = type === "number" ? parseFloat(String(val)) : String(val).trim();
                })
            );
            if (Object.keys(updates).length === 0) {
                setError("No changes to save.");
                return;
            }
            const updated = await updateBatchItem(item._id, updates);
            onSaved(updated);
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to save changes. Please try again.";
            setError(msg);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-slate-100 shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Edit Shipment Item</h2>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{item.waybillNo || item._id}</p>
                        {missingCount > 0 && (
                            <div className="flex items-center gap-1.5 mt-2">
                                <AlertTriangle size={13} className="text-amber-500" />
                                <span className="text-xs font-black text-amber-600 uppercase tracking-widest">
                                    {missingCount} missing field{missingCount > 1 ? "s" : ""}
                                </span>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable form */}
                <div className="overflow-y-auto p-6 space-y-8 flex-1">
                    {FIELD_GROUPS.map(({ group, fields }) => (
                        <div key={group}>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{group}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {fields.map(({ key, label, type, placeholder }) => {
                                    const isRequired = REQUIRED_FIELDS.includes(key);
                                    const missing    = isRequired && isEmpty(form[key]);
                                    const isReadonly = key === "waybillNo";
                                    return (
                                        <div key={key} className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                    {label}
                                                </label>
                                                {missing && (
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                                                        Missing
                                                    </span>
                                                )}
                                            </div>
                                            <input
                                                type={type || "text"}
                                                value={form[key] ?? ""}
                                                onChange={(e) => handleChange(key, e.target.value)}
                                                placeholder={placeholder}
                                                readOnly={isReadonly}
                                                className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 ${
                                                    isReadonly
                                                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-default"
                                                        : missing
                                                        ? "bg-amber-50 border-amber-300 text-slate-800 focus:ring-amber-300/40 placeholder:text-amber-400"
                                                        : "bg-slate-50 border-slate-200 text-slate-800 focus:ring-[#039B81]/20 focus:border-[#039B81]/40 placeholder:text-slate-300"
                                                }`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-bold">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-slate-100 shrink-0">
                    <Button variant="outline" onClick={onClose} className="flex-1 py-3 text-xs font-black uppercase tracking-widest bg-white">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} isLoading={isSaving} className="flex-1 py-3 text-xs font-black uppercase tracking-widest shadow-lg shadow-[#039B81]/20">
                        <Save size={15} className="mr-2" />
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}
