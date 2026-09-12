"use client";

import React, { useMemo, useState } from "react";
import { Ship, CalendarRange, ArrowRight, AlertTriangle } from "lucide-react";
import type { Parcel, ContainerSummary } from "@/services/parcels";
import { fmtDate, fmtDay, customerLabel } from "./parcelUi";

/**
 * Containers view. The headline idea is the "fan-in": a container is loaded on
 * one day but its parcels were received across many days — the very thing that
 * made date-based tracking impossible. Each card shows that span explicitly.
 */
function FanIn({ days }: { days: string[] }) {
  if (!days.length) return null;
  return (
    <div className="flex items-end gap-1 h-8" title={`Receiving days: ${days.join(", ")}`}>
      {days.map((d, i) => (
        <div key={d} className="flex flex-col items-center gap-1">
          <div
            className="w-2 rounded-t bg-amber-400"
            style={{ height: `${10 + ((i * 7) % 22)}px` }}
          />
        </div>
      ))}
    </div>
  );
}

function ContainerCard({
  c, active, onClick,
}: { c: ContainerSummary; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-left bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all w-full ${active ? "border-sky-300 ring-2 ring-sky-100" : "border-slate-100"}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center ring-1 ring-sky-200">
            <Ship size={20} />
          </div>
          <div>
            <p className="font-mono font-bold text-slate-800 text-sm">{c.containerNo}</p>
            <p className="text-xs text-slate-400 font-medium">Loaded {fmtDate(c.loadingDate)}</p>
          </div>
        </div>
        <span className="text-2xl font-black text-slate-800">{c.parcels}</span>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 uppercase tracking-wide">
            <CalendarRange size={13} />
            {c.spansReceivingDays.length} receiving days
          </div>
          <FanIn days={c.spansReceivingDays} />
        </div>
        <div className="text-right text-[11px] text-slate-400 font-medium leading-relaxed">
          <p>ETD {fmtDay(c.etd)}</p>
          <p>ETA {fmtDay(c.eta)}</p>
        </div>
      </div>
    </button>
  );
}

export default function ContainersView({
  containers, parcels, onOpen,
}: { containers: ContainerSummary[]; parcels: Parcel[]; onOpen?: (p: Parcel) => void }) {
  const [selected, setSelected] = useState<string | null>(containers[0]?.containerNo ?? null);

  const manifest = useMemo(
    () => parcels.filter((p) => p.loading?.containerNo === selected),
    [parcels, selected]
  );
  const selectedContainer = containers.find((c) => c.containerNo === selected);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {containers.map((c) => (
          <ContainerCard key={c.containerNo} c={c} active={c.containerNo === selected} onClick={() => setSelected(c.containerNo)} />
        ))}
      </div>

      {selectedContainer && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-800">Manifest — <span className="font-mono">{selectedContainer.containerNo}</span></h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{manifest.length} parcels on board</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 ring-1 ring-amber-200">
              <CalendarRange size={14} />
              Received {fmtDay(selectedContainer.spansReceivingDays[0])}
              <ArrowRight size={12} />
              {fmtDay(selectedContainer.spansReceivingDays[selectedContainer.spansReceivingDays.length - 1])}
              <span className="text-amber-500">· across {selectedContainer.spansReceivingDays.length} days</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="px-5 py-3 font-bold">Tracking No.</th>
                  <th className="px-5 py-3 font-bold">Customer</th>
                  <th className="px-5 py-3 font-bold">Received</th>
                  <th className="px-5 py-3 font-bold">Qty</th>
                  <th className="px-5 py-3 font-bold">Flag</th>
                </tr>
              </thead>
              <tbody>
                {manifest.map((p) => (
                  <tr
                    key={(p._id || p.waybill) + p.customerKey}
                    onClick={() => onOpen?.(p)}
                    className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="px-5 py-3 font-mono text-[13px] text-slate-700">{p.waybill}</td>
                    <td className="px-5 py-3 text-slate-700 font-medium">{customerLabel(p)}</td>
                    <td className="px-5 py-3 text-slate-500">{fmtDay(p.receivedDate)}</td>
                    <td className="px-5 py-3 text-slate-500">{p.qty ?? "—"}</td>
                    <td className="px-5 py-3">
                      {p.flags.loadedNeverReceived ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full ring-1 ring-rose-200">
                          <AlertTriangle size={11} /> No intake record
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-semibold">✓ matched</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
