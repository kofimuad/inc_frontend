"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Info, ClipboardList, Undo2, History, RefreshCw } from "lucide-react";
import Button from "@/components/common/Button";
import { uploadBatchShipped, uploadBatchArrived, uploadBatchIntake, retractBatch, getBatches, BatchSummary } from "@/services/shipments";

interface BulkUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type Stage = 'intake' | 'shipped' | 'arrived';

export default function BulkUploadModal({ isOpen, onClose, onSuccess }: BulkUploadModalProps) {
    const [view, setView] = useState<'upload' | 'manage'>('upload');
    const [stage, setStage] = useState<Stage>('shipped');
    const [file, setFile] = useState<File | null>(null);
    const [autoHold, setAutoHold] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{
        updated: number;
        added?: number;
        held?: number;
        skipped: number;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDuplicate, setIsDuplicate] = useState(false);
    const [duplicateBatchId, setDuplicateBatchId] = useState<string | null>(null);
    const [isReplacing, setIsReplacing] = useState(false);

    // Retraction (undo a wrong upload)
    const [batchId, setBatchId] = useState<string | null>(null);
    const [confirmRetract, setConfirmRetract] = useState(false);
    const [isRetracting, setIsRetracting] = useState(false);
    const [retractedMsg, setRetractedMsg] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setResult(null);
            setIsDuplicate(false);
            setDuplicateBatchId(null);
            setBatchId(null);
            setConfirmRetract(false);
            setRetractedMsg(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsLoading(true);
        setError(null);
        setIsDuplicate(false);
        setDuplicateBatchId(null);
        try {
            let data;
            if (stage === 'intake') {
                data = await uploadBatchIntake(file);
            } else if (stage === 'shipped') {
                data = await uploadBatchShipped(file, autoHold);
            } else if (stage === 'arrived') {
                data = await uploadBatchArrived(file);
            }

            const batch = data?.batch;
            setBatchId(batch?._id ?? null);
            setResult({
                updated: batch?.matchedItems ?? 0,
                added:   batch?.newItems,
                held:    batch?.heldItems,
                skipped: data?.skippedRows?.length ?? 0,
            });
            onSuccess();
        } catch (err: any) {
            const serverData = err.response?.data;
            const statusCode = err.response?.status;

            if (statusCode === 409) {
                setIsDuplicate(true);
                setDuplicateBatchId(serverData?.data?.batchId ?? null);
                setError(serverData?.message || "This file has already been uploaded.");
                return;
            }

            let message = "Failed to process batch upload. Please check your Excel format.";
            if (typeof serverData === 'string') {
                message = serverData;
            } else if (serverData?.message) {
                message = serverData.message;
            } else if (serverData?.error) {
                message = serverData.error;
            } else if (Array.isArray(serverData)) {
                message = serverData.join(', ');
            }
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    // Duplicate upload → delete the previous batch, then retry with the same file.
    const handleReplaceAndRetry = async () => {
        if (!duplicateBatchId) return;
        setIsReplacing(true);
        setError(null);
        try {
            await retractBatch(duplicateBatchId);
            onSuccess();
            setIsDuplicate(false);
            setDuplicateBatchId(null);
            await handleUpload();
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                "Couldn't delete the previous upload. It may have items that already moved to a later stage — retract that stage first."
            );
        } finally {
            setIsReplacing(false);
        }
    };

    const handleRetract = async () => {
        if (!batchId) return;
        if (!confirmRetract) {
            setConfirmRetract(true);
            return;
        }

        setIsRetracting(true);
        setError(null);
        try {
            const data = await retractBatch(batchId);
            setRetractedMsg(data?.summary || "Upload retracted — all changes have been undone.");
            setResult(null);
            setBatchId(null);
            setFile(null);
            setConfirmRetract(false);
            onSuccess();
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to retract this upload. Please try again.");
            setConfirmRetract(false);
        } finally {
            setIsRetracting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-slate-50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            {view === 'manage' ? 'Manage Uploads' : 'Bulk Shipment Update'}
                        </h2>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                            {view === 'manage' ? 'Retract wrong uploads (undo everything they did)' : 'Update multiple shipments using Excel'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setView(view === 'manage' ? 'upload' : 'manage')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                view === 'manage'
                                ? "bg-[#039B81]/10 text-[#039B81]"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                        >
                            {view === 'manage' ? <><Upload size={14} /> Upload</> : <><History size={14} /> Manage Uploads</>}
                        </button>
                        <button onClick={onClose} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {view === 'manage' ? (
                    <RecentUploadsPanel onChanged={onSuccess} />
                ) : (
                <div className="p-8 space-y-8">
                    {/* Stage Selection */}
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Select Upload Stage</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'intake',  label: '1. Intake',  desc: 'Goods Received' },
                                { id: 'shipped', label: '2. Packing', desc: 'Loading List' },
                                { id: 'arrived', label: '3. Arrived', desc: 'Ghana Entry' }
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => { setStage(s.id as Stage); setFile(null); setResult(null); setError(null); setIsDuplicate(false); setBatchId(null); setConfirmRetract(false); setRetractedMsg(null); setAutoHold(false); }}
                                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                                        stage === s.id
                                        ? "border-[#039B81] bg-[#039B81]/5 text-[#039B81]"
                                        : "border-slate-100 hover:border-slate-200 text-slate-500"
                                    }`}
                                >
                                    <span className="font-black text-xs uppercase tracking-tighter">{s.label}</span>
                                    <span className="text-[10px] font-bold opacity-70">{s.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Format Info */}
                    <div className="p-4 bg-amber-50 rounded-2xl flex gap-3 border border-amber-100">
                        <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                        <div className="text-xs text-amber-800 leading-relaxed font-bold">
                            {stage === 'intake' ? (
                                <span>
                                    <span className="text-[#039B81] uppercase font-black tracking-widest block mb-1">Goods Received List Format:</span>
                                    No header row. 5 columns in order:{" "}
                                    <span className="text-slate-900">Invoice No, Job Number (Waybill), Customer Phone, Quantity, Date</span>.
                                </span>
                            ) : stage === 'shipped' ? (
                                <span>
                                    <span className="text-[#039B81] uppercase font-black tracking-widest block mb-1">Packing / Loading List Format:</span>
                                    Two layouts are accepted. <span className="text-slate-900">Headed list:</span> rows 1–8 metadata (BL NUMBER, CTR NUMBER, VOLUME, SEAL NUMBER, PACKING LIST NUMBER, LOADING DATE, ETD, ETA), row 9 headers, data from row 10 — columns JOB NUMBER, CNEE NAME, CUSTOMER NO, LOCATION, GOODS TYPE, QUANTITY, CBM, DESCRIPTION, REMARKS.
                                    <br />
                                    <span className="block mt-1"><span className="text-slate-900">Container list (no headers):</span> title row like &quot;…-N151-CAIU4815359&quot;, then columns in order — Mark, Tracking, Customer No, Name, Location, Qty, CBM, Goods. Location blank = Accra.</span>
                                </span>
                            ) : (
                                <span>
                                    <span className="text-[#039B81] uppercase font-black tracking-widest block mb-1">Goods Arrived List Format:</span>
                                    Upload the Ghana arrival list. Headers on Row 1.
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Auto-hold option — only for packing lists */}
                    {stage === 'shipped' && !result && (
                        <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:border-slate-200 transition-all">
                            <input
                                type="checkbox"
                                checked={autoHold}
                                onChange={(e) => setAutoHold(e.target.checked)}
                                className="mt-0.5 w-4 h-4 accent-[#039B81] shrink-0"
                            />
                            <div className="text-xs leading-relaxed">
                                <span className="font-black text-slate-700">Put remaining warehouse items on hold</span>
                                <p className="text-slate-500 font-medium mt-0.5">
                                    Marks warehouse parcels <span className="font-bold">not</span> on this list as &quot;On Hold&quot;. Leave off for a partial
                                    list — only turn on for a final, complete container manifest.
                                </p>
                            </div>
                        </label>
                    )}

                    {/* File Upload Zone */}
                    {!result ? (
                        <div className="relative group">
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all ${
                                file ? "border-[#039B81] bg-[#039B81]/5" : "border-slate-200 group-hover:border-slate-400 bg-slate-50"
                            }`}>
                                <div className="flex flex-col items-center gap-4">
                                    <div className={`p-4 rounded-2xl ${file ? "bg-[#039B81]/10 text-[#039B81]" : "bg-white text-slate-400"}`}>
                                        {file ? <FileSpreadsheet size={32} /> : <Upload size={32} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">
                                            {file ? file.name : "Choose Excel file"}
                                        </p>
                                        <p className="text-xs text-slate-400 font-medium mt-1">
                                            {file ? `${(file.size / 1024).toFixed(1)} KB` : "Drop .xlsx or .xls here"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 text-center animate-in fade-in zoom-in duration-300">
                            <div className="flex justify-center mb-4 text-emerald-500">
                                <CheckCircle2 size={48} />
                            </div>
                            <h3 className="text-xl font-black text-emerald-900 tracking-tight mb-2">Processing Complete</h3>
                            <div className="flex flex-wrap justify-center gap-8 mt-6">
                                <div>
                                    <p className="text-3xl font-black text-emerald-700">{result.updated}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 mt-1">Updated</p>
                                </div>
                                {result.added !== undefined && (
                                    <div>
                                        <p className="text-3xl font-black text-emerald-600">{result.added}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 mt-1">New Items</p>
                                    </div>
                                )}
                                {result.held !== undefined && result.held > 0 && (
                                    <div>
                                        <p className="text-3xl font-black text-amber-500">{result.held}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/60 mt-1">On Hold</p>
                                    </div>
                                )}
                                {result.skipped > 0 && (
                                    <div>
                                        <p className="text-3xl font-black text-slate-400">{result.skipped}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400/60 mt-1">Skipped</p>
                                    </div>
                                )}
                            </div>
                            {/* Review prompt */}
                            <div className="mt-6 p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-2 text-left">
                                <ClipboardList size={16} className="text-amber-500 shrink-0" />
                                <p className="text-[11px] text-amber-800 font-bold leading-snug">
                                    Some items may have missing data from the sheet. Use the{" "}
                                    <span className="text-[#039B81] font-black">Edit</span> button in the shipments table to fill in any empty fields.
                                </p>
                            </div>
                            {/* Retract (undo) a wrong upload */}
                            {batchId && (
                                <div className="mt-4 pt-4 border-t border-emerald-100">
                                    <button
                                        onClick={handleRetract}
                                        disabled={isRetracting}
                                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${
                                            confirmRetract
                                            ? "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20"
                                            : "bg-white text-red-500 border border-red-200 hover:bg-red-50"
                                        }`}
                                    >
                                        <Undo2 size={14} />
                                        {isRetracting
                                            ? "Retracting..."
                                            : confirmRetract
                                            ? "Click again to confirm — undo everything"
                                            : "Wrong file? Retract this upload"}
                                    </button>
                                    {confirmRetract && !isRetracting && (
                                        <p className="text-[10px] text-red-500 font-bold mt-2">
                                            This deletes the batch and reverses all item changes it made.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {retractedMsg && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3">
                            <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                            <div>
                                <p className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-1">Upload Retracted</p>
                                <p className="text-xs text-emerald-700 font-bold leading-relaxed">{retractedMsg}</p>
                            </div>
                        </div>
                    )}

                    {isDuplicate && error && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3">
                            <Info className="text-amber-500 shrink-0 mt-0.5" size={20} />
                            <div className="flex-1">
                                <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">Already Uploaded</p>
                                <p className="text-xs text-amber-700 font-bold leading-relaxed">{error}</p>
                                {duplicateBatchId ? (
                                    <>
                                        <p className="text-[10px] text-amber-600 mt-2">
                                            Uploaded the wrong file? Delete the previous upload and process this one instead.
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2 mt-3">
                                            <button
                                                onClick={handleReplaceAndRetry}
                                                disabled={isReplacing || isLoading}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20"
                                            >
                                                <Undo2 size={14} />
                                                {isReplacing ? "Replacing…" : "Delete previous & upload this"}
                                            </button>
                                            <button
                                                onClick={() => setView('manage')}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-white text-amber-700 border border-amber-300 hover:bg-amber-100"
                                            >
                                                <History size={14} /> Manage Uploads
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-amber-600 mt-2 leading-snug">
                                            If it says a later <span className="uppercase font-black">Arrived</span> upload must be retracted first,
                                            open <span className="font-black">Manage Uploads</span> and retract that one before this.
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-[10px] text-amber-600 mt-2">Select a different file or choose a different stage.</p>
                                )}
                            </div>
                        </div>
                    )}
                    {!isDuplicate && error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3">
                            <AlertCircle className="text-red-500 shrink-0" size={20} />
                            <p className="text-xs text-red-700 font-bold leading-relaxed">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 py-4 text-xs font-black uppercase tracking-widest bg-white"
                        >
                            {result ? "Close" : "Cancel"}
                        </Button>
                        {!result && (
                            <Button
                                onClick={handleUpload}
                                isLoading={isLoading}
                                disabled={!file}
                                className="flex-1 py-4 text-xs font-black uppercase tracking-widest shadow-xl shadow-[#039B81]/20"
                            >
                                {isLoading ? "Processing Sheet..." : "Process Upload"}
                            </Button>
                        )}
                    </div>
                </div>
                )}
            </div>
        </div>
    );
}

// ── RecentUploadsPanel — list & retract past uploads (in reverse order) ──
const STAGE_META: Record<string, { label: string; cls: string }> = {
    intake:  { label: "Intake",  cls: "bg-blue-50 text-blue-700" },
    shipped: { label: "Packing", cls: "bg-[#039B81]/10 text-[#039B81]" },
    arrived: { label: "Arrived", cls: "bg-purple-50 text-purple-700" },
};

function RecentUploadsPanel({ onChanged }: { onChanged: () => void }) {
    const [batches, setBatches] = useState<BatchSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ id: string; ok: boolean; msg: string; canForce?: boolean } | null>(null);
    const [forceConfirmId, setForceConfirmId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const data = await getBatches({ limit: 25 });
            setBatches(data?.batches ?? []);
        } catch {
            setLoadError("Couldn't load recent uploads. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const runRetract = async (id: string, force: boolean) => {
        setBusyId(id);
        setFeedback(null);
        try {
            const data = await retractBatch(id, force);
            setFeedback({ id, ok: true, msg: data?.summary || "Upload retracted." });
            setConfirmId(null);
            setForceConfirmId(null);
            onChanged();
            await load();
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Couldn't retract this upload.";
            // A 409 from the progressed-item guard is the only case force can override.
            const canForce = !force && err?.response?.status === 409 && /cannot retract/i.test(msg);
            setFeedback({ id, ok: false, msg, canForce });
            setConfirmId(null);
        } finally {
            setBusyId(null);
        }
    };

    const handleRetract = (id: string) => {
        if (confirmId !== id) { setConfirmId(id); setFeedback(null); return; }
        runRetract(id, false);
    };

    const handleForce = (id: string) => {
        if (forceConfirmId !== id) { setForceConfirmId(id); return; }
        runRetract(id, true);
    };

    return (
        <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent Uploads</p>
                <button onClick={load} className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-[#039B81] uppercase tracking-widest transition-colors">
                    <RefreshCw size={12} /> Refresh
                </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl flex gap-2">
                <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 font-bold leading-snug">
                    Retract in reverse order: an <span className="uppercase">Arrived</span> upload must be retracted before the
                    <span className="uppercase"> Packing</span> list it came from, which must be retracted before its <span className="uppercase">Intake</span>.
                </p>
            </div>

            {loading ? (
                <div className="py-12 flex justify-center"><RefreshCw className="text-[#039B81] animate-spin" size={28} /></div>
            ) : loadError ? (
                <p className="text-xs text-red-600 font-bold py-8 text-center">{loadError}</p>
            ) : batches.length === 0 ? (
                <p className="text-xs text-slate-400 font-bold py-8 text-center">No uploads yet.</p>
            ) : (
                <div className="space-y-2">
                    {batches.map((b) => {
                        const meta = STAGE_META[b.stage] ?? { label: b.stage, cls: "bg-slate-100 text-slate-500" };
                        const fb = feedback?.id === b._id ? feedback : null;
                        return (
                            <div key={b._id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${meta.cls}`}>{meta.label}</span>
                                            <span className="text-xs font-black text-slate-800 truncate">{b.batchCode}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold mt-1">
                                            {b.totalItems ?? 0} items{b.heldItems ? ` · ${b.heldItems} held` : ""}
                                            {b.createdAt ? ` · ${new Date(b.createdAt).toLocaleDateString()}` : ""}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleRetract(b._id)}
                                        disabled={busyId === b._id}
                                        className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${
                                            confirmId === b._id
                                            ? "bg-red-600 text-white hover:bg-red-700"
                                            : "bg-white text-red-500 border border-red-200 hover:bg-red-50"
                                        }`}
                                    >
                                        <Undo2 size={13} />
                                        {busyId === b._id ? "Retracting…" : confirmId === b._id ? "Confirm" : "Retract"}
                                    </button>
                                </div>
                                {fb && (
                                    <div className="mt-2">
                                        <p className={`text-[11px] font-bold leading-snug ${fb.ok ? "text-emerald-600" : "text-red-600"}`}>
                                            {fb.ok ? `✓ ${fb.msg}` : fb.msg}
                                        </p>
                                        {fb.canForce && (
                                            <div className="mt-2">
                                                <button
                                                    onClick={() => handleForce(b._id)}
                                                    disabled={busyId === b._id}
                                                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${
                                                        forceConfirmId === b._id
                                                        ? "bg-red-700 text-white hover:bg-red-800"
                                                        : "bg-white text-red-600 border border-red-300 hover:bg-red-50"
                                                    }`}
                                                >
                                                    <AlertCircle size={13} />
                                                    {busyId === b._id
                                                        ? "Forcing…"
                                                        : forceConfirmId === b._id
                                                        ? "Confirm force — undo anyway"
                                                        : "Force retract (override)"}
                                                </button>
                                                {forceConfirmId === b._id && (
                                                    <p className="text-[10px] text-red-500 font-bold mt-1.5 leading-snug">
                                                        This reverses the whole batch even though some items already moved forward.
                                                        Those items are reset too. Use only to undo a wrong upload.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
