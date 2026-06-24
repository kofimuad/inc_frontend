"use client";

import { useState, useEffect } from "react";
import { X, Activity, Cpu, Settings, RefreshCw, ShieldCheck, Globe, Mail, DollarSign, Save, Check, Newspaper, Plus, Trash2, GripVertical, TrendingUp } from "lucide-react";
import DataTable from "./DataTable";
import Button from "@/components/common/Button";
import { getAuditLogs, getGpsDevices, triggerCleanup } from "@/services/admin";
import { getSettings, updateSettings, AppSettings } from "@/services/settings";
import { getTickerItems, saveTickerItems, generateId, TickerItem, DEFAULT_TICKER_ITEMS } from "@/utils/ticker";

interface SystemSettingsModalProps {
    onClose: () => void;
}

type TabType = 'logs' | 'devices' | 'config' | 'ticker';

export default function SystemSettingsModal({ onClose }: SystemSettingsModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>('logs');
    const [logs, setLogs] = useState<any[]>([]);
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [cleanupResult, setCleanupResult] = useState<any>(null);
    const [cleanupLoading, setCleanupLoading] = useState(false);
    const [rates, setRates] = useState<AppSettings>({ cbmRate: 230, usdToGhsRate: 15.2, minFeeUsd: 3 });
    const [ratesSaving, setRatesSaving] = useState(false);
    const [ratesSaved, setRatesSaved] = useState(false);
    const [ratesError, setRatesError] = useState<string | null>(null);
    const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
    const [tickerSaved, setTickerSaved] = useState(false);

    useEffect(() => {
        getSettings().then(setRates).catch(() => {});
        setTickerItems(getTickerItems());
    }, []);

    const handleSaveRates = async () => {
        setRatesSaving(true);
        setRatesError(null);
        try {
            const updated = await updateSettings(rates);
            setRates(updated);
            setRatesSaved(true);
            setTimeout(() => setRatesSaved(false), 2500);
        } catch {
            setRatesError("Failed to save. Please try again.");
        } finally {
            setRatesSaving(false);
        }
    };

    const handleRunCleanup = async () => {
        setCleanupLoading(true);
        setCleanupResult(null);
        try {
            const result = await triggerCleanup();
            setCleanupResult({ success: true, data: result });
        } catch {
            setCleanupResult({ success: false });
        } finally {
            setCleanupLoading(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'logs') {
                const data = await getAuditLogs();
                setLogs(data?.logs || (Array.isArray(data) ? data : []));
            } else if (activeTab === 'devices') {
                const data = await getGpsDevices();
                setDevices(data?.devices || (Array.isArray(data) ? data : []));
            }
        } catch (error) {
            console.error(`Failed to fetch ${activeTab}:`, error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab !== 'config') {
            fetchData();
        }
    }, [activeTab]);

    const logColumns = [
        {
            header: "Action",
            accessor: "action",
            render: (item: any) => (
                <span className="font-bold text-slate-700 capitalize">{item.action.replace(/_/g, ' ')}</span>
            )
        },
        {
            header: "User",
            accessor: "performedBy",
            render: (item: any) => {
                const user = item.performedBy;
                if (!user) return 'System';
                return `${user.name || user.email || 'Unknown'} (${user.role || 'No role'})`;
            }
        },
        {
            header: "Details",
            accessor: "details",
            render: (item: any) => {
                if (!item.details) return '-';
                if (typeof item.details === 'object') {
                    return JSON.stringify(item.details);
                }
                return item.details;
            }
        },
        {
            header: "Timestamp",
            accessor: "timestamp",
            render: (item: any) => (
                <span className="text-slate-400 text-xs tabular-nums">
                    {new Date(item.timestamp).toLocaleString()}
                </span>
            )
        }
    ];

    const deviceColumns = [
        { header: "Serial Number", accessor: "serialNumber" },
        { 
            header: "Status", 
            accessor: "status",
            render: (item: any) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                    item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                }`}>
                    {item.status}
                </span>
            )
        },
        { 
            header: "Battery", 
            accessor: "batteryLevel",
            render: (item: any) => (
                <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full transition-all ${
                            item.batteryLevel > 20 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} style={{ width: `${item.batteryLevel}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{item.batteryLevel}%</span>
                </div>
            )
        },
        { header: "Last Used", accessor: "lastUsed", render: (item: any) => item.lastUsed ? new Date(item.lastUsed).toLocaleDateString() : 'Never' }
    ];

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#039B81]/10 rounded-xl flex items-center justify-center">
                            <Settings className="text-[#039B81]" size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">System Settings</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Platform Administration</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex px-6 border-b border-slate-100 bg-white">
                    <TabButton 
                        active={activeTab === 'logs'} 
                        onClick={() => setActiveTab('logs')}
                        icon={Activity}
                        label="Audit Logs"
                    />
                    <TabButton 
                        active={activeTab === 'devices'} 
                        onClick={() => setActiveTab('devices')}
                        icon={Cpu}
                        label="GPS Hardware"
                    />
                    <TabButton 
                        active={activeTab === 'ticker'} 
                        onClick={() => setActiveTab('ticker')}
                        icon={Newspaper}
                        label="News Ticker"
                    />
                    <TabButton 
                        active={activeTab === 'config'} 
                        onClick={() => setActiveTab('config')}
                        icon={ShieldCheck}
                        label="Platform Config"
                    />
                </div>

                {/* Content Area */}
                <div className="flex-grow overflow-y-auto p-6 bg-slate-50/30">
                    {loading ? (
                        <div className="h-full flex items-center justify-center flex-col gap-4">
                            <RefreshCw className="text-[#039B81] animate-spin" size={32} />
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Synchronizing System Data...</span>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {activeTab === 'logs' && (
                                <DataTable 
                                    columns={logColumns}
                                    data={logs}
                                />
                            )}
                            {activeTab === 'devices' && (
                                <DataTable 
                                    columns={deviceColumns}
                                    data={devices}
                                />
                            )}
                            {activeTab === 'ticker' && (
                                <TickerTab
                                    items={tickerItems}
                                    onChange={setTickerItems}
                                    onSave={() => {
                                        saveTickerItems(tickerItems);
                                        setTickerSaved(true);
                                        setTimeout(() => setTickerSaved(false), 2500);
                                    }}
                                    saved={tickerSaved}
                                />
                            )}
                            {activeTab === 'config' && (
                                <PlatformConfigView
                                    onRunCleanup={handleRunCleanup}
                                    cleanupLoading={cleanupLoading}
                                    cleanupResult={cleanupResult}
                                    rates={rates}
                                    onRatesChange={setRates}
                                    onSaveRates={handleSaveRates}
                                    ratesSaving={ratesSaving}
                                    ratesSaved={ratesSaved}
                                    ratesError={ratesError}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
                    <Button variant="outline" onClick={fetchData} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest">
                        <RefreshCw size={14} className="mr-2" />
                        Refresh Data
                    </Button>
                    <Button onClick={onClose} className="px-8 py-2.5 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#039B81]/20">
                        Close Settings
                    </Button>
                </div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all ${
                active 
                ? 'border-[#039B81] text-[#039B81]' 
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
            }`}
        >
            <Icon size={18} />
            <span className="text-sm font-black uppercase tracking-widest whitespace-nowrap">{label}</span>
        </button>
    );
}

function PlatformConfigView({ onRunCleanup, cleanupLoading, cleanupResult, rates, onRatesChange, onSaveRates, ratesSaving, ratesSaved, ratesError }: {
    onRunCleanup: () => void;
    cleanupLoading: boolean;
    cleanupResult: { success: boolean; data?: any } | null;
    rates: AppSettings;
    onRatesChange: (r: AppSettings) => void;
    onSaveRates: () => void;
    ratesSaving: boolean;
    ratesSaved: boolean;
    ratesError: string | null;
}) {
    const rateCls = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 focus:border-[#039B81]/30 transition-all";

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Globe size={16} className="text-blue-500" />
                    Branding & Global Info
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Display Name</label>
                        <input disabled className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-400 cursor-not-allowed" defaultValue="Clinette Shipping" title="Read-only — contact support to update" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Support Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                            <input disabled className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-400 cursor-not-allowed" defaultValue="support@icshipping.com" title="Read-only — contact support to update" />
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400">These fields are read-only. Contact your system administrator to update branding settings.</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    Security & Maintenance
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                            <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Maintenance Mode</p>
                            <p className="text-[10px] text-slate-400">Offline status for customers</p>
                        </div>
                        <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-not-allowed" title="Not yet configurable">
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                            <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Two-Factor Force</p>
                            <p className="text-[10px] text-slate-400">Mandatory 2FA for all employees</p>
                        </div>
                        <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-not-allowed" title="Not yet configurable">
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Shipping Rates */}
            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <DollarSign size={16} className="text-[#039B81]" />
                    Shipping Rates
                </h3>
                <div className="grid sm:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Rate per CBM (USD)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                value={rates.cbmRate}
                                onChange={(e) => onRatesChange({ ...rates, cbmRate: parseFloat(e.target.value) || 0 })}
                                className={`${rateCls} pl-8`}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            USD → GHS Exchange Rate
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">GH₵</span>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                value={rates.usdToGhsRate}
                                onChange={(e) => onRatesChange({ ...rates, usdToGhsRate: parseFloat(e.target.value) || 0 })}
                                className={`${rateCls} pl-12`}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Minimum Fee (USD)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                value={rates.minFeeUsd}
                                onChange={(e) => onRatesChange({ ...rates, minFeeUsd: parseFloat(e.target.value) || 0 })}
                                className={`${rateCls} pl-8`}
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5">Applied when calculated fee falls below this amount.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={onSaveRates}
                        isLoading={ratesSaving}
                        className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest shadow-md shadow-[#039B81]/20"
                    >
                        {ratesSaved ? <Check size={14} className="mr-2" /> : <Save size={14} className="mr-2" />}
                        {ratesSaved ? "Saved!" : "Save Rates"}
                    </Button>
                    {ratesError && (
                        <p className="text-xs font-semibold text-red-500">{ratesError}</p>
                    )}
                    {ratesSaved && (
                        <p className="text-xs font-semibold text-emerald-600">Rates updated — calculator will reflect the new values immediately.</p>
                    )}
                </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Settings size={16} className="text-slate-500" />
                    Database Maintenance
                </h3>
                <p className="text-xs text-slate-500 mb-4">Removes expired session tokens, audit logs older than 90 days, and raw GPS pings older than 30 days. Shipment and batch records are never auto-deleted.</p>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={onRunCleanup}
                        isLoading={cleanupLoading}
                        variant="outline"
                        className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest"
                    >
                        <RefreshCw size={14} className="mr-2" />
                        Run Cleanup Now
                    </Button>
                    {cleanupResult && (
                        <p className={`text-xs font-semibold ${cleanupResult.success ? 'text-emerald-600' : 'text-red-500'}`}>
                            {cleanupResult.success
                                ? `Done — removed ${cleanupResult.data?.auditLogs ?? 0} audit logs, ${cleanupResult.data?.refreshTokens ?? 0} tokens, ${cleanupResult.data?.gpsPings ?? 0} GPS pings`
                                : 'Cleanup failed. Check server logs.'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── TickerTab ──
function TickerTab({
    items,
    onChange,
    onSave,
    saved,
}: {
    items: TickerItem[];
    onChange: (items: TickerItem[]) => void;
    onSave: () => void;
    saved: boolean;
}) {
    const [newText, setNewText] = useState("");
    const [newType, setNewType] = useState<"news" | "rate">("news");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState("");

    const handleAdd = () => {
        const trimmed = newText.trim();
        if (!trimmed) return;
        onChange([...items, { id: generateId(), type: newType, text: trimmed }]);
        setNewText("");
    };

    const handleDelete = (id: string) => {
        onChange(items.filter((item) => item.id !== id));
    };

    const handleEdit = (item: TickerItem) => {
        setEditingId(item.id);
        setEditText(item.text);
    };

    const handleEditSave = (id: string) => {
        const trimmed = editText.trim();
        if (!trimmed) return;
        onChange(items.map((item) => (item.id === id ? { ...item, text: trimmed } : item)));
        setEditingId(null);
        setEditText("");
    };

    const handleToggleType = (id: string) => {
        onChange(
            items.map((item) =>
                item.id === id ? { ...item, type: item.type === "news" ? "rate" : "news" } : item
            )
        );
    };

    const handleMoveUp = (idx: number) => {
        if (idx === 0) return;
        const arr = [...items];
        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
        onChange(arr);
    };

    const handleMoveDown = (idx: number) => {
        if (idx === items.length - 1) return;
        const arr = [...items];
        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
        onChange(arr);
    };

    const handleReset = () => {
        onChange(DEFAULT_TICKER_ITEMS.map((item) => ({ ...item })));
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Newspaper size={16} className="text-[#039B81]" />
                    News Ticker Items
                </h3>
                <p className="text-[10px] text-slate-400 mb-6">
                    Manage the scrolling items in the top ticker bar. Click a type badge to toggle between News and Rate. Click text to edit inline. Changes apply site-wide after saving.
                </p>

                {/* Add new item */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as "news" | "rate")}
                        className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 transition-all shrink-0"
                    >
                        <option value="news">🌐 News</option>
                        <option value="rate">📈 Rate</option>
                    </select>
                    <input
                        type="text"
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                        placeholder='e.g. "USD: 15.5 GHC" or "New Accra route launched..."'
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 transition-all"
                    />
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#039B81] text-white rounded-xl font-bold text-sm hover:bg-[#027a65] transition-colors shrink-0"
                    >
                        <Plus size={16} />
                        Add
                    </button>
                </div>

                {/* Items list */}
                <div className="space-y-2">
                    {items.length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            No ticker items. Add one above.
                        </div>
                    )}
                    {items.map((item, idx) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 group"
                        >
                            {/* Move up */}
                            <button
                                onClick={() => handleMoveUp(idx)}
                                disabled={idx === 0}
                                className="text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors shrink-0"
                                title="Move up"
                            >
                                <GripVertical size={14} />
                            </button>

                            {/* Type badge / toggle */}
                            <button
                                onClick={() => handleToggleType(item.id)}
                                title="Click to toggle type"
                                className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${
                                    item.type === "news"
                                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                        : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                }`}
                            >
                                {item.type === "news" ? (
                                    <><Globe size={10} /> news</>
                                ) : (
                                    <><TrendingUp size={10} /> rate</>
                                )}
                            </button>

                            {/* Text — inline edit */}
                            {editingId === item.id ? (
                                <input
                                    autoFocus
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleEditSave(item.id);
                                        if (e.key === "Escape") setEditingId(null);
                                    }}
                                    className="flex-1 px-3 py-1.5 bg-white border border-[#039B81]/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#039B81]/20"
                                />
                            ) : (
                                <span
                                    className="flex-1 text-sm text-slate-700 cursor-text"
                                    onClick={() => handleEdit(item)}
                                    title="Click to edit"
                                >
                                    {item.text}
                                </span>
                            )}

                            {/* Confirm edit / edit button */}
                            {editingId === item.id ? (
                                <button
                                    onClick={() => handleEditSave(item.id)}
                                    className="shrink-0 p-1.5 text-[#039B81] hover:bg-[#039B81]/10 rounded-lg transition-colors"
                                    title="Save edit"
                                >
                                    <Check size={16} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleEdit(item)}
                                    className="shrink-0 p-1.5 text-slate-400 hover:text-[#039B81] hover:bg-[#039B81]/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="Edit"
                                >
                                    <Settings size={14} />
                                </button>
                            )}

                            {/* Delete */}
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="shrink-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete"
                            >
                                <Trash2 size={16} />
                            </button>

                            {/* Move down */}
                            <button
                                onClick={() => handleMoveDown(idx)}
                                disabled={idx === items.length - 1}
                                className="text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors shrink-0 rotate-180"
                                title="Move down"
                            >
                                <GripVertical size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Footer actions */}
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                    <Button
                        onClick={onSave}
                        className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest shadow-md shadow-[#039B81]/20"
                    >
                        {saved ? <Check size={14} className="mr-2" /> : <Save size={14} className="mr-2" />}
                        {saved ? "Saved!" : "Save to Ticker"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest"
                    >
                        <RefreshCw size={14} className="mr-2" />
                        Reset Defaults
                    </Button>
                    {saved && (
                        <p className="text-xs font-semibold text-emerald-600 ml-2">
                            ✓ Ticker updated — visible to all visitors immediately.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
