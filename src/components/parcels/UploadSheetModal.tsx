"use client";

import React, { useRef, useState } from "react";
import { X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { validateSheet, uploadSheet, type UploadPreview } from "@/services/parcels";
import { STAGE_META } from "./parcelUi";
import type { Stage } from "@/services/parcels";

/**
 * Staff upload for any stage sheet. The stage is detected from the file, not
 * chosen — we validate first (a no-write preview), then let the user confirm.
 */
export default function UploadSheetModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<UploadPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const pick = (f: File | null) => {
    setError(null); setPreview(null); setDone(null); setFile(f);
    if (f) runValidate(f);
  };

  const runValidate = async (f: File) => {
    setBusy(true); setError(null);
    try {
      setPreview(await validateSheet(f));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Could not read that file.");
    } finally { setBusy(false); }
  };

  const doUpload = async (opts: { force?: boolean; replace?: string } = {}) => {
    if (!file) return;
    setBusy(true); setError(null);
    try {
      const r = await uploadSheet(file, opts);
      setDone(`${r.stage} sheet ingested — ${r.parcelsWritten} parcels updated`);
      onUploaded();
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { contentDuplicate?: boolean; message?: string } } };
      if (err.response?.status === 409) {
        setError(err.response.data?.message
          || (err.response.data?.contentDuplicate ? "A sheet with the same contents is already uploaded." : "This exact file has already been uploaded."));
      } else {
        setError(err.response?.data?.message || "Upload failed.");
      }
    } finally { setBusy(false); }
  };

  const meta = preview?.stage ? STAGE_META[preview.stage as Stage] : null;
  const dup = preview?.duplicateOf ?? null;
  const canConfirm = !!preview && !busy && !!preview.stage && preview.missingColumns.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Upload a sheet</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {!done && (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 rounded-xl py-8 flex flex-col items-center gap-2 text-slate-400 hover:border-primary hover:text-primary transition-colors"
            >
              {file ? <FileSpreadsheet size={26} /> : <UploadCloud size={26} />}
              <span className="text-sm font-semibold">{file ? file.name : "Choose an .xlsx / .xls file"}</span>
              <span className="text-[11px]">Goods received · loading list · arrival list — stage is detected automatically</span>
            </button>
          )}
          <input
            ref={inputRef} type="file" accept=".xlsx,.xls" hidden
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />

          {busy && !done && (
            <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Reading…</div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-rose-50 text-rose-700 rounded-xl p-3 ring-1 ring-rose-200 text-sm">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {done && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-xl p-3 ring-1 ring-emerald-200 text-sm font-medium">
              <CheckCircle2 size={16} /> {done}
            </div>
          )}

          {dup && !done && (
            <div className={`flex items-start gap-2 rounded-xl p-3 ring-1 text-sm ${dup.exact ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-amber-50 text-amber-800 ring-amber-200"}`}>
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div>
                {dup.exact ? (
                  <>This <b>exact file</b> is already uploaded{dup.originalFilename ? <> as <b>{dup.originalFilename}</b></> : ""} — there is nothing new to add.</>
                ) : (
                  <>This looks like a <b>re-upload</b> of {dup.originalFilename ? <b>{dup.originalFilename}</b> : "an existing sheet"}. Uploading it again creates a duplicate, and reverting one copy later won&apos;t remove the goods. <b>Replace</b> the existing one, or upload anyway if they are genuinely different.</>
                )}
              </div>
            </div>
          )}

          {preview && !done && !error && (
            <div className="border border-slate-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Detected stage</span>
                {meta ? (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.soft} ${meta.text} ring-1 ${meta.ring}`}>{meta.label}</span>
                ) : <span className="text-xs font-bold text-rose-600">Unknown</span>}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat n={preview.totalRows} label="rows" />
                <Stat n={preview.willCreateNew} label="new" />
                <Stat n={preview.willLinkExisting} label="linked" />
              </div>
              {preview.missingColumns.length > 0 && (
                <p className="text-xs text-rose-600 font-medium">Missing columns: {preview.missingColumns.join(", ")}</p>
              )}
              {preview.headerWarnings.length > 0 && (
                <p className="text-[11px] text-amber-600">{preview.headerWarnings.length} column warning(s)</p>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
          {done ? (
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold">Done</button>
          ) : (
            <>
              <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-slate-500 text-sm font-semibold hover:bg-slate-100">Cancel</button>
              {dup && !dup.exact ? (
                <>
                  <button
                    onClick={() => doUpload({ force: true })} disabled={!canConfirm}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Upload anyway
                  </button>
                  <button
                    onClick={() => doUpload({ replace: dup.fileHash })} disabled={!canConfirm}
                    className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {busy ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />} Replace existing
                  </button>
                </>
              ) : (
                <button
                  onClick={() => doUpload()}
                  disabled={!canConfirm || !!(dup && dup.exact)}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />} Confirm upload
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="bg-slate-50 rounded-lg py-2">
      <div className="text-lg font-black text-slate-800">{n}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{label}</div>
    </div>
  );
}
