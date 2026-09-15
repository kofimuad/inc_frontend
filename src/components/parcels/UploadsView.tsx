"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Undo2, Loader2, FileSpreadsheet, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { listUploads, revertUpload, type SourceFileRow } from "@/services/parcels";
import { STAGE_META, fmtDate } from "./parcelUi";

/**
 * Every uploaded sheet is a batch. This is where staff see what's been loaded,
 * tell one batch from another, and undo a wrong upload (which re-derives the
 * affected parcels — no data is lost).
 */
export default function UploadsView({ onChanged }: { onChanged?: () => void }) {
  const PAGE_SIZE = 25;
  const [files, setFiles] = useState<SourceFileRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reverting, setReverting] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((p: number) => {
    setLoading(true);
    // status:'' → include reverted ones too, so the history is visible.
    listUploads({ status: "", page: p, limit: PAGE_SIZE })
      .then((d) => { setFiles(d.files || []); setTotal(d.total || 0); setError(null); })
      .catch(() => setError("Couldn't load uploads."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page); }, [load, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const doRevert = async (hash: string) => {
    setReverting(hash); setConfirming(null);
    try {
      await revertUpload(hash);
      load(page);
      onChanged?.();
    } catch {
      setError("Revert failed — try again.");
    } finally {
      setReverting(null);
    }
  };

  if (loading) {
    return <div className="bg-white rounded-2xl border border-slate-100 py-16 flex items-center justify-center text-slate-400 gap-2 font-medium"><Loader2 className="animate-spin" /> Loading uploads…</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800">Uploads</h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Each sheet you upload is one batch. Revert to undo a wrong file. {total} total.</p>
        </div>
        <button onClick={() => load(page)} className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-50" title="Refresh"><RefreshCw size={16} /></button>
      </div>

      {error && <div className="px-5 py-3 text-sm text-rose-600 bg-rose-50">{error}</div>}

      {files.length === 0 ? (
        <div className="py-16 text-center text-slate-400 font-medium text-sm">No uploads yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th className="px-5 py-3 font-bold">Stage</th>
                <th className="px-5 py-3 font-bold">File</th>
                <th className="px-5 py-3 font-bold">Uploaded</th>
                <th className="px-5 py-3 font-bold">Rows</th>
                <th className="px-5 py-3 font-bold">Status</th>
                <th className="px-5 py-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => {
                const meta = STAGE_META[f.stage];
                const isReverted = f.status === "reverted";
                return (
                  <tr key={f.fileHash} className={`border-b border-slate-50 ${isReverted ? "opacity-55" : ""}`}>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${meta.soft} ${meta.text} ring-1 ${meta.ring}`}>
                        {meta.short}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2 text-slate-700 font-medium">
                        <FileSpreadsheet size={15} className="text-slate-400 shrink-0" />
                        <span className="truncate max-w-[280px]">{f.originalFilename || "—"}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{fmtDate(f.uploadedAt)}</td>
                    <td className="px-5 py-3 text-slate-500">{f.rowCount ?? "—"}</td>
                    <td className="px-5 py-3">
                      {isReverted
                        ? <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Reverted</span>
                        : <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">Active</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {isReverted ? (
                        <span className="text-xs text-slate-300">—</span>
                      ) : confirming === f.fileHash ? (
                        <span className="inline-flex items-center gap-2">
                          <button onClick={() => doRevert(f.fileHash)} disabled={reverting === f.fileHash}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold disabled:opacity-50">
                            {reverting === f.fileHash ? <Loader2 size={13} className="animate-spin" /> : <Undo2 size={13} />} Confirm revert
                          </button>
                          <button onClick={() => setConfirming(null)} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Cancel</button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirming(f.fileHash)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:border-rose-300 hover:text-rose-600 transition-colors">
                          <Undo2 size={13} /> Revert
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
          <span className="text-xs text-slate-400 font-medium">Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
