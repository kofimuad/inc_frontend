"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Parcel, Stage } from "@/services/parcels";
import { STAGE_ORDER, STAGE_META, fmtDay } from "./parcelUi";
import ParcelCard from "./ParcelCard";

export type GroupBy = "none" | "container" | "date";

/** The batch a parcel belongs to, under the chosen grouping. */
function groupOf(p: Parcel, by: GroupBy): { key: string; label: string; sort: string } {
  if (by === "container") {
    const c = p.loading?.containerNo || p.arrival?.containerNo;
    return c ? { key: c, label: c, sort: c } : { key: "__await", label: "Awaiting container", sort: "￿" };
  }
  if (by === "date") {
    if (!p.receivedDate) return { key: "__nodate", label: "No receiving date", sort: "0000" };
    const iso = new Date(p.receivedDate).toISOString().slice(0, 10);
    return { key: iso, label: fmtDay(p.receivedDate), sort: iso };
  }
  return { key: "__all", label: "", sort: "" };
}

/**
 * The pipeline board — one column per stage. With `groupBy` set, each column's
 * parcels are split into labelled, collapsible batch groups (container or
 * receiving date) so a new upload doesn't blend into the pile.
 */
export default function PipelineBoard({
  parcels, onOpen, groupBy = "none",
}: { parcels: Parcel[]; onOpen?: (p: Parcel) => void; groupBy?: GroupBy }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setCollapsed((s) => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const columns: Record<Stage, Parcel[]> = { intake: [], loading: [], arrival: [] };
  for (const p of parcels) columns[p.currentStage].push(p);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {STAGE_ORDER.map((stage) => {
        const meta = STAGE_META[stage];
        const Icon = meta.icon;
        const list = columns[stage];

        // Build groups for this column.
        const groups = new Map<string, { label: string; sort: string; items: Parcel[] }>();
        for (const p of list) {
          const g = groupOf(p, groupBy);
          if (!groups.has(g.key)) groups.set(g.key, { label: g.label, sort: g.sort, items: [] });
          groups.get(g.key)!.items.push(p);
        }
        const ordered = [...groups.entries()].sort((a, b) => b[1].sort.localeCompare(a[1].sort));

        return (
          <div key={stage} className={`rounded-2xl ${meta.soft} border border-slate-100 flex flex-col min-h-[200px]`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/60">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center ${meta.text} ring-1 ${meta.ring}`}>
                  <Icon size={16} />
                </div>
                <span className={`font-bold text-sm ${meta.text}`}>{meta.label}</span>
              </div>
              <span className={`text-xs font-black ${meta.text} bg-white rounded-full px-2.5 py-1 ring-1 ${meta.ring}`}>{list.length}</span>
            </div>

            <div className="p-3 space-y-2.5 overflow-y-auto max-h-[64vh] hide-scrollbar">
              {list.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-8 font-medium">Nothing here</p>
              )}

              {groupBy === "none"
                ? list.map((p) => <ParcelCard key={(p._id || p.waybill) + p.customerKey} parcel={p} onOpen={onOpen} />)
                : ordered.map(([key, g]) => {
                    const id = stage + "|" + key;
                    const isCollapsed = collapsed.has(id);
                    return (
                      <div key={id} className="space-y-2">
                        <button
                          onClick={() => toggle(id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/70 ${meta.text} ring-1 ${meta.ring} text-[11px] font-bold`}
                        >
                          <span className="flex items-center gap-1 truncate">
                            {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                            <span className="truncate">{g.label}</span>
                          </span>
                          <span>{g.items.length}</span>
                        </button>
                        {!isCollapsed && g.items.map((p) => (
                          <ParcelCard key={(p._id || p.waybill) + p.customerKey} parcel={p} onOpen={onOpen} />
                        ))}
                      </div>
                    );
                  })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
