"use client";

import React, { useState } from "react";
import { X, Phone, Tag, MapPin, Box, AlertTriangle, Save, PauseCircle, Loader2 } from "lucide-react";
import type { Parcel } from "@/services/parcels";
import { adjustParcel } from "@/services/parcels";
import { STAGE_ORDER, STAGE_META, STATUS_ORDER, statusLabel, stageRank, fmtDate, fmtDay, customerLabel, qtyLabel, containerCount } from "./parcelUi";

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
  const setStatus = async (status: string) => {
    setBusy("status");
    try { await adjustParcel(parcel.waybill, parcel.customerKey, { statusOverride: status }); setSaved("Status updated — the customer sees this."); onChanged?.(); }
    catch { setSaved("Could not update status — try again"); }
    finally { setBusy(null); }
  };
  const putOnHold = async () => {
    setBusy("hold");
    try { await adjustParcel(parcel.waybill, parcel.customerKey, { statusOverride: "held", heldReason: "Placed on hold by staff" }); setSaved("Parcel held"); onChanged?.(); }
    catch { setSaved("Could not update — try again"); }
    finally { setBusy(null); }
  };

  const containers = containerCount(parcel);
  const stageDetail = (stage: (typeof STAGE_ORDER)[number]) => {
    if (stage === "intake" && parcel.intake)
      return [["Received", fmtDate(parcel.intake.date)], ["Warehouse", parcel.intake.warehouse || "—"], ["Qty", qtyLabel(parcel) ?? "—"]];
    if (stage === "loading" && parcel.loading)
      return [["Container", containers > 1 ? `${containers} containers` : (parcel.loading.containerNo || "—")], ["Loaded", fmtDate(parcel.loading.loadingDate)], ["ETA", parcel.loading.eta || "—"], ["CBM", parcel.loading.cbm ?? "—"]];
    if (stage === "arrival" && parcel.arrival)
      return [["Arrived", fmtDate(parcel.arrival.date)], ["Container", parcel.arrival.containerNo || "—"]];
    return null;
  };

  // Per-line / per-leg breakdown shown under a stage when a tracking number
  // carries several goods (received over multiple days, or split across
  // containers).
  const breakdown = (stage: (typeof STAGE_ORDER)[number]) => {
    if (stage === "intake" && (parcel.intake?.lines?.length ?? 0) > 1) {
      return (
        <div className="mt-2 border-t border-slate-100 pt-2 space-y-1">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{parcel.intake!.lines!.length} receipts</p>
          {parcel.intake!.lines!.map((l, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-slate-500">{fmtDay(l.date)}</span>
              <span className="text-slate-700 font-semibold">{l.qtyRaw || l.qty || "—"}</span>
            </div>
          ))}
        </div>
      );
    }
    if (stage === "loading" && (parcel.loading?.legs?.length ?? 0) > 1) {
      const legs = parcel.loading!.legs!;
      const distinctContainers = new Set(legs.map((l) => l.containerNo).filter(Boolean)).size;
      const header = distinctContainers > 1 ? `${distinctContainers} containers` : `${legs.length} loads`;
      return (
        <div className="mt-2 border-t border-slate-100 pt-2 space-y-1">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{header}</p>
          {parcel.loading!.legs!.map((l, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="font-mono text-slate-600">{l.containerNo || "—"}</span>
              <span className="flex items-center gap-2">
                <span className="text-slate-500">{l.qtyRaw || l.qty || "—"}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${l.arrived ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"}`}>
                  {l.arrived ? "Arrived" : "On the water"}
                </span>
              </span>
            </div>
          ))}
        </div>
      );
    }
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
        {(parcel.flags.loadedNeverReceived || parcel.flags.needsPhone || parcel.flags.qtyMismatch || parcel.flags.partiallyArrived || parcel.flags.mixedUnits) && (
          <div className="p-5 pb-0 space-y-2">
            {parcel.flags.loadedNeverReceived && (
              <Flag text="Loaded without an intake record — the goods-received sheet for its receiving date has not been uploaded. Received date recovered from the loading list." />
            )}
            {parcel.flags.needsPhone && <Flag text="No phone number on file — appears on the staff worklist." />}
            {parcel.flags.qtyMismatch && <Flag text="Total quantity differs between intake and loading." />}
            {parcel.flags.partiallyArrived && <Flag tone="info" text="Some of this shipment's containers have arrived while others are still on the water — see the containers below." />}
            {parcel.flags.mixedUnits && <Flag tone="info" text="This shipment mixes units (e.g. pallets and loose pieces); quantities are shown per unit rather than as one total." />}
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
                    {on && breakdown(stage)}
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
            <div className="mb-3">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
              <select
                value={STATUS_ORDER.includes(parcel.status as never) ? parcel.status : ""}
                onChange={(e) => setStatus(e.target.value)}
                disabled={busy === "status"}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
              >
                {!STATUS_ORDER.includes(parcel.status as never) && <option value="">{statusLabel(parcel.status)}</option>}
                {STATUS_ORDER.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
            </div>
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

function Flag({ text, tone = "warn" }: { text: string; tone?: "warn" | "info" }) {
  const cls = tone === "info"
    ? "bg-teal-50 text-teal-800 ring-teal-200"
    : "bg-rose-50 text-rose-700 ring-rose-200";
  return (
    <div className={`flex items-start gap-2 rounded-xl p-3 ring-1 ${cls}`}>
      <AlertTriangle size={15} className="shrink-0 mt-0.5" />
      <p className="text-xs font-medium leading-relaxed">{text}</p>
    </div>
  );
}
