"use client";

import React, { useMemo, useState } from "react";
import { Search, LayoutGrid, Container as ContainerIcon, PackageSearch, FlaskConical, UploadCloud, History } from "lucide-react";
import { useParcels } from "@/hooks/useParcels";
import type { Parcel } from "@/services/parcels";
import ReconciliationRibbon, { type RibbonKey } from "./ReconciliationRibbon";
import PipelineBoard, { type GroupBy } from "./PipelineBoard";
import ContainersView from "./ContainersView";
import ParcelJourney from "./ParcelJourney";
import UploadSheetModal from "./UploadSheetModal";
import UploadsView from "./UploadsView";
import { customerLabel } from "./parcelUi";

type Tab = "pipeline" | "containers" | "uploads";

const BUCKET_PREDICATE: Record<RibbonKey, (p: Parcel) => boolean> = {
  all:                   () => true,
  in_warehouse:          (p) => p.flags.receivedNotLoaded,
  loaded:                (p) => p.currentStage === "loading",
  arrived:               (p) => p.currentStage === "arrival",
  needs_phone:           (p) => p.flags.needsPhone,
  loaded_never_received: (p) => p.flags.loadedNeverReceived,
};

export default function ParcelWorkspace() {
  const { reconciliation, parcels, containers, loading, isDemo, reload } = useParcels();
  const [tab, setTab] = useState<Tab>("pipeline");
  const [bucket, setBucket] = useState<RibbonKey>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupBy>("container");
  const [batch, setBatch] = useState<string>("all");

  // Container batches present in the data, newest first, for the batch filter.
  const batchOptions = useMemo(
    () => [...new Set(parcels.map((p) => p.loading?.containerNo || p.arrival?.containerNo).filter(Boolean) as string[])].sort().reverse(),
    [parcels]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return parcels.filter((p) => {
      if (!BUCKET_PREDICATE[bucket](p)) return false;
      if (batch !== "all" && p.loading?.containerNo !== batch && p.arrival?.containerNo !== batch) return false;
      if (!q) return true;
      return (
        p.waybill.toLowerCase().includes(q) ||
        customerLabel(p).toLowerCase().includes(q) ||
        (p.customerPhone || "").toLowerCase().includes(q)
      );
    });
  }, [parcels, bucket, query, batch]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Parcel Tracking</h1>
          <p className="text-sm text-slate-400 font-medium mt-0.5">
            Every tracking number, followed across warehouse → container → arrival.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isDemo && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full ring-1 ring-indigo-200">
              <FlaskConical size={13} /> Sample data (July–August sheets)
            </span>
          )}
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary-dark transition-colors"
          >
            <UploadCloud size={16} /> Upload sheet
          </button>
        </div>
      </div>

      <ReconciliationRibbon recon={reconciliation} active={bucket} onSelect={(k) => { setBucket(k); setTab("pipeline"); }} />

      {/* controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex bg-slate-100 rounded-xl p-1">
          <TabButton icon={LayoutGrid} label="Pipeline" active={tab === "pipeline"} onClick={() => setTab("pipeline")} />
          <TabButton icon={ContainerIcon} label="Containers" active={tab === "containers"} onClick={() => setTab("containers")} />
          <TabButton icon={History} label="Uploads" active={tab === "uploads"} onClick={() => setTab("uploads")} />
        </div>
        {tab === "pipeline" && (
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tracking no., customer, phone…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        )}
      </div>

      {/* group-by + batch filter (pipeline only) */}
      {tab === "pipeline" && (
        <div className="flex flex-wrap items-center gap-3 -mt-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400">Group by</span>
            {([["container", "Container"], ["date", "Receiving date"], ["none", "None"]] as [GroupBy, string][]).map(([g, label]) => (
              <button
                key={g}
                onClick={() => setGroupBy(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${groupBy === g ? "bg-primary text-white" : "bg-white text-slate-500 border border-slate-200 hover:border-primary/40"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            className="ml-auto px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All batches</option>
            {batchOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {tab === "uploads" ? (
        <UploadsView onChanged={reload} />
      ) : loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
          <PackageSearch className="animate-pulse" /> Loading parcels…
        </div>
      ) : tab === "pipeline" ? (
        <>
          <p className="text-xs text-slate-400 font-medium">{filtered.length} parcels shown</p>
          <PipelineBoard parcels={filtered} onOpen={setSelected} groupBy={groupBy} />
        </>
      ) : (
        <ContainersView containers={containers} parcels={parcels} onOpen={setSelected} />
      )}

      <ParcelJourney parcel={selected} onClose={() => setSelected(null)} onChanged={reload} />

      {showUpload && (
        <UploadSheetModal onClose={() => setShowUpload(false)} onUploaded={reload} />
      )}
    </div>
  );
}

function TabButton({ icon: Icon, label, active, onClick }: { icon: typeof LayoutGrid; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${active ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
    >
      <Icon size={16} /> {label}
    </button>
  );
}
