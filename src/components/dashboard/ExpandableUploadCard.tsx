"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronRight, Pencil, Trash2, Loader2, AlertTriangle } from "lucide-react";

interface Meta { label: string; value: string }

interface Props {
    title: string;
    icon?: React.ReactNode;
    badge?: { label: string; className: string };
    meta?: Meta[];
    onEdit?: () => void;
    onDelete?: () => void;
    deleting?: boolean;
    /** Lazily load the items belonging to this card (batch / container). */
    loadItems: () => Promise<any[]>;
    onEditItem: (item: any) => void;
    onDeleteItem?: (item: any) => Promise<void> | void;
    statusColor: (status: string) => string;
    formatStatus: (status: string) => string;
    /** Bump to force an open card to reload its items (e.g. after an edit). */
    reloadKey?: number;
}

const MISSING_KEYS = ["customerName", "customerPhone", "destinationCity", "productDescription", "quantity"];
const hasMissing = (it: any) =>
    MISSING_KEYS.some((k) => it[k] === null || it[k] === undefined || String(it[k]).trim() === "");

export default function ExpandableUploadCard({
    title, icon, badge, meta, onEdit, onDelete, deleting,
    loadItems, onEditItem, onDeleteItem, statusColor, formatStatus, reloadKey = 0,
}: Props) {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try { setItems(await loadItems()); }
        catch { setItems([]); }
        finally { setLoading(false); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggle = () => {
        const next = !open;
        setOpen(next);
        if (next && items === null) load();
    };

    // Reload an already-open card when the parent signals a data change.
    useEffect(() => {
        if (open && reloadKey > 0) load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reloadKey]);

    return (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between gap-3 p-5">
                <button onClick={toggle} className="flex items-center gap-3 min-w-0 flex-1 text-left group">
                    {open
                        ? <ChevronDown size={16} className="text-slate-400 shrink-0" />
                        : <ChevronRight size={16} className="text-slate-400 shrink-0 group-hover:text-slate-600" />}
                    {icon}
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-slate-800 text-sm truncate">{title}</span>
                            {badge && (
                                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${badge.className}`}>
                                    {badge.label}
                                </span>
                            )}
                        </div>
                        {meta && meta.length > 0 && (
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                                {meta.map((m, i) => (
                                    <span key={i} className="text-[10px] text-slate-400 font-bold">
                                        <span className="uppercase">{m.label}:</span> {m.value}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </button>
                {(onEdit || onDelete) && (
                    <div className="flex items-center gap-3 shrink-0">
                        {onEdit && (
                            <button onClick={onEdit} className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-[#039B81] uppercase tracking-widest transition-colors">
                                <Pencil size={12} /> Edit
                            </button>
                        )}
                        {onDelete && (
                            <button onClick={onDelete} disabled={deleting} className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors disabled:opacity-50">
                                <Trash2 size={12} /> {deleting ? "Deleting..." : "Delete"}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {open && (
                <div className="border-t border-slate-100">
                    {loading ? (
                        <div className="py-8 flex justify-center text-[#039B81]"><Loader2 className="animate-spin" size={20} /></div>
                    ) : !items || items.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No items in this upload.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/60 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="px-5 py-2.5">Tracking</th>
                                        <th className="px-5 py-2.5">Customer</th>
                                        <th className="px-5 py-2.5">Qty</th>
                                        <th className="px-5 py-2.5">CBM</th>
                                        <th className="px-5 py-2.5">Status</th>
                                        <th className="px-5 py-2.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((it) => (
                                        <tr key={it._id} className="border-t border-slate-50 hover:bg-slate-50/40 transition-colors text-sm">
                                            <td className="px-5 py-2.5 font-mono font-bold text-slate-700">
                                                <span className="flex items-center gap-1.5">
                                                    {it.waybillNo || "—"}
                                                    {hasMissing(it) && <span title="Has missing fields"><AlertTriangle size={12} className="text-amber-500 shrink-0" /></span>}
                                                </span>
                                            </td>
                                            <td className="px-5 py-2.5">
                                                {it.customerName || <span className="text-slate-300 italic text-xs">No name</span>}
                                                {(it.customerPhoneRaw || it.customerPhone) && (
                                                    <span className="block text-[10px] font-mono text-slate-400">{it.customerPhoneRaw || it.customerPhone}</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-2.5 font-black text-slate-700">{it.quantity ?? it.itemsCount ?? 0}</td>
                                            <td className="px-5 py-2.5 tabular-nums text-slate-700">{it.cbm != null ? `${it.cbm} m³` : "—"}</td>
                                            <td className="px-5 py-2.5">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusColor(it.status)}`}>
                                                    {formatStatus(it.status)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-2.5">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button onClick={() => onEditItem(it)} className="text-[10px] font-black text-slate-400 hover:text-[#039B81] uppercase tracking-widest transition-colors">Edit</button>
                                                    {onDeleteItem && (
                                                        <button onClick={() => onDeleteItem(it)} className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors">Delete</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
