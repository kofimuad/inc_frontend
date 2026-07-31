import React, { useCallback } from "react";
import { ChevronRight, ChevronLeft, Search, Filter, Download } from "lucide-react";

interface Column {
    header: string;
    accessor: string;
    render?: (item: any) => React.ReactNode;
}

interface DataTableProps {
    columns: Column[];
    data: any[];
    onRowClick?: (item: any) => void;
    isLoading?: boolean;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    pagination?: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
    onPageChange?: (page: number) => void;
}

const DataTable: React.FC<DataTableProps> = ({
    columns,
    data,
    onRowClick,
    isLoading = false,
    searchValue = "",
    onSearchChange,
    searchPlaceholder = "Search tracking #, city, or description...",
    pagination,
    onPageChange,
}) => {
    const startRange = pagination ? (pagination.page - 1) * pagination.limit + 1 : 1;
    const endRange = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : data.length;

    /** Build a CSV from visible columns + current page data and trigger download */
    const handleExport = useCallback(() => {
        if (data.length === 0) return;

        // Skip columns that are purely interactive (e.g. "Actions")
        const exportableCols = columns.filter(
            (c) => !['_id', 'id', 'actions'].includes(c.accessor.toLowerCase()) && c.header.toLowerCase() !== 'actions'
        );

        const escape = (val: any): string => {
            if (val == null) return '';
            const str = String(val).replace(/"/g, '""');
            return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
        };

        const header = exportableCols.map((c) => escape(c.header)).join(',');
        const rows = data.map((item) =>
            exportableCols.map((c) => escape(item[c.accessor] ?? '')).join(',')
        );

        const csv = [header, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const today = new Date().toISOString().slice(0, 10);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shipments_export_${today}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [columns, data]);

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Table Header / Actions */}
            <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
                <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                        type="text" 
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 focus:border-[#039B81]/50 transition-all font-medium"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        disabled={data.length === 0}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 hover:border-[#039B81]/30 hover:text-[#039B81] transition-all text-slate-700 font-bold text-xs uppercase tracking-widest disabled:opacity-30 disabled:pointer-events-none"
                    >
                        <Download size={18} />
                        Export
                    </button>
                </div>
            </div>

            {/* Actual Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            {columns.map((column, idx) => (
                                <th key={idx} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-8 py-20 text-center">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#039B81] mx-auto" />
                                    <p className="mt-4 text-slate-400 font-bold text-xs uppercase tracking-widest">Loading records...</p>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-8 py-20 text-center text-slate-400 text-sm font-medium">
                                    No records found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            data.map((item, rowIdx) => (
                                <tr 
                                    key={rowIdx} 
                                    onClick={() => onRowClick?.(item)}
                                    className={`group hover:bg-slate-50/50 transition-colors cursor-pointer ${rowIdx !== data.length - 1 ? 'border-b border-slate-50' : ''}`}
                                >
                                    {columns.map((column, colIdx) => (
                                        <td key={colIdx} className="px-8 py-5 text-sm font-bold text-slate-700">
                                            {column.render ? column.render(item) : item[column.accessor]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-8 py-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Showing {data.length > 0 ? startRange : 0} to {endRange} of {pagination?.total || data.length} entries
                </span>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => onPageChange?.(pagination!.page - 1)}
                        disabled={!pagination || pagination.page <= 1}
                        className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button 
                        onClick={() => onPageChange?.(pagination!.page + 1)}
                        disabled={!pagination || pagination.page >= pagination.pages}
                        className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataTable;
