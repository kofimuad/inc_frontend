"use client";

import { useState } from "react";
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Info, ClipboardList, Undo2 } from "lucide-react";
import Button from "@/components/common/Button";
import { uploadBatchShipped, uploadBatchArrived, uploadBatchIntake, retractBatch } from "@/services/shipments";

interface BulkUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type Stage = 'intake' | 'shipped' | 'arrived';

export default function BulkUploadModal({ isOpen, onClose, onSuccess }: BulkUploadModalProps) {
    const [stage, setStage] = useState<Stage>('shipped');
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{
        updated: number;
        added?: number;
        held?: number;
        skipped: number;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDuplicate, setIsDuplicate] = useState(false);

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
            setBatchId(null);
            setConfirmRetract(false);
            setRetractedMsg(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsLoading(true);
        setError(null);
        try {
            let data;
            if (stage === 'intake') {
                data = await uploadBatchIntake(file);
            } else if (stage === 'shipped') {
                data = await uploadBatchShipped(file);
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
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Bulk Shipment Update</h2>
                        <p className="text-sm text-slate-500 font-medium mt-1">Update multiple shipments using Excel</p>
                    </div>
                    <button onClick={onClose} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                        <X size={24} />
                    </button>
                </div>

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
                                    onClick={() => { setStage(s.id as Stage); setFile(null); setResult(null); setError(null); setIsDuplicate(false); setBatchId(null); setConfirmRetract(false); setRetractedMsg(null); }}
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
                                    Rows 1–8: metadata (BL NUMBER, CTR NUMBER, VOLUME, SEAL NUMBER, PACKING LIST NUMBER, LOADING DATE, ETD, ETA).{" "}
                                    Row 9: column headers. Data from row 10.
                                    <br />
                                    <span className="block mt-1">Required columns:{" "}
                                        <span className="text-slate-900">JOB NUMBER, CNEE NAME, CUSTOMER NO (or PHONE NUMBER), LOCATION, GOODS TYPE, QUANTITY, CBM, DESCRIPTION, COLLECT O/F AMOUNT, PAYMENT TERM $, REMARKS</span>.
                                    </span>
                                </span>
                            ) : (
                                <span>
                                    <span className="text-[#039B81] uppercase font-black tracking-widest block mb-1">Goods Arrived List Format:</span>
                                    Upload the Ghana arrival list. Headers on Row 1.
                                </span>
                            )}
                        </div>
                    </div>

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
                            <div>
                                <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">Already Uploaded</p>
                                <p className="text-xs text-amber-700 font-bold leading-relaxed">{error}</p>
                                <p className="text-[10px] text-amber-600 mt-2">Select a different file or choose a different stage.</p>
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
            </div>
        </div>
    );
}
