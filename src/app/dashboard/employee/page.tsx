"use client";

import Navbar from "@/components/common/Navbar";
import StatsWidget from "@/components/dashboard/StatsWidget";
import DataTable from "@/components/dashboard/DataTable";
import CreateShipmentModal from "@/components/dashboard/CreateShipmentModal";
import UpdateStatusModal from "@/components/dashboard/UpdateStatusModal";
import BulkUploadModal from "@/components/dashboard/BulkUploadModal";
import EditItemModal from "@/components/dashboard/EditItemModal";
import { Ship, CheckCircle, Clock, Plus, Power, FileUp, RefreshCw, AlertTriangle, Anchor, Pencil, Trash2, Search, Package, Warehouse } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Button from "@/components/common/Button";
import { useDebounce } from "@/hooks/useDebounce";
import { getBatchShipments, getEmployeeStats, deleteBatchItem } from "@/services/shipments";
import { listContainerLoadingsStaff, deleteContainerLoading, type ContainerLoading } from "@/services/containerLoadings";
import ContainerLoadingModal from "@/components/dashboard/ContainerLoadingModal";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { STATUS_COLORS } from "@/config/constants";

export default function EmployeeDashboard() {
    const { logout, user } = useAuth();
    const [shipments, setShipments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    // Three logistics lists matching the three upload stages.
    const [activeList, setActiveList] = useState<'goods_received' | 'container_loadings' | 'arrived'>('goods_received');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pagination, setPagination] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    const [containerSearch, setContainerSearch] = useState("");
    const debouncedContainerSearch = useDebounce(containerSearch, 500);

    // Item-status filter for each item-based list.
    const LIST_STATUS: Record<string, string> = {
        goods_received: 'in_warehouse,held',
        arrived:        'customs',
    };

    // Status Modal State
    const [statusModalShipmentId, setStatusModalShipmentId] = useState<string | null>(null);

    // Edit Item Modal State
    const [editingItem, setEditingItem] = useState<any>(null);

    // Container Loadings state
    const [containers, setContainers]               = useState<ContainerLoading[]>([]);
    const [containerModalOpen, setContainerModalOpen] = useState(false);
    const [editingContainer, setEditingContainer]   = useState<ContainerLoading | undefined>(undefined);
    const [deletingContainerId, setDeletingContainerId] = useState<string | null>(null);
    const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

    const handleDeleteItem = async (item: any) => {
        const ok = window.confirm(
            `Delete shipment ${item.waybillNo}?\n\nThis permanently removes this one shipment record${item.customerName ? ` (${item.customerName})` : ""}. This cannot be undone.`
        );
        if (!ok) return;
        setDeletingItemId(item._id);
        try {
            await deleteBatchItem(item._id);
            setShipments((prev) => prev.filter((s) => s._id !== item._id));
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to delete shipment. Please try again.");
        } finally {
            setDeletingItemId(null);
        }
    };

    const handleDeleteContainer = async (c: ContainerLoading) => {
        const ok = window.confirm(
            `Delete container ${c.containerNumber}?\n\nThis removes the container record and clears its number from any shipments that reference it. This cannot be undone.`
        );
        if (!ok) return;
        setDeletingContainerId(c._id);
        try {
            await deleteContainerLoading(c._id);
            setContainers((prev) => prev.filter((x) => x._id !== c._id));
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to delete container. Please try again.");
        } finally {
            setDeletingContainerId(null);
        }
    };

    const fetchShipments = useCallback(async (isSilent = false) => {
        // The Container Loadings tab shows containers, not items — skip item fetch.
        const status = LIST_STATUS[activeList];
        if (!status) return;

        if (!isSilent) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            const params: Record<string, any> = {
                page: currentPage,
                limit: 10,
                status,
            };
            if (debouncedSearchQuery) {
                params.search = debouncedSearchQuery;
            }
            const data = await getBatchShipments(params);

            // batch-shipments returns { items, pagination }
            setShipments(data?.items || (Array.isArray(data) ? data : []));
            if (data?.pagination) {
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch shipments:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeList, currentPage, debouncedSearchQuery]);

    // Reset to page 1 when the search query or active list changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchQuery, activeList]);

    const fetchStats = useCallback(async () => {
        try {
            const [coreStats, allBatch, pendingBatch, onHoldBatch, deliveredBatch] = await Promise.all([
                getEmployeeStats(),
                getBatchShipments({ limit: 1 }),
                getBatchShipments({ limit: 1, status: 'pending' }),
                getBatchShipments({ limit: 1, status: 'held' }),
                getBatchShipments({ limit: 1, status: 'delivered' })
            ]);

            const totalBatch = allBatch?.pagination?.total || 0;
            const deliveredBatchCount = deliveredBatch?.pagination?.total || 0;

            setStats({
                activeShipments: (coreStats?.activeShipments || 0) + Math.max(0, totalBatch - deliveredBatchCount),
                pendingUpdates: (coreStats?.pendingUpdates || 0) + (pendingBatch?.pagination?.total || 0),
                heldShipments: (coreStats?.heldShipments || 0) + (onHoldBatch?.pagination?.total || 0),
                completedToday: coreStats?.completedToday || 0,
            });
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
    }, []);

    const fetchContainers = useCallback(async () => {
        try {
            const params: { limit: number; search?: string } = { limit: 50 };
            if (debouncedContainerSearch) params.search = debouncedContainerSearch;
            const result = await listContainerLoadingsStaff(params);
            setContainers(result.containers);
        } catch {
            // non-critical — silently ignore
        }
    }, [debouncedContainerSearch]);

    const fetchAllData = useCallback(async (isSilent = false) => {
        await Promise.all([
            fetchStats(),
            fetchShipments(isSilent),
            fetchContainers(),
        ]);
    }, [fetchStats, fetchShipments, fetchContainers]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleLogout = async () => {
        await logout();
    };

    // Format status for display
    const formatStatus = (status: string) => {
        return status?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN';
    };

    const getStatusColor = (status: string) => {
        return STATUS_COLORS[status] || STATUS_COLORS.default;
    };

    const MISSING_KEYS = ["customerName", "customerPhone", "destinationCity", "productDescription", "quantity"];
    const hasMissingFields = (item: any) =>
        MISSING_KEYS.some((k) => item[k] === null || item[k] === undefined || String(item[k]).trim() === "");

    const columns = [
        {
            header: "Tracking Number",
            accessor: "waybillNo",
            render: (item: any) => (
                <span className="flex items-center gap-1.5">
                    <span className="text-sm font-mono font-bold text-slate-800">{item.waybillNo || "—"}</span>
                    {hasMissingFields(item) && (
                        <span title="Has missing fields">
                            <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                        </span>
                    )}
                </span>
            )
        },
        {
            header: "Invoice #",
            accessor: "invoiceNo",
            render: (item: any) => {
                if (item._grouped) return <span className="text-slate-200 text-xs select-none">↳</span>;
                return item.invoiceNo
                    ? <span className="text-sm font-mono text-slate-700">{item.invoiceNo}</span>
                    : <span className="text-slate-300 text-xs">—</span>;
            }
        },
        {
            header: "Customer",
            accessor: "customerName",
            render: (item: any) => {
                if (item._grouped) return (
                    <span className="text-[11px] font-mono text-slate-300 italic select-none pl-1">
                        {item.customerPhoneRaw || item.customerPhone || ""}
                    </span>
                );
                return (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-slate-800">{item.customerName || <span className="text-slate-300 italic text-xs">No name</span>}</span>
                        {item.customerPhoneRaw || item.customerPhone ? (
                            <span className="text-[11px] font-mono text-slate-400">{item.customerPhoneRaw || item.customerPhone}</span>
                        ) : (
                            <span className="text-[11px] text-amber-400 font-bold">No phone</span>
                        )}
                    </div>
                );
            }
        },
        { header: "Description", accessor: "productDescription" },
        { header: "Destination", accessor: "destinationCity" },
        {
            header: "Qty",
            accessor: "itemsCount",
            render: (item: any) => (
                <span className="text-sm font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                    {item.itemsCount || item.quantity || 0}
                </span>
            )
        },
        {
            header: "CBM",
            accessor: "cbm",
            render: (item: any) => (
                item.cbm != null
                    ? <span className="text-sm font-black text-slate-700 tabular-nums">{item.cbm} <span className="text-[10px] font-medium text-slate-400">m³</span></span>
                    : <span className="text-slate-300 text-xs">—</span>
            )
        },
        {
            header: "ETA",
            accessor: "estimatedDelivery",
            render: (item: any) => {
                const matchedContainer = item.containerRef
                    ? containers.find((c) => c.containerNumber === item.containerRef)
                    : null;
                const date = item.estimatedDelivery || matchedContainer?.eta || item.receivingDate;
                return date
                    ? <span className="text-[10px] font-bold text-slate-500 tabular-nums">{new Date(date).toLocaleDateString('en-GB')}</span>
                    : <span className="text-slate-300 text-xs">—</span>;
            }
        },
        {
            header: "Date",
            accessor: "createdAt",
            render: (item: any) => (
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : 'N/A'}
                </span>
            )
        },
        {
            header: "Status",
            accessor: "status",
            render: (item: any) => (
                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${getStatusColor(item.status)}`}>
                    {formatStatus(item.status)}
                </span>
            )
        },
        {
            header: "Container", accessor: "containerRef", render: (item: any) => (
                <span className="text-sm font-bold text-[#039B81]">
                    {item.containerRef || '—'}
                </span>
            )
        },
        {
            header: "Actions",
            accessor: "_id",
            render: (item: any) => (
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setStatusModalShipmentId(item._id)}
                        className="text-[#039B81] font-bold text-[10px] uppercase tracking-widest hover:underline"
                    >
                        Update
                    </button>
                    <button
                        onClick={() => setEditingItem(item)}
                        className="flex items-center gap-1 text-slate-400 hover:text-slate-700 font-bold text-[10px] uppercase tracking-widest transition-colors"
                    >
                        <Pencil size={11} />
                        Edit
                    </button>
                    <button
                        onClick={() => handleDeleteItem(item)}
                        disabled={deletingItemId === item._id}
                        className="flex items-center gap-1 text-slate-400 hover:text-red-500 font-bold text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50"
                    >
                        <Trash2 size={11} />
                        {deletingItemId === item._id ? "..." : "Delete"}
                    </button>
                </div>
            )
        }
    ];

    // Annotate each row so renders know when a customer's packages span multiple rows.
    // Consecutive rows sharing the same customerPhone are treated as one group.
    const filteredShipments = shipments.map((s: any, idx: number) => ({
      ...s,
      _grouped: idx > 0 && shipments[idx - 1].customerPhone === s.customerPhone,
    }));

    return (
        <ProtectedRoute allowedRoles={['employee', 'admin']}>
            <div className="bg-slate-50 min-h-screen">
                <Navbar />
                <main className="pt-32 pb-20">
                    <div className="container mx-auto px-4">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                            <div>
                                <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">Employee Portal</h1>
                                <p className="text-slate-500 font-medium">
                                    {user ? `Welcome, ${user.name}` : "Manage logistics operations and updates."}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsBulkModalOpen(true)}
                                    className="w-full md:w-auto py-3 px-6 text-xs font-black uppercase tracking-[0.2em] bg-white border-2 border-slate-200"
                                >
                                    <FileUp size={18} className="mr-2" />
                                    Bulk Update
                                </Button>
                                <Button onClick={() => setIsCreateModalOpen(true)} className="w-full md:w-auto py-3 px-6 text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-[#039B81]/20">
                                    <Plus size={18} className="mr-2" />
                                    New Shipment
                                </Button>
                                <button
                                    onClick={() => fetchAllData(true)}
                                    className={`p-3 bg-white border-2 border-slate-200 text-slate-400 hover:text-[#039B81] hover:border-[#039B81]/30 rounded-xl transition-all shrink-0 ${isRefreshing ? 'animate-spin text-[#039B81]' : ''}`}
                                    title="Refresh Data"
                                >
                                    <RefreshCw size={20} />
                                </button>
                                <button onClick={handleLogout} className="p-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors shrink-0" title="Logout">
                                    <Power size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            <StatsWidget
                                title="Active Shipments"
                                value={stats ? String(stats.activeShipments ?? 0) : "..."}
                                icon={Ship}
                                color="indigo"
                            />
                            <StatsWidget
                                title="Pending Updates"
                                value={stats ? String(stats.pendingUpdates ?? 0) : "..."}
                                icon={Clock}
                                color="amber"
                            />
                            <StatsWidget
                                title="On Hold"
                                value={stats ? String(stats.heldShipments ?? 0) : "..."}
                                icon={AlertTriangle}
                                color="rose"
                            />
                            <StatsWidget
                                title="Completed Today"
                                value={stats ? String(stats.completedToday ?? 0) : "..."}
                                icon={CheckCircle}
                                color="emerald"
                            />
                        </div>

                        {/* Logistics — three lists matching the upload stages */}
                        <div>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <div className="flex flex-wrap bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200/60 self-start">
                                    {[
                                        { id: 'goods_received',     label: 'Goods Received',     icon: Warehouse },
                                        { id: 'container_loadings', label: 'Container Loadings', icon: Anchor },
                                        { id: 'arrived',            label: 'Arrived Goods',      icon: Package },
                                    ].map((s) => {
                                        const Icon = s.icon;
                                        return (
                                            <button
                                                key={s.id}
                                                onClick={() => setActiveList(s.id as any)}
                                                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${
                                                    activeList === s.id
                                                    ? "bg-white text-[#039B81] shadow-lg shadow-[#039B81]/10"
                                                    : "text-slate-500 hover:text-slate-800"
                                                }`}
                                            >
                                                <Icon size={13} />
                                                {s.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                {activeList === 'container_loadings' && (
                                    <Button
                                        onClick={() => { setEditingContainer(undefined); setContainerModalOpen(true); }}
                                        className="py-2.5 px-5 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#039B81]/20 self-start"
                                    >
                                        <Plus size={16} className="mr-2" />
                                        New Container
                                    </Button>
                                )}
                            </div>

                        {/* ── Container Loadings tab ── */}
                        {activeList === 'container_loadings' ? (
                          <div>
                            <div className="relative max-w-md mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input
                                    type="text"
                                    value={containerSearch}
                                    onChange={(e) => setContainerSearch(e.target.value)}
                                    placeholder="Search container #, BL, or vessel..."
                                    className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 focus:border-[#039B81]/50 transition-all"
                                />
                            </div>
                            {containers.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-slate-100 py-10 text-center text-slate-400 text-xs font-black uppercase tracking-widest">
                                    {containerSearch ? "No containers match your search." : "No containers yet. Containers are auto-created from shipped batch uploads."}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {containers.map((c) => {
                                        const statusColors: Record<string, string> = {
                                            loading: "bg-yellow-100 text-yellow-700",
                                            shipped: "bg-blue-100 text-blue-700",
                                            at_port: "bg-orange-100 text-orange-700",
                                            arrived: "bg-emerald-100 text-emerald-700",
                                            ready:   "bg-[#039B81]/10 text-[#039B81]",
                                        };
                                        return (
                                            <div key={c._id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all group">
                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <Anchor size={16} className="text-[#039B81] shrink-0" />
                                                        <span className="font-black text-slate-800 text-sm truncate">{c.containerNumber}</span>
                                                    </div>
                                                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusColors[c.status] || "bg-slate-100 text-slate-500"}`}>
                                                        {c.status === "at_port" ? "At Tema Port" : c.status.replace(/_/g, " ")}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-500 space-y-1 mb-4">
                                                    {c.vesselName && <p><span className="font-black text-slate-400 uppercase">Vessel:</span> {c.vesselName}</p>}
                                                    {c.eta        && <p><span className="font-black text-slate-400 uppercase">ETA:</span> {new Date(c.eta).toLocaleDateString("en-GB")}</p>}
                                                    {c.blNumber   && <p><span className="font-black text-slate-400 uppercase">BL:</span> {c.blNumber}</p>}
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => { setEditingContainer(c); setContainerModalOpen(true); }}
                                                        className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-[#039B81] uppercase tracking-widest transition-colors"
                                                    >
                                                        <Pencil size={12} />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteContainer(c)}
                                                        disabled={deletingContainerId === c._id}
                                                        className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors disabled:opacity-50"
                                                    >
                                                        <Trash2 size={12} />
                                                        {deletingContainerId === c._id ? "Deleting..." : "Delete"}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                          </div>
                        ) : (
                          /* ── Goods Received / Arrived Goods tab (items) ── */
                          isLoading ? (
                            <div className="bg-white rounded-xl border border-slate-200 py-16 flex justify-center text-slate-400 font-medium tracking-widest text-sm uppercase">
                                Loading {activeList === 'goods_received' ? 'goods received' : 'arrived goods'}...
                            </div>
                          ) : filteredShipments.length > 0 ? (
                            <DataTable
                                columns={columns}
                                data={filteredShipments}
                                searchValue={searchQuery}
                                onSearchChange={setSearchQuery}
                                searchPlaceholder={activeList === 'goods_received' ? 'Search goods received — tracking, customer, city...' : 'Search arrived goods — tracking, customer, city...'}
                                pagination={pagination}
                                onPageChange={(page) => setCurrentPage(page)}
                            />
                          ) : (
                            <div className="bg-white rounded-xl border border-slate-200 py-16 flex flex-col items-center gap-4 text-slate-400 font-medium tracking-widest text-sm uppercase">
                                <span>{activeList === 'goods_received' ? 'No goods in the warehouse.' : 'No arrived goods yet.'}</span>
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery("")} className="text-[#039B81] text-xs underline">Clear Search</button>
                                )}
                            </div>
                          )
                        )}
                        </div>
                    </div>
                </main>
                <CreateShipmentModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={fetchAllData}
                />

                <UpdateStatusModal
                    isOpen={!!statusModalShipmentId}
                    onClose={() => setStatusModalShipmentId(null)}
                    onSuccess={fetchAllData}
                    shipmentId={statusModalShipmentId || ""}
                />

                <BulkUploadModal
                    isOpen={isBulkModalOpen}
                    onClose={() => setIsBulkModalOpen(false)}
                    onSuccess={fetchAllData}
                />

                {editingItem && (
                    <EditItemModal
                        item={editingItem}
                        onClose={() => setEditingItem(null)}
                        onSaved={(updated) => {
                            setShipments((prev) =>
                                prev.map((s) => (s._id === updated._id ? updated : s))
                            );
                            setEditingItem(null);
                        }}
                    />
                )}

                {containerModalOpen && (
                    <ContainerLoadingModal
                        existing={editingContainer}
                        onClose={() => setContainerModalOpen(false)}
                        onSaved={(saved) => {
                            setContainerModalOpen(false);
                            setContainers((prev) => {
                                const idx = prev.findIndex((c) => c._id === saved._id);
                                if (idx >= 0) {
                                    const next = [...prev];
                                    next[idx] = saved;
                                    return next;
                                }
                                return [saved, ...prev];
                            });
                        }}
                    />
                )}
            </div>
        </ProtectedRoute>
    );
}
