"use client";

import Link from "next/link";
import Navbar from "@/components/common/Navbar";
import StatsWidget from "@/components/dashboard/StatsWidget";
import {
  Ship, Warehouse, PackageCheck, AlertTriangle, Power, RefreshCw,
  UploadCloud, LayoutGrid, Container as ContainerIcon, Search, Radar, FlaskConical,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { useParcels } from "@/hooks/useParcels";
import type { Parcel } from "@/services/parcels";
import ParcelCard from "@/components/parcels/ParcelCard";
import ContainersView from "@/components/parcels/ContainersView";
import ParcelJourney from "@/components/parcels/ParcelJourney";
import UploadSheetModal from "@/components/parcels/UploadSheetModal";
import { customerLabel } from "@/components/parcels/parcelUi";

type Tab = "goods_received" | "container_loadings" | "arrived";

/**
 * Employee dashboard, cut over to the two-layer parcel model. Stats are live
 * reconciliation counts; the three tabs map onto the parcel pipeline (goods
 * received = still in warehouse, container loadings = containers, arrived =
 * landed in Ghana). Uploads go through the v2 endpoint.
 */
export default function EmployeeDashboard() {
  const { logout, user } = useAuth();
  const { reconciliation, parcels, containers, loading, isDemo, reload } = useParcels();
  const [tab, setTab] = useState<Tab>("goods_received");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const warehouse = useMemo(() => parcels.filter((p) => p.flags.receivedNotLoaded), [parcels]);
  const arrived   = useMemo(() => parcels.filter((p) => p.currentStage === "arrival"), [parcels]);

  const filtered = (list: Parcel[]) => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) =>
      p.waybill.toLowerCase().includes(q) ||
      customerLabel(p).toLowerCase().includes(q) ||
      (p.customerPhone || "").includes(q)
    );
  };

  const TABS: { id: Tab; label: string; icon: typeof Warehouse }[] = [
    { id: "goods_received",     label: "Goods Received",     icon: Warehouse },
    { id: "container_loadings", label: "Container Loadings", icon: ContainerIcon },
    { id: "arrived",            label: "Arrived Goods",      icon: PackageCheck },
  ];

  const handleLogout = () => logout();

  const cardGrid = (list: Parcel[], empty: string) => (
    list.length === 0 ? (
      <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center text-slate-400 font-medium tracking-widest text-sm uppercase">{empty}</div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((p) => <ParcelCard key={(p._id || p.waybill) + p.customerKey} parcel={p} onOpen={setSelected} />)}
      </div>
    )
  );

  return (
    <ProtectedRoute allowedRoles={["employee", "admin"]}>
      <Navbar />
      <main className="pt-32 pb-20 bg-slate-50 min-h-screen">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">Employee Portal</h1>
              <p className="text-slate-500 font-medium flex items-center gap-2">
                {user ? `Welcome, ${user.name}` : "Manage logistics operations and updates."}
                {isDemo && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full ring-1 ring-indigo-200">
                    <FlaskConical size={12} /> Sample data
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center gap-2 py-3 px-6 text-xs font-black uppercase tracking-[0.2em] bg-[#039B81] text-white rounded-xl shadow-xl shadow-[#039B81]/20 hover:bg-[#027a65] transition-colors"
              >
                <UploadCloud size={18} /> Upload Sheet
              </button>
              <Link
                href="/parcels"
                className="inline-flex items-center gap-2 py-3 px-6 text-xs font-black uppercase tracking-[0.2em] bg-white border-2 border-slate-200 text-slate-700 rounded-xl hover:border-[#039B81]/40 transition-colors"
              >
                <Radar size={18} /> Full Board
              </Link>
              <button
                onClick={() => reload()}
                className={`p-3 bg-white border-2 border-slate-200 text-slate-400 hover:text-[#039B81] hover:border-[#039B81]/30 rounded-xl transition-all shrink-0 ${loading ? "animate-spin text-[#039B81]" : ""}`}
                title="Refresh Data"
              >
                <RefreshCw size={20} />
              </button>
              <button onClick={handleLogout} className="p-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors shrink-0" title="Logout">
                <Power size={20} />
              </button>
            </div>
          </div>

          {/* Stats — live reconciliation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatsWidget title="In Warehouse" value={reconciliation.receivedNotLoaded} icon={Warehouse} color="amber" description="Received, awaiting a container" />
            <StatsWidget title="On the Water" value={reconciliation.loaded} icon={Ship} color="indigo" description="Loaded and shipped" />
            <StatsWidget title="Arrived" value={reconciliation.arrived} icon={PackageCheck} color="emerald" description="Landed at the port" />
            <StatsWidget title="Needs Attention" value={reconciliation.needsPhone + reconciliation.loadedNeverReceived} icon={AlertTriangle} color="rose" description="Missing phone or intake record" />
          </div>

          {/* Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200/60 self-start">
              {TABS.map((s) => {
                const Icon = s.icon;
                const active = tab === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setTab(s.id)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${active ? "bg-white text-[#039B81] shadow-lg shadow-[#039B81]/10" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    <Icon size={13} /> {s.label}
                  </button>
                );
              })}
            </div>
            {tab !== "container_loadings" && (
              <div className="relative max-w-md w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tracking no., customer, phone…"
                  className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 focus:border-[#039B81]/50 transition-all"
                />
              </div>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-100 py-16 flex items-center justify-center text-slate-400 gap-2 font-medium">
              <LayoutGrid className="animate-pulse" /> Loading parcels…
            </div>
          ) : tab === "container_loadings" ? (
            <ContainersView containers={containers} parcels={parcels} onOpen={setSelected} />
          ) : tab === "goods_received" ? (
            <>
              <p className="text-xs text-slate-400 font-medium mb-3">{filtered(warehouse).length} parcels in the warehouse, awaiting a container</p>
              {cardGrid(filtered(warehouse), "No parcels in the warehouse")}
            </>
          ) : (
            <>
              <p className="text-xs text-slate-400 font-medium mb-3">{filtered(arrived).length} parcels arrived</p>
              {cardGrid(filtered(arrived), "No arrived parcels yet")}
            </>
          )}
        </div>

        <ParcelJourney parcel={selected} onClose={() => setSelected(null)} onChanged={reload} />
        {showUpload && <UploadSheetModal onClose={() => setShowUpload(false)} onUploaded={reload} />}
      </main>
    </ProtectedRoute>
  );
}
