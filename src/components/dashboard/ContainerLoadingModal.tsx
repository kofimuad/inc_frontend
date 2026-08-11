"use client";

import { useState } from "react";
import { X, Ship, AlertTriangle } from "lucide-react";
import Button from "@/components/common/Button";
import {
    createContainerLoading,
    updateContainerLoading,
    type ContainerLoading,
} from "@/services/containerLoadings";
import { CONTAINER_TO_ITEM_STATUS } from "@/config/statusOptions";
import { STATUS_LABELS } from "@/config/constants";

/** What each container status means for the shipments loaded in it. */
const ITEM_STATUS_LABEL: Record<string, string> = Object.fromEntries(
    Object.entries(CONTAINER_TO_ITEM_STATUS).map(([container, item]) => [
        container,
        STATUS_LABELS[item] ?? item,
    ])
);

interface Props {
    existing?: ContainerLoading;
    onClose: () => void;
    /** `synced` is true when the save moved the shipments loaded in the container. */
    onSaved: (c: ContainerLoading, synced: boolean) => void;
}

const STATUS_OPTIONS = [
    { value: "loading", label: "Loading" },
    { value: "shipped", label: "Shipped" },
    { value: "at_port", label: "At Tema Port" },
    { value: "arrived", label: "Arrived (Warehouse)" },
    { value: "ready",   label: "Ready for Pickup" },
];

function toDateInput(iso?: string) {
    if (!iso) return "";
    return iso.slice(0, 10);
}

export default function ContainerLoadingModal({ existing, onClose, onSaved }: Props) {
    const isEdit = !!existing;

    const [form, setForm] = useState({
        containerNumber: existing?.containerNumber ?? "",
        vesselName:      existing?.vesselName      ?? "",
        blNumber:        existing?.blNumber        ?? "",
        sealNumber:      existing?.sealNumber      ?? "",
        volume:          existing?.volume          ?? "",
        portOfLoading:   existing?.portOfLoading   ?? "Guangzhou, China",
        portOfDischarge: existing?.portOfDischarge ?? "Tema Port, Ghana",
        loadingDate:     toDateInput(existing?.loadingDate),
        etd:             toDateInput(existing?.etd),
        eta:             toDateInput(existing?.eta),
        actualArrivalDate: toDateInput(existing?.actualArrivalDate),
        status:          existing?.status          ?? "loading",
        notes:           existing?.notes           ?? "",
        staffNotes:      existing?.staffNotes      ?? "",
    });

    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);

    // Moving the container moves its cargo — warn before it happens.
    const statusChanged = isEdit && form.status !== existing?.status;
    const newStatusLabel = STATUS_OPTIONS.find((o) => o.value === form.status)?.label ?? form.status;

    const fi = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-[#039B81]/50 focus:ring-2 focus:ring-[#039B81]/10 transition-all";

    const set = (field: string, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (statusChanged) {
            const ok = window.confirm(
                `Move container ${existing?.containerNumber} to ${newStatusLabel}?\n\n` +
                `Every shipment loaded in it moves too, and each customer sees the change on their ` +
                `tracking page. Items that are on hold, delivered, returned or failed are left untouched.`
            );
            if (!ok) return;
        }

        setSaving(true);
        setError(null);
        setResult(null);

        const payload: any = { ...form };
        // Convert empty strings to undefined so the backend doesn't save empty dates
        ["loadingDate", "etd", "eta", "actualArrivalDate"].forEach((k) => {
            if (!payload[k]) delete payload[k];
        });

        try {
            if (isEdit && existing) {
                const { containerNumber: _cn, ...updatePayload } = payload;
                const { container, message } = await updateContainerLoading(existing._id, updatePayload);
                onSaved(container, statusChanged);
                // A status move touched customer-visible records — stay open and
                // report what it did rather than closing silently.
                if (statusChanged) setResult(message);
                else onClose();
            } else {
                onSaved(await createContainerLoading(payload), false);
                onClose();
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to save. Please try again.";
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#039B81]/10 rounded-xl flex items-center justify-center">
                            <Ship className="text-[#039B81]" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">
                                {isEdit ? "Edit Container Loading" : "New Container Loading"}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {isEdit ? existing?.containerNumber : "Fill in container details"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <X size={22} />
                    </button>
                </div>

                {/* Form */}
                <form id="container-form" onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-5">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-semibold">
                            {error}
                        </div>
                    )}

                    {result && (
                        <div className="bg-[#039B81]/5 border border-[#039B81]/20 text-[#039B81] rounded-xl px-4 py-3 text-sm font-bold">
                            {result}
                        </div>
                    )}

                    {/* Container Number — read-only when editing */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Container Number *" required={!isEdit}>
                            <input
                                required={!isEdit}
                                readOnly={isEdit}
                                value={form.containerNumber}
                                onChange={(e) => set("containerNumber", e.target.value.toUpperCase())}
                                placeholder="MSBU7337022"
                                className={`field-input ${isEdit ? "bg-slate-50 cursor-not-allowed text-slate-400" : ""}`}
                            />
                        </Field>
                        <Field label="Status">
                            <select value={form.status} onChange={(e) => set("status", e.target.value)} className={fi}>
                                {STATUS_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    {statusChanged && (
                        <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-amber-700 font-semibold leading-relaxed">
                                Saving moves every shipment in this container to{" "}
                                <span className="font-black">{ITEM_STATUS_LABEL[form.status] ?? newStatusLabel}</span> and updates
                                each customer&apos;s tracking page. On-hold, delivered, returned and failed items are skipped.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Vessel Name">
                            <input value={form.vesselName} onChange={(e) => set("vesselName", e.target.value)} placeholder="MSC VIVIENNE" className={fi} />
                        </Field>
                        <Field label="Volume">
                            <input value={form.volume} onChange={(e) => set("volume", e.target.value)} placeholder="40 HQ" className={fi} />
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="BL Number">
                            <input value={form.blNumber} onChange={(e) => set("blNumber", e.target.value)} placeholder="MSCUXXXXXXXX" className={fi} />
                        </Field>
                        <Field label="Seal Number">
                            <input value={form.sealNumber} onChange={(e) => set("sealNumber", e.target.value)} className={fi} />
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Port of Loading">
                            <input value={form.portOfLoading} onChange={(e) => set("portOfLoading", e.target.value)} className={fi} />
                        </Field>
                        <Field label="Port of Discharge">
                            <input value={form.portOfDischarge} onChange={(e) => set("portOfDischarge", e.target.value)} className={fi} />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <Field label="Loading Date">
                            <input type="date" value={form.loadingDate} onChange={(e) => set("loadingDate", e.target.value)} className={fi} />
                        </Field>
                        <Field label="ETD">
                            <input type="date" value={form.etd} onChange={(e) => set("etd", e.target.value)} className={fi} />
                        </Field>
                        <Field label="ETA">
                            <input type="date" value={form.eta} onChange={(e) => set("eta", e.target.value)} className={fi} />
                        </Field>
                        <Field label="Actual Arrival">
                            <input type="date" value={form.actualArrivalDate} onChange={(e) => set("actualArrivalDate", e.target.value)} className={fi} />
                        </Field>
                    </div>

                    <Field label="Public Notes">
                        <textarea
                            value={form.notes}
                            onChange={(e) => set("notes", e.target.value)}
                            rows={2}
                            placeholder="e.g. Delayed at customs"
                            className={`${fi} resize-none`}
                        />
                    </Field>

                    <Field label="Staff Notes (internal only)">
                        <textarea
                            value={form.staffNotes}
                            onChange={(e) => set("staffNotes", e.target.value)}
                            rows={2}
                            placeholder="Internal notes — not visible to customers"
                            className={`${fi} resize-none`}
                        />
                    </Field>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                    <Button variant="outline" onClick={onClose} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest">
                        {result ? "Done" : "Cancel"}
                    </Button>
                    <Button
                        type="submit"
                        form="container-form"
                        isLoading={saving}
                        className="px-8 py-2.5 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#039B81]/20"
                    >
                        {isEdit ? "Save Changes" : "Create Container"}
                    </Button>
                </div>
            </div>

        </div>
    );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
    return (
        <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                {label}{required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );
}
