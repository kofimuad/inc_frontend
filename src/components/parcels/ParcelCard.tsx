"use client";

import React from "react";
import { Phone, Tag, Box } from "lucide-react";
import type { Parcel } from "@/services/parcels";
import { STAGE_ORDER, STAGE_META, STATUS_META, statusLabel, stageRank, fmtDay, daysWaiting, customerLabel, alertOf, qtyLabel, containerCount } from "./parcelUi";

/** The three-node stage tracker shown on every parcel card. */
export function StageTracker({ parcel, size = "sm" }: { parcel: Parcel; size?: "sm" | "md" }) {
  const reached = stageRank(parcel.currentStage);
  const dot = size === "md" ? "w-3 h-3" : "w-2.5 h-2.5";
  const line = size === "md" ? "h-0.5" : "h-px";
  return (
    <div className="flex items-center gap-1" title={`Current stage: ${STAGE_META[parcel.currentStage].label}`}>
      {STAGE_ORDER.map((s, i) => {
        const on = i <= reached;
        return (
          <React.Fragment key={s}>
            <span className={`${dot} rounded-full ${on ? STAGE_META[s].dot : "bg-slate-200"}`} />
            {i < STAGE_ORDER.length - 1 && (
              <span className={`w-4 ${line} ${i < reached ? STAGE_META[parcel.currentStage].dot : "bg-slate-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function ParcelCard({ parcel, onOpen }: { parcel: Parcel; onOpen?: (p: Parcel) => void }) {
  const alert = alertOf(parcel);
  const waited = daysWaiting(parcel);
  const qty = qtyLabel(parcel);
  const containers = containerCount(parcel);
  const receipts = parcel.intake?.lines?.length ?? 0;
  return (
    <button
      onClick={() => onOpen?.(parcel)}
      className="w-full text-left bg-white rounded-xl border border-slate-100 p-3.5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[13px] font-semibold text-slate-800 group-hover:text-primary break-all">
          {parcel.waybill}
        </span>
        <StageTracker parcel={parcel} />
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-700 font-medium">
        {parcel.customerPhone ? <Phone size={13} className="text-slate-400 shrink-0" />
          : parcel.shippingMark ? <Tag size={13} className="text-slate-400 shrink-0" />
          : <Box size={13} className="text-slate-400 shrink-0" />}
        <span className="truncate">{customerLabel(parcel)}</span>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-medium">
        {qty && <span>{qty}{receipts > 1 && <span className="text-slate-400"> · {receipts} receipts</span>}</span>}
        <span>Rec. {fmtDay(parcel.receivedDate)}</span>
        {containers > 1
          ? <span className="font-mono">{containers} containers</span>
          : parcel.loading?.containerNo && <span className="font-mono">{parcel.loading.containerNo}</span>}
        {waited != null && waited >= 3 && (
          <span className="text-amber-600 font-semibold">{waited}d waiting</span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ring-1 ${STATUS_META[parcel.status]?.cls || "bg-slate-50 text-slate-600 ring-slate-200"}`}>
          {statusLabel(parcel.status)}
        </span>
        {parcel.flags.partiallyArrived && (
          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ring-1 bg-teal-50 text-teal-700 ring-teal-200">
            Partially arrived
          </span>
        )}
        {parcel.flags.partiallyLoaded && (
          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ring-1 bg-amber-50 text-amber-700 ring-amber-200">
            Partly loaded
          </span>
        )}
        {alert && (
          <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ring-1 ${alert.className}`}>
            {alert.label}
          </span>
        )}
      </div>
    </button>
  );
}
