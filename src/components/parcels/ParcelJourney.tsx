"use client";

import React, { useState } from "react";
import { X, Phone, Tag, MapPin, Box, AlertTriangle, Save, PauseCircle, Loader2 } from "lucide-react";
import type { Parcel } from "@/services/parcels";
import { adjustParcel } from "@/services/parcels";
import { STAGE_ORDER, STAGE_META, stageRank, fmtDate, customerLabel } from "./parcelUi";

/** Slide-over showing one tracking number's journey through the pipeline. */
export default function ParcelJourney({ parcel, onClose, onChanged }: { parcel: Parcel | null; onClose: () => void; onChanged?: () => void }) {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  if (!parcel) return null;
  const reached = stageRank(parcel.currentStage);

  const savePhone = async () => {
    if (!phone.trim()) return;
    setBusy("phone");
    try { await adjustParcel(parcel.waybill, parcel.customerKey, { customerPhone: phone.trim() }); setSaved("Phone saved"); onChanged?.(); }
    catch { setSaved("Could not save — try again"); }
    finally { setBusy(null); }
  };
  const putOnHold = async () => {
    setBusy("hold");
    try { await adjustParcel(parcel.waybill, parcel.customerKey, { statusOverride: "held", heldReason: "Placed on hold by staff" }); setSaved("Parcel held"); onChanged?.(); }
    catch { setSaved("Could not update — try again"); }
    finally { setBusy(null); }
  };

  const stageDetail = (stage: (typeof STAGE_ORDER)[number]) => {
    if (stage === "intake" && parcel.intake)
      return [["Received", fmtDate(parcel.intake.date)], ["Warehouse", parcel.intake.warehouse || "—"], ["Qty", parcel.intake.qty ?? "—"]];
    if (stage === "loading" && parcel.loading)
      return [["Container", parcel.loading.containerNo || "—"], ["Loaded", fmtDate(parcel.loading.loadingDate)], ["ETA", parcel.loading.eta || "—"], ["CBM", parcel.loading.cbm ?? "—"]];
    if (stage === "arrival" && parcel.arrival)
      return [["Arrived", fmtDate(parcel.arrival.date)], ["Container", parcel.arrival.containerNo || "—"]];
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-50 h-full overflow-y-auto shadow-2xl">
        {/* header */}
        <div className="bg-white border-b border-slate-100 p-5 sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-widest font-bold text-slate-400">Tracking number</p>
              <p className="font-mono font-bold text-lg text-slate-800 break-all">{parcel.waybill}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
              <X size={20} />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 font-medium">
            {parcel.customerPhone ? <Phone size={14} className="text-slate-400" />
              : parcel.shippingMark ? <Tag size={14} className="text-slate-400" /> : <Box size={14} className="text-slate-400" />}
            {customerLabel(parcel)}
            {parcel.customerPhone && parcel.customerName && (
              <span className="font-mono text-xs text-slate-400">{parcel.customerPhone}</span>
            )}
          </div>
        </div>

        {/* flags */}
        {(parcel.flags.loadedNeverReceived || parcel.flags.needsPhone || parcel.flags.qtyMismatch) && (
          <div className="p-5 pb-0 space-y-2">
            {parcel.flags.loadedNeverReceived && (
              <Flag text="Loaded without an intake record — the goods-received sheet for its receiving date has not been uploaded. Received date recovered from the loading list." />
            )}
            {parcel.flags.needsPhone && <Flag text="No phone number on file — appears on the staff worklist." />}
            {parcel.flags.qtyMismatch && <Flag text="Quantity differs between intake and loading." />}
          </div>
        )}

        {/* timeline */}
        <div className="p-5">
          <ol className="relative border-l-2 border-slate-200 ml-3 space-y-6">
            {STAGE_ORDER.map((stage, i) => {
              const meta = STAGE_META[stage];
              const Icon = meta.icon;
              const on = i <= reached;
              const detail = stageDetail(stage);
              return (
                <li key={stage} className="ml-6">
                  <span className={`absolute -left-[13px] flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-slate-50 ${on ? meta.dot : "bg-slate-300"}`}>
                    <Icon size={12} className="text-white" />
                  </span>
                  <div className={`rounded-xl border p-4 ${on ? "bg-white border-slate-100 shadow-sm" : "bg-transparent border-dashed border-slate-200"}`}>
                    <p className={`font-bold text-sm ${on ? meta.text : "text-slate-400"}`}>{meta.label}</p>
                    {on && detail ? (
                      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                        {detail.map(([k, v]) => (
                          <div key={k} className="flex flex-col">
                            <dt className="text-slate-400 font-medium">{k}</dt>
                            <dd className="text-slate-700 font-semibold">{String(v)}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="mt-1 text-xs text-slate-400 font-medium">{on ? "—" : "Not yet reached"}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {parcel.productDescription && (
            <div className="mt-6 bg-white rounded-xl border border-slate-100 p-4">
              <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5"><MapPin size={12} /> Goods</p>
              <p className="mt-1 text-sm text-slate-700 font-medium">{parcel.productDescription}</p>
            </div>
          )}

          {/* Staff actions — recorded as manual adjustments; survive re-derivation. */}
          <div className="mt-6 bg-white rounded-xl border border-slate-100 p-4">
            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-3">Staff actions</p>
            {parcel.flags.needsPhone && (
              <div className="flex items-center gap-2 mb-3">
                <input
                  value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="Add phone number"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  onClick={savePhone} disabled={busy === "phone" || !phone.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-40"
                >
                  {busy === "phone" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                </button>
              </div>
            )}
            <button
              onClick={putOnHold} disabled={busy === "hold" || parcel.status === "held"}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:border-amber-300 hover:text-amber-700 disabled:opacity-40"
            >
              {busy === "hold" ? <Loader2 size={14} className="animate-spin" /> : <PauseCircle size={14} />}
              {parcel.status === "held" ? "On hold" : "Put on hold"}
            </button>
            {saved && <p className="mt-2 text-xs text-emerald-600 font-semibold">{saved}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Flag({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 bg-rose-50 text-rose-700 rounded-xl p-3 ring-1 ring-rose-200">
      <AlertTriangle size={15} className="shrink-0 mt-0.5" />
      <p className="text-xs font-medium leading-relaxed">{text}</p>
    </div>
  );
}
