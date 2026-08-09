"use client";

import Navbar from "@/components/common/Navbar";
import StatsWidget from "@/components/dashboard/StatsWidget";
import CreateShipmentModal from "@/components/dashboard/CreateShipmentModal";
import BulkUploadModal from "@/components/dashboard/BulkUploadModal";
import EditItemModal from "@/components/dashboard/EditItemModal";
import ExpandableUploadCard from "@/components/dashboard/ExpandableUploadCard";
import { Ship, CheckCircle, Clock, Plus, Power, FileUp, RefreshCw, Anchor, Package, Warehouse, Search, AlertTriangle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Button from "@/components/common/Button";
import { useDebounce } from "@/hooks/useDebounce";
import { getBatchShipments, getEmployeeStats, deleteBatchItem, getBatches, fetchBatchItems, type BatchSummary } from "@/services/shipments";
import { listContainerLoadingsStaff, deleteContainerLoading, type ContainerLoading } from "@/services/containerLoadings";
import ContainerLoadingModal from "@/components/dashboard/ContainerLoadingModal";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { STATUS_COLORS } from "@/config/constants";

export default function EmployeeDashboard() {
    const { logout, user } = useAuth();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    // Three logistics lists matching the three upload stages.
    const [activeList, setActiveList] = useState<'goods_received' | 'container_loadings' | 'arrived'>('goods_received');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    // Card groups for the active tab.
    const [containers, setContainers] = useState<ContainerLoading[]>([]);
    const [batchGroups, setBatchGroups] = useState<BatchSummary[]>([]);
    const [groupsLoading, setGroupsLoading] = useState(true);
    // Bumped after an item edit/delete so an open card reloads its items.
    const [itemsRefreshKey, setItemsRefreshKey] = useState(0);

    // Edit Item Modal State
    const [editingItem, setEditingItem] = useState<any>(null);

    // Container Loadings state
    const [containerModalOpen, setContainerModalOpen] = useState(false);
    const [editingContainer, setEditingContainer]   = useState<ContainerLoading | undefined>(undefined);
    const [deletingContainerId, setDeletingContainerId] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            const [coreStats, allBatch, onHoldBatch] = await Promise.all([
                getEmployeeStats(),
                getBatchShipments({ limit: 1 }),
                getBatchShipments({ limit: 1, status: 'held' }),
            ]);

            const totalBatch = allBatch?.pagination?.total || 0;

            setStats({
                activeShipments: (coreStats?.activeShipments || 0) + totalBatch,
                pendingUpdates:  coreStats?.pendingUpdates || 0,
                heldShipments:   (coreStats?.heldShipments || 0) + (onHoldBatch?.pagination?.total || 0),
                completedToday:  coreStats?.completedToday || 0,
            });
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
    }, []);

    // Fetch the card groups (batches or containers) for the active tab.
    const fetchGroups = useCallback(async () => {
        setGroupsLoading(true);
        try {
            const search = debouncedSearchQuery || undefined;
            if (activeList === 'container_loadings') {
                const r = await listContainerLoadingsStaff({ limit: 50, search });
                setContainers(r.containers);
            } else {
                const stage = activeList === 'goods_received' ? 'intake' : 'arrived';
                const r = await getBatches({ stage, limit: 50, search });
                setBatchGroups(r.batches);
            }
        } catch {
            setContainers([]);
            setBatchGroups([]);
        } finally {
            setGroupsLoading(false);
        }
    }, [activeList, debouncedSearchQuery]);

    useEffect(() => { fetchGroups(); }, [fetchGroups]);
    useEffect(() => { fetchStats(); }, [fetchStats]);

    // Full refresh after uploads / edits.
    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([fetchStats(), fetchGroups()]);
            setItemsRefreshKey((k) => k + 1);
        } finally {
            setIsRefreshing(false);
        }
    }, [fetchStats, fetchGroups]);

    const handleDeleteItem = async (item: any) => {
        const ok = window.confirm(
            `Delete shipment ${item.waybillNo}?\n\nThis permanently removes this one shipment record${item.customerName ? ` (${item.customerName})` : ""}. This cannot be undone.`
        );
        if (!ok) return;
        try {
            await deleteBatchItem(item._id);
            setItemsRefreshKey((k) => k + 1);
            fetchStats();
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to delete shipment. Please try again.");
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

    const containerStatusColors: Record<string, string> = {
        loading: "bg-yellow-100 text-yellow-700",
        shipped: "bg-blue-100 text-blue-700",
        at_port: "bg-orange-100 text-orange-700",
        arrived: "bg-emerald-100 text-emerald-700",
        ready:   "bg-[#039B81]/10 text-[#039B81]",
    };
    const containerStatusLabel = (s: string) => (s === "at_port" ? "At Tema Port" : s.replace(/_/g, " "));

    const searchPlaceholder =
        activeList === 'container_loadings' ? "Search container #, BL, or vessel..."
        : activeList === 'goods_received'   ? "Search goods-received uploads (batch code)..."
        :                                     "Search arrived uploads (batch code)...";

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
                                    onClick={() => refresh()}
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

                            {/* Search for the active list */}
                            <div className="relative max-w-md mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={searchPlaceholder}
                                    className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 focus:border-[#039B81]/50 transition-all"
                                />
                            </div>

                            {groupsLoading ? (
                                <div className="bg-white rounded-2xl border border-slate-100 py-16 flex justify-center text-slate-400 font-medium tracking-widest text-sm uppercase">
                                    Loading…
                                </div>
                            ) : activeList === 'container_loadings' ? (
                                containers.length === 0 ? (
                                    <div className="bg-white rounded-2xl border border-slate-100 py-10 text-center text-slate-400 text-xs font-black uppercase tracking-widest">
                                        {searchQuery ? "No containers match your search." : "No containers yet. Containers are auto-created from shipped batch uploads."}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {containers.map((c) => (
                                            <ExpandableUploadCard
                                                key={c._id}
                                                title={c.containerNumber}
                                                icon={<Anchor size={16} className="text-[#039B81] shrink-0" />}
                                                badge={{ label: containerStatusLabel(c.status), className: containerStatusColors[c.status] || "bg-slate-100 text-slate-500" }}
                                                meta={[
                                                    ...(c.eta        ? [{ label: "ETA",    value: new Date(c.eta).toLocaleDateString("en-GB") }] : []),
                                                    ...(c.vesselName ? [{ label: "Vessel", value: c.vesselName }] : []),
                                                    ...(c.blNumber   ? [{ label: "BL",     value: c.blNumber }] : []),
                                                ]}
                                                onEdit={() => { setEditingContainer(c); setContainerModalOpen(true); }}
                                                onDelete={() => handleDeleteContainer(c)}
                                                deleting={deletingContainerId === c._id}
                                                loadItems={async () => {
                                                    const bid = c.batchRef?._id || c.batchRef;
                                                    if (!bid) return [];
                                                    return (await fetchBatchItems(bid)).items;
                                                }}
                                                onEditItem={setEditingItem}
                                                onDeleteItem={handleDeleteItem}
                                                statusColor={getStatusColor}
                                                formatStatus={formatStatus}
                                                reloadKey={itemsRefreshKey}
                                            />
                                        ))}
                                    </div>
                                )
                            ) : (
                                batchGroups.length === 0 ? (
                                    <div className="bg-white rounded-2xl border border-slate-100 py-10 text-center text-slate-400 text-xs font-black uppercase tracking-widest">
                                        {searchQuery
                                            ? "No uploads match your search."
                                            : activeList === 'goods_received' ? "No goods-received uploads yet." : "No arrived-goods uploads yet."}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {batchGroups.map((b) => (
                                            <ExpandableUploadCard
                                                key={b._id}
                                                title={b.batchCode}
                                                icon={activeList === 'goods_received'
                                                    ? <Warehouse size={16} className="text-[#039B81] shrink-0" />
                                                    : <Package size={16} className="text-purple-500 shrink-0" />}
                                                badge={{ label: `${b.totalItems ?? 0} items`, className: "bg-slate-100 text-slate-600" }}
                                                meta={[
                                                    ...(b.createdAt ? [{ label: "Uploaded", value: new Date(b.createdAt).toLocaleDateString("en-GB") }] : []),
                                                    ...((b.heldItems ?? 0) > 0 ? [{ label: "Held", value: String(b.heldItems) }] : []),
                                                ]}
                                                loadItems={async () => (await fetchBatchItems(b._id)).items}
                                                onEditItem={setEditingItem}
                                                onDeleteItem={handleDeleteItem}
                                                statusColor={getStatusColor}
                                                formatStatus={formatStatus}
                                                reloadKey={itemsRefreshKey}
                                            />
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </main>
                <CreateShipmentModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={refresh}
                />

                <BulkUploadModal
                    isOpen={isBulkModalOpen}
                    onClose={() => setIsBulkModalOpen(false)}
                    onSuccess={refresh}
                />

                {editingItem && (
                    <EditItemModal
                        item={editingItem}
                        onClose={() => setEditingItem(null)}
                        onSaved={() => {
                            setEditingItem(null);
                            setItemsRefreshKey((k) => k + 1);
                            fetchStats();
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
