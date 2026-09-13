"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import type { Parcel, Stage } from "@/services/parcels";
import { bulkSetStatus, type ParcelStatus } from "@/services/parcels";
import { STAGE_ORDER, STAGE_META, STATUS_ORDER, statusLabel, fmtDay } from "./parcelUi";
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
  parcels, onOpen, groupBy = "none", onChanged,
}: { parcels: Parcel[]; onOpen?: (p: Parcel) => void; groupBy?: GroupBy; onChanged?: () => void }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [busyGroup, setBusyGroup] = useState<string | null>(null);
  const toggle = (id: string) => setCollapsed((s) => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const applyGroupStatus = async (id: string, items: Parcel[], status: ParcelStatus) => {
    setBusyGroup(id);
    try {
      await bulkSetStatus(items.map((p) => ({ waybill: p.waybill, customerKey: p.customerKey })), status);
      onChanged?.();
    } finally {
      setBusyGroup(null);
    }
  };

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
                        <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/70 ${meta.text} ring-1 ${meta.ring} text-[11px] font-bold`}>
                          <button onClick={() => toggle(id)} className="flex items-center gap-1 truncate flex-1 text-left">
                            {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                            <span className="truncate">{g.label}</span>
                            <span className="ml-1 opacity-70">· {g.items.length}</span>
                          </button>
                          {busyGroup === id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <select
                              title="Set status for this whole group"
                              value=""
                              onChange={(e) => { if (e.target.value) applyGroupStatus(id, g.items, e.target.value as ParcelStatus); }}
                              className="text-[11px] font-semibold bg-transparent border border-current/30 rounded px-1 py-0.5 cursor-pointer focus:outline-none"
                            >
                              <option value="">Set status…</option>
                              {STATUS_ORDER.map((s) => <option key={s} value={s} className="text-slate-700">{statusLabel(s)}</option>)}
                            </select>
                          )}
                        </div>
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
