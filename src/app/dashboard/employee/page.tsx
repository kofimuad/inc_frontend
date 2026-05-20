"use client";

import Navbar from "@/components/common/Navbar";
import StatsWidget from "@/components/dashboard/StatsWidget";
import DataTable from "@/components/dashboard/DataTable";
import CreateShipmentModal from "@/components/dashboard/CreateShipmentModal";
import UpdateStatusModal from "@/components/dashboard/UpdateStatusModal";
import BulkUploadModal from "@/components/dashboard/BulkUploadModal";
import EditItemModal from "@/components/dashboard/EditItemModal";
import { Ship, CheckCircle, Clock, Plus, Power, FileUp, RefreshCw, AlertTriangle, Anchor, Pencil } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Button from "@/components/common/Button";
import { useDebounce } from "@/hooks/useDebounce";
import { getBatchShipments, getEmployeeStats } from "@/services/shipments";
import { listContainerLoadingsStaff, type ContainerLoading } from "@/services/containerLoadings";
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
    const [activeStage, setActiveStage] = useState<'all' | 'pending' | 'in_transit' | 'delivered'>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pagination, setPagination] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    // Status Modal State
    const [statusModalShipmentId, setStatusModalShipmentId] = useState<string | null>(null);

    // Edit Item Modal State
    const [editingItem, setEditingItem] = useState<any>(null);

    // Container Loadings state
    const [containers, setContainers]               = useState<ContainerLoading[]>([]);
    const [containerModalOpen, setContainerModalOpen] = useState(false);
    const [editingContainer, setEditingContainer]   = useState<ContainerLoading | undefined>(undefined);

    const fetchShipments = useCallback(async (isSilent = false) => {
        if (!isSilent) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            const params: Record<string, any> = {
                page: currentPage,
                limit: 10
            };
            if (activeStage !== 'all') {
                params.status = activeStage;
            }
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
    }, [activeStage, currentPage, debouncedSearchQuery]);

    // Reset to page 1 when search query or stage changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchQuery, activeStage]);

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
            const result = await listContainerLoadingsStaff({ limit: 50 });
            setContainers(result.containers);
        } catch {
            // non-critical — silently ignore
        }
    }, []);

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

                        {/* Container Loadings Section */}
                        <div className="mb-12">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                                    <span className="w-2 h-8 bg-blue-500 rounded-full" />
                                    Container Loadings
                                </h2>
                                <Button
                                    onClick={() => { setEditingContainer(undefined); setContainerModalOpen(true); }}
                                    className="py-2.5 px-5 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#039B81]/20"
                                >
                                    <Plus size={16} className="mr-2" />
                                    New Container
                                </Button>
                            </div>

                            {containers.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-slate-100 py-10 text-center text-slate-400 text-xs font-black uppercase tracking-widest">
                                    No containers yet. Containers are auto-created from shipped batch uploads.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {containers.map((c) => {
                                        const statusColors: Record<string, string> = {
                                            loading: "bg-yellow-100 text-yellow-700",
                                            shipped: "bg-blue-100 text-blue-700",
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
                                                        {c.status}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-500 space-y-1 mb-4">
                                                    {c.vesselName && <p><span className="font-black text-slate-400 uppercase">Vessel:</span> {c.vesselName}</p>}
                                                    {c.eta        && <p><span className="font-black text-slate-400 uppercase">ETA:</span> {new Date(c.eta).toLocaleDateString("en-GB")}</p>}
                                                    {c.blNumber   && <p><span className="font-black text-slate-400 uppercase">BL:</span> {c.blNumber}</p>}
                                                </div>
                                                <button
                                                    onClick={() => { setEditingContainer(c); setContainerModalOpen(true); }}
                                                    className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-[#039B81] uppercase tracking-widest transition-colors"
                                                >
                                                    <Pencil size={12} />
                                                    Edit
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Shipments Table Section */}
                        <div>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                                    <span className="w-2 h-8 bg-[#039B81] rounded-full" />
                                    {activeStage === 'all' ? 'All Shipments' : `${activeStage.replace('_', ' ')} Shipments`}
                                </h2>

                                <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200/60 backdrop-blur-sm self-start md:self-auto">
                                    {[
                                        { id: 'all', label: 'All' },
                                        { id: 'pending', label: 'Intake' },
                                        { id: 'held', label: 'Held' },
                                        { id: 'in_transit', label: 'Shipped' },
                                        { id: 'delivered', label: 'Arrived' }
                                    ].map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => {
                                                setActiveStage(s.id as any);
                                                setCurrentPage(1);
                                            }}
                                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                                                activeStage === s.id 
                                                ? "bg-white text-[#039B81] shadow-lg shadow-[#039B81]/10" 
                                                : "text-slate-500 hover:text-slate-800"
                                            }`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="bg-white rounded-xl border border-slate-200 py-16 flex justify-center text-slate-400 font-medium tracking-widest text-sm uppercase">
                                    Loading logistics database...
                                </div>
                            ) : filteredShipments.length > 0 ? (
                                <DataTable
                                    columns={columns}
                                    data={filteredShipments}
                                    searchValue={searchQuery}
                                    onSearchChange={setSearchQuery}
                                    pagination={pagination}
                                    onPageChange={(page) => setCurrentPage(page)}
                                />
                            ) : (
                                <div className="bg-white rounded-xl border border-slate-200 py-16 flex flex-col items-center gap-4 text-slate-400 font-medium tracking-widest text-sm uppercase">
                                    <span>No shipments found.</span>
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery("")} className="text-[#039B81] text-xs underline">Clear Search</button>
                                    )}
                                </div>
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
