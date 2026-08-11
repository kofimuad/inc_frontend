"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import Button from "@/components/common/Button";
import { updateBatch, type BatchSummary } from "@/services/shipments";
import { STATUS_OPTIONS } from "@/config/statusOptions";

interface Props {
    batch: BatchSummary;
    onClose: () => void;
    /** `synced` is true when the save moved items, so the parent can reload lists. */
    onSaved: (updated: BatchSummary, synced: boolean) => void;
}

export default function BatchEditModal({ batch, onClose, onSaved }: Props) {
    const [label, setLabel] = useState(batch.label ?? "");
    const [notes, setNotes] = useState(batch.notes ?? "");
    // Blank = leave every item's status alone. Only a deliberate pick moves them.
    const [status, setStatus] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);

    const itemCount = batch.totalItems ?? 0;
    const statusLabel = STATUS_OPTIONS.find((o) => o.value === status)?.label ?? "";

    const handleSave = async () => {
        if (status) {
            const ok = window.confirm(
                `Set all ${itemCount} shipment(s) in "${batch.label || batch.batchCode}" to ${statusLabel}?\n\n` +
                `This updates every customer's tracking page for this upload. Items that are on hold, ` +
                `delivered, returned or failed are left untouched.`
            );
            if (!ok) return;
        }

        setSaving(true);
        setError(null);
        setResult(null);
        try {
            const payload: { label: string; notes: string; status?: string } = {
                label: label.trim(),
                notes: notes.trim(),
            };
            if (status) payload.status = status;

            const { batch: updated, message } = await updateBatch(batch._id, payload);

            // A bulk status change reports what it moved and what it skipped —
            // show that before closing rather than silently succeeding.
            if (status) {
                setResult(message);
                setStatus("");
                onSaved(updated, true);
            } else {
                onSaved(updated, false);
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to save. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const inputCls = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 focus:border-[#039B81]/40 transition-all";

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-start justify-between p-6 border-b border-slate-100 shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Edit Upload</h2>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{batch.batchCode}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto flex-1">
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

                    {/* Bulk status — the upload-level equivalent of moving a container. */}
                    <div className="border-t border-slate-100 pt-5">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            Move All Shipments
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className={inputCls}
                        >
                            <option value="">— Leave statuses unchanged —</option>
                            {STATUS_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        {status ? (
                            <div className="mt-2 flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-amber-700 font-semibold leading-relaxed">
                                    All {itemCount} shipment(s) in this upload move to <span className="font-black">{statusLabel}</span> and
                                    every affected customer sees it on their tracking page. On-hold, delivered, returned and failed
                                    items are skipped.
                                </p>
                            </div>
                        ) : (
                            <p className="text-[10px] text-slate-400 mt-1.5">
                                Applies one status to every shipment in this upload — the same way moving a container moves its cargo.
                            </p>
                        )}
                    </div>

                    {result && (
                        <p className="text-xs font-bold text-[#039B81] bg-[#039B81]/5 border border-[#039B81]/20 rounded-xl p-3">
                            {result}
                        </p>
                    )}
                    {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
                </div>

                <div className="p-6 pt-0 flex gap-3 shrink-0">
                    <Button variant="outline" onClick={onClose} className="flex-1 py-3 text-xs font-black uppercase tracking-widest bg-white">
                        {result ? "Done" : "Cancel"}
                    </Button>
                    <Button onClick={handleSave} isLoading={saving} className="flex-1 py-3 text-xs font-black uppercase tracking-widest shadow-lg shadow-[#039B81]/20">
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
}
