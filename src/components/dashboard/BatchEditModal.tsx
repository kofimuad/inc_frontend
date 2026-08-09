"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Button from "@/components/common/Button";
import { updateBatch, type BatchSummary } from "@/services/shipments";

interface Props {
    batch: BatchSummary;
    onClose: () => void;
    onSaved: (updated: BatchSummary) => void;
}

export default function BatchEditModal({ batch, onClose, onSaved }: Props) {
    const [label, setLabel] = useState(batch.label ?? "");
    const [notes, setNotes] = useState(batch.notes ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const updated = await updateBatch(batch._id, { label: label.trim(), notes: notes.trim() });
            onSaved(updated);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to save. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const inputCls = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 focus:border-[#039B81]/40 transition-all";

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
                <div className="flex items-start justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Edit Upload</h2>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{batch.batchCode}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Display Name</label>
                        <input
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder={batch.batchCode}
                            className={inputCls}
                        />
                        <p className="text-[10px] text-slate-400 mt-1.5">Shown on the card instead of the auto-generated code. Leave blank to use the code.</p>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Optional notes about this upload"
                            className={`${inputCls} resize-none`}
                        />
                    </div>
                    {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
                </div>

                <div className="p-6 pt-0 flex gap-3">
                    <Button variant="outline" onClick={onClose} className="flex-1 py-3 text-xs font-black uppercase tracking-widest bg-white">Cancel</Button>
                    <Button onClick={handleSave} isLoading={saving} className="flex-1 py-3 text-xs font-black uppercase tracking-widest shadow-lg shadow-[#039B81]/20">Save</Button>
                </div>
            </div>
        </div>
    );
}
