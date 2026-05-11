"use client";

import { useState } from "react";
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Info } from "lucide-react";
import Button from "@/components/common/Button";
import { uploadBatchShipped, uploadBatchArrived, uploadBatchIntake } from "@/services/shipments";

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setResult(null);
            setIsDuplicate(false);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        console.log("Starting bulk upload for stage:", stage);
        setIsLoading(true);
        setError(null);
        try {
            let data;
            if (stage === 'intake') {
                console.log("Calling uploadBatchIntake...");
                data = await uploadBatchIntake(file);
            } else if (stage === 'shipped') {
                console.log("Calling uploadBatchShipped...");
                data = await uploadBatchShipped(file);
            } else if (stage === 'arrived') {
                console.log("Calling uploadBatchArrived...");
                data = await uploadBatchArrived(file);
            }

            console.log("Upload result:", data);
            const batch = data?.batch;
            setResult({
                updated: batch?.matchedItems ?? 0,
                added:   batch?.newItems,
                held:    batch?.heldItems,
                skipped: data?.skippedRows?.length ?? 0,
            });
            onSuccess();
        } catch (err: any) {
            console.error("Bulk upload error details:", err.response?.data);
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
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
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Select Update Stage</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'intake', label: '1. Intake', desc: 'Warehouse' },
                                { id: 'shipped', label: '2. Shipped', desc: 'China Departure' },
                                { id: 'arrived', label: '3. Arrived', desc: 'Ghana Entry' }
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => { setStage(s.id as Stage); setFile(null); setResult(null); setError(null); setIsDuplicate(false); }}
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
                        <AlertCircle className="text-amber-500 shrink-0" size={20} />
                        <div className="text-xs text-amber-800 leading-relaxed font-bold">
                            {stage === 'intake' ? (
                                <span>
                                    <span className="text-[#039B81] uppercase font-black tracking-widest block mb-1">China Warehouse Format:</span>
                                    Excel must have 5 columns: <span className="text-slate-900 border-b border-slate-200">Delivery Notes, Tracking Number, Phone number, Quantity, Received Goods</span>.
                                    <span className="block mt-1 opacity-70">Headers on Row 1, Data starts from Row 2.</span>
                                </span>
                            ) : stage === 'shipped' ? (
                                <span>
                                    <span className="text-[#039B81] uppercase font-black tracking-widest block mb-1">China Departure (Stage 2) Format:</span>
                                    Excel must have 11 columns: <span className="text-slate-900 border-b border-slate-200">Invoice No, Tracking No, Contact, Customer Name, Location, Qty, CBM, Description, KG, Other, Date</span>.
                                    <span className="block mt-1 opacity-70">Headers on Row 4. Data starts from Row 5. Container info in Rows 2-3.</span>
                                </span>
                            ) : (
                                <span>
                                    <span className="text-[#039B81] uppercase font-black tracking-widest block mb-1">Ghana Arrival (Stage 3) Format:</span>
                                    Excel must have standard arrived columns. Headers on Row 1.
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
