"use client";

import React from "react";
import type { Parcel, Stage } from "@/services/parcels";
import { STAGE_ORDER, STAGE_META } from "./parcelUi";
import ParcelCard from "./ParcelCard";

/**
 * The pipeline board — one column per real-world stage of a parcel. This is the
 * view the old design could not draw: a parcel sits in the column it is actually
 * in (received / loaded / arrived), regardless of which file or date it came
 * from. Staff see the flow at a glance instead of cross-referencing sheets.
 */
export default function PipelineBoard({
  parcels, onOpen,
}: { parcels: Parcel[]; onOpen?: (p: Parcel) => void }) {
  const columns: Record<Stage, Parcel[]> = { intake: [], loading: [], arrival: [] };
  for (const p of parcels) columns[p.currentStage].push(p);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {STAGE_ORDER.map((stage) => {
        const meta = STAGE_META[stage];
        const Icon = meta.icon;
        const list = columns[stage];
        return (
          <div key={stage} className={`rounded-2xl ${meta.soft} border border-slate-100 flex flex-col min-h-[200px]`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/60">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center ${meta.text} ring-1 ${meta.ring}`}>
                  <Icon size={16} />
                </div>
                <span className={`font-bold text-sm ${meta.text}`}>{meta.label}</span>
              </div>
              <span className={`text-xs font-black ${meta.text} bg-white rounded-full px-2.5 py-1 ring-1 ${meta.ring}`}>
                {list.length}
              </span>
            </div>
            <div className="p-3 space-y-2.5 overflow-y-auto max-h-[64vh] hide-scrollbar">
              {list.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-8 font-medium">Nothing here</p>
              )}
              {list.map((p) => (
                <ParcelCard key={(p._id || p.waybill) + p.customerKey} parcel={p} onOpen={onOpen} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
