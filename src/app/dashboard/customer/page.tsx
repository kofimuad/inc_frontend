"use client";

import Navbar from "@/components/common/Navbar";
import StatsWidget from "@/components/dashboard/StatsWidget";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  Search,
  Power,
  RefreshCw,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { getMyShipments, getCustomerStats } from "@/services/shipments";
import { getSettings, AppSettings } from "@/services/settings";
import { linkPhone } from "@/services/auth";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { STATUS_COLORS, STATUS_LABELS } from "@/config/constants";

// Generate a deterministic fake container ref from a shipment id.
// Same approach as the public /container-loadings page uses for the real containers.
function fakeContainerRef(id: string): string {
  if (!id) return "ICL-PENDING";
  return "ICL-" + id.slice(-6).toUpperCase();
}

// Format a date (string | Date | undefined) as DD MMM YYYY
function formatDate(date?: string | Date | null): string {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function CustomerDashboard() {
  const { logout, user, fetchUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [shipments, setShipments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [settings, setSettings] = useState<AppSettings>({
    cbmRate: 230,
    usdToGhsRate: 15.2,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"active" | "history">("active");

  // Phone-link state
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneSaved, setPhoneSaved] = useState(false);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [shipmentsData, statsData, settingsData] = await Promise.all([
        getMyShipments(),
        getCustomerStats(),
        getSettings().catch(() => ({ cbmRate: 230, usdToGhsRate: 15.2 })),
      ]);

      // API returns { total, grouped: { in_warehouse, shipped, held }, pagination }
      // Flatten grouped object into a single array so .length / .filter / .map work correctly.
      let items: any[] = [];
      if (Array.isArray(shipmentsData)) {
        items = shipmentsData;
      } else if (
        shipmentsData?.grouped &&
        typeof shipmentsData.grouped === "object"
      ) {
        items = (Object.values(shipmentsData.grouped) as any[][]).flat();
      } else if (Array.isArray(shipmentsData?.items)) {
        items = shipmentsData.items;
      }
      setShipments(items);
      setStats(statsData);
      setSettings(settingsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    await logout();
  };

  const handleLinkPhone = async () => {
    if (!phoneInput.trim()) return;
    setPhoneSaving(true);
    setPhoneError(null);
    try {
      await linkPhone(phoneInput.trim());
      setPhoneSaved(true);
      await fetchUser();
      fetchData(true);
    } catch (err: any) {
      setPhoneError(
        err?.response?.data?.message ||
          "Failed to link phone. Please try again.",
      );
    } finally {
      setPhoneSaving(false);
    }
  };

  // Format the next delivery date
  const formatNextDelivery = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const diffMs = date.getTime() - Date.now();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    return `${diffDays} Days`;
  };

  // Apply active/history + search filters
  const filteredShipments = shipments
    .filter((s) => {
      if (viewMode === "active") {
        return !["delivered", "failed", "returned"].includes(s.status);
      }
      return ["delivered", "failed", "returned"].includes(s.status);
    })
    .filter((s) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (s.waybillNo || s.trackingNumber || "")?.toLowerCase().includes(q) ||
        (s.productDescription || s.description || "")
          ?.toLowerCase()
          .includes(q) ||
        (s.destinationCity || s.destination?.city || "")
          ?.toLowerCase()
          .includes(q)
      );
    });

  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <div className="bg-slate-50 min-h-screen">
        <Navbar />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">
                  My Dashboard
                </h1>
                <p className="text-slate-500 font-medium">
                  {user
                    ? `Welcome back, ${user.name}`
                    : "Manage and track your active shipments."}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#039B81] transition-colors"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search shipments..."
                    className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 w-full md:w-64 transition-all font-medium text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => fetchData(true)}
                  className={`p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#039B81] hover:border-[#039B81]/30 transition-all ${isRefreshing ? "animate-spin text-[#039B81]" : ""}`}
                  title="Refresh Data"
                >
                  <RefreshCw size={20} />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors shrink-0"
                  title="Logout"
                >
                  <Power size={20} />
                </button>
              </div>
            </div>

            {/* Phone-link banner — shown when account has no phone number */}
            {user && !user.phone && !phoneSaved && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
                <Phone className="text-amber-500 shrink-0" size={22} />
                <div className="grow">
                  <p className="font-black text-amber-800 text-sm mb-0.5">
                    Link your phone number to see your shipments
                  </p>
                  <p className="text-amber-600 text-xs font-medium">
                    Your shipments are matched by phone. Enter the number you
                    gave I&C Logistics.
                  </p>
                  {phoneError && (
                    <p className="text-red-500 text-xs mt-1 font-medium">
                      {phoneError}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="tel"
                    placeholder="e.g. 0241234567"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLinkPhone()}
                    className="px-3 py-2 border border-amber-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-300 w-40 bg-white"
                  />
                  <button
                    onClick={handleLinkPhone}
                    disabled={phoneSaving || !phoneInput.trim()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-black rounded-xl transition-colors"
                  >
                    {phoneSaving ? "Saving…" : "Link"}
                  </button>
                </div>
              </div>
            )}
            {phoneSaved && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-8 flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                <p className="text-emerald-700 font-black text-sm">
                  Phone linked! Your shipments are loading…
                </p>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <StatsWidget
                title="Total Shipments"
                value={
                  stats
                    ? String(stats.totalItems ?? stats.totalShipments ?? 0)
                    : "..."
                }
                icon={Package}
                trend={{ value: 8, isPositive: true }}
                color="indigo"
              />
              <StatsWidget
                title="In Transit"
                value={stats ? String(stats.inTransit ?? 0) : "..."}
                icon={Truck}
                color="amber"
              />
              <StatsWidget
                title="Delivered"
                value={stats ? String(stats.delivered ?? 0) : "..."}
                icon={CheckCircle}
                color="emerald"
              />
              <StatsWidget
                title="Next Delivery"
                value={stats ? formatNextDelivery(stats.nextDelivery) : "..."}
                icon={Clock}
                description="Estimated arrival"
              />
            </div>

            {/* Shipments Table Section */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                  <span className="w-2 h-8 bg-[#FC6100] rounded-full" />
                  {viewMode === "active"
                    ? "Active Shipments"
                    : "Shipment History"}
                </h2>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode("active")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === "active" ? "bg-white text-[#FC6100] shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setViewMode("history")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === "history" ? "bg-white text-[#FC6100] shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    History
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="bg-white rounded-2xl border border-slate-100 py-16 flex justify-center text-slate-400 font-medium tracking-widest text-sm uppercase">
                  Loading your shipments...
                </div>
              ) : filteredShipments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 py-16 flex flex-col items-center gap-3 text-slate-400">
                  <Package className="text-slate-200" size={40} />
                  <p className="font-medium tracking-widest text-sm uppercase">
                    {viewMode === "active"
                      ? "No active shipments found"
                      : "No past shipments found"}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/60">
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">
                            Tracking Number
                          </th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">
                            Date Received
                          </th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">
                            Date Loaded
                          </th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">
                            CBM
                          </th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">
                            Shipping Fee (USD)
                          </th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">
                            Product Name
                          </th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">
                            Packages
                          </th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">
                            Container No.
                          </th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">
                            ETA
                          </th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredShipments.map((s, idx) => {
                          const id = s._id || s.id || String(idx);
                          const tracking =
                            s.waybillNo || s.trackingNumber || "—";
                          const dateReceived =
                            s.receivedAt ||
                            s.dates?.receivedAt ||
                            s.createdAt;
                          const dateLoaded =
                            s.loadingDate ||
                            s.shippedAt ||
                            s.dates?.shippedAt;
                          const eta =
                            s.estimatedDelivery ||
                            s.dates?.estimatedDelivery ||
                            s.eta;
                          const cbm = s.cbm;
                          const fee =
                            cbm != null ? cbm * settings.cbmRate : null;
                          const productName =
                            s.productDescription ||
                            s.description ||
                            s.goodsType ||
                            "—";
                          const qty = s.quantity ?? s.itemsCount ?? 0;
                          // Use the batch _id so all items in the same shipment batch share the same fake ref
                          const batchId = s.shippedBatch?._id || s.intakeBatch?._id || id;
                          const container = fakeContainerRef(batchId);
                          const statusKey = s.status || "pending";
                          const statusBadge =
                            STATUS_COLORS[statusKey] || STATUS_COLORS.default;
                          const statusLabel =
                            STATUS_LABELS[statusKey] ||
                            statusKey.replace(/_/g, " ");

                          return (
                            <tr
                              key={id}
                              className={`hover:bg-slate-50/60 transition-colors ${idx !== filteredShipments.length - 1 ? "border-b border-slate-50" : ""}`}
                            >
                              <td className="px-6 py-4 text-sm font-bold text-slate-800 font-mono">
                                {tracking}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-600 tabular-nums">
                                {formatDate(dateReceived)}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-600 tabular-nums">
                                {formatDate(dateLoaded)}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-slate-700 tabular-nums">
                                {cbm != null ? (
                                  <>
                                    {cbm}{" "}
                                    <span className="text-[10px] font-medium text-slate-400">
                                      m³
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm font-black text-slate-800 tabular-nums">
                                {fee != null ? (
                                  <>
                                    <span className="text-[#039B81]">$</span>
                                    {fee.toFixed(2)}
                                  </>
                                ) : (
                                  <span className="text-slate-300 font-medium">
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td
                                className="px-6 py-4 text-sm font-medium text-slate-700 max-w-[220px] truncate"
                                title={productName}
                              >
                                {productName}
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                                  {qty}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-[#039B81] font-mono">
                                {container}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-600 tabular-nums">
                                {formatDate(eta)}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${statusBadge}`}
                                >
                                  {statusLabel}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Table footer with count */}
                  <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/30">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Showing {filteredShipments.length}{" "}
                      {filteredShipments.length === 1
                        ? "shipment"
                        : "shipments"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
