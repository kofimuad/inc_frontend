"use client";

import React from "react";
import { Warehouse, Ship, PackageCheck, PhoneOff, AlertTriangle, Layers } from "lucide-react";
import type { Reconciliation } from "@/services/parcels";

export type RibbonKey = "all" | "in_warehouse" | "loaded" | "arrived" | "needs_phone" | "loaded_never_received";

const CARDS: {
  key: RibbonKey; label: string; icon: typeof Warehouse;
  field: keyof Reconciliation | "total"; tone: string; ring: string; iconBg: string;
}[] = [
  { key: "all",                  label: "All Parcels",     icon: Layers,       field: "total",               tone: "text-slate-800",   ring: "ring-slate-200",   iconBg: "bg-slate-100 text-slate-600" },
  { key: "in_warehouse",         label: "In Warehouse",    icon: Warehouse,    field: "receivedNotLoaded",   tone: "text-amber-700",   ring: "ring-amber-200",   iconBg: "bg-amber-50 text-amber-600" },
  { key: "loaded",               label: "On the Water",    icon: Ship,         field: "loaded",              tone: "text-sky-700",     ring: "ring-sky-200",     iconBg: "bg-sky-50 text-sky-600" },
  { key: "arrived",              label: "Arrived",         icon: PackageCheck, field: "arrived",             tone: "text-emerald-700", ring: "ring-emerald-200", iconBg: "bg-emerald-50 text-emerald-600" },
  { key: "loaded_never_received",label: "No Intake Record",icon: AlertTriangle,field: "loadedNeverReceived", tone: "text-rose-700",    ring: "ring-rose-200",    iconBg: "bg-rose-50 text-rose-600" },
  { key: "needs_phone",          label: "Needs Phone",     icon: PhoneOff,     field: "needsPhone",          tone: "text-orange-700",  ring: "ring-orange-200",  iconBg: "bg-orange-50 text-orange-600" },
];

export default function ReconciliationRibbon({
  recon, active, onSelect,
}: { recon: Reconciliation; active: RibbonKey; onSelect: (k: RibbonKey) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {CARDS.map((c) => {
        const Icon = c.icon;
        const value = c.field === "total" ? recon.total : recon[c.field];
        const isActive = active === c.key;
        return (
          <button
            key={c.key}
            onClick={() => onSelect(c.key)}
            className={`text-left bg-white rounded-2xl p-4 border shadow-sm hover:shadow-md transition-all ${isActive ? `ring-2 ${c.ring} border-transparent` : "border-slate-100"}`}
          >
            <div className="flex items-center justify-between">
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.iconBg}`}>
                <Icon size={17} />
              </span>
              <span className={`text-2xl font-black ${c.tone}`}>{value}</span>
            </div>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{c.label}</p>
          </button>
        );
      })}
    </div>
  );
}
