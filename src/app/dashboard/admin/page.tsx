"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import Navbar from "@/components/common/Navbar";
import StatsWidget from "@/components/dashboard/StatsWidget";
import DataTable from "@/components/dashboard/DataTable";
import { Users, Shield, TrendingUp, Package, Plus, UserPlus, Settings, Power, X, Eye, EyeOff } from "lucide-react";
import Button from "@/components/common/Button";
import { getAdminDashboardStats } from "@/services/shipments";
import { getUsers, createUser, updateUser } from "@/services/admin";
import { useAuth } from "@/context/AuthContext";
import SystemSettingsModal from "@/components/dashboard/SystemSettingsModal";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { USER_ROLES, ROLE_BADGE_COLORS } from "@/config/constants";

export default function AdminDashboard() {
    const router = useRouter();
    const { logout, user: currentUser } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<{ total: number; page: number; limit: number; pages: number } | undefined>(undefined);

    const fetchStats = async () => {
        try {
            const data = await getAdminDashboardStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch admin stats:", error);
        }
    };

    const fetchUsers = async (opts?: { page?: number; search?: string; role?: string }) => {
        setUsersLoading(true);
        try {
            const params: Record<string, any> = {
                page:  opts?.page ?? page,
                limit: 20,
            };
            const term = opts?.search ?? search;
            const role = opts?.role ?? roleFilter;
            if (term) params.search = term;
            if (role) params.role = role;

            const data = await getUsers(params);
            setUsers(data?.users || (Array.isArray(data) ? data : []));
            setPagination(data?.pagination);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setUsersLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    // Debounced fetch whenever search / role / page changes.
    useEffect(() => {
        const t = setTimeout(() => { fetchUsers({ page, search, role: roleFilter }); }, 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, roleFilter, page]);

    const handleLogout = async () => {
        await logout();
    };

    const handleToggleActive = async (userId: string, isActive: boolean) => {
        try {
            await updateUser(userId, { isActive: !isActive });
            fetchUsers();
        } catch (error) {
            console.error("Failed to update user:", error);
        }
    };

    const getRoleBadgeClass = (role: string) => {
        return ROLE_BADGE_COLORS[role?.toLowerCase()] || ROLE_BADGE_COLORS[USER_ROLES.CUSTOMER];
    };

    const columns = [
        { header: "Name", accessor: "name" },
        { header: "Email", accessor: "email" },
        { 
            header: "Role", 
            accessor: "role",
            render: (item: any) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase ${getRoleBadgeClass(item.role)}`}>
                    {item.role}
                </span>
            )
        },
        { 
            header: "Status", 
            accessor: "isActive",
            render: (item: any) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {item.isActive ? 'Active' : 'Inactive'}
                </span>
            )
        },
        { header: "Joined", accessor: "createdAt", render: (item: any) => (
            <span className="text-sm">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</span>
        )},
        {
            header: "Manage",
            accessor: "id",
            render: (item: any) => (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handleToggleActive(item._id || item.id, item.isActive)}
                        className={`font-bold text-[10px] uppercase hover:underline ${item.isActive ? 'text-red-600' : 'text-green-600'}`}
                    >
                        {item.isActive ? 'Suspend' : 'Activate'}
                    </button>
                </div>
            )
        }
    ];

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className="bg-slate-50 min-h-screen">
            <Navbar />
            <main className="pt-32 pb-20">
                <div className="container mx-auto px-4">
                    {/* Admin Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div>
                            <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">System Admin</h1>
                            <p className="text-slate-500 font-medium">
                                {currentUser ? `Welcome, ${currentUser.name}` : "Global platform management and user oversight."}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button 
                                variant="outline" 
                                onClick={() => setShowSettingsModal(true)}
                                className="py-3 text-xs font-black uppercase tracking-[0.2em]"
                            >
                                <Settings size={18} className="mr-2" />
                                Settings
                            </Button>
                            <Button onClick={() => setShowCreateUserModal(true)} className="py-3 text-xs font-black uppercase tracking-[0.2em]">
                                <UserPlus size={18} className="mr-2" />
                                New User
                            </Button>
                            <button onClick={handleLogout} className="p-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors shrink-0" title="Logout">
                                <Power size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Admin Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        <StatsWidget 
                            title="Total Users" 
                            value={stats ? String(stats.users?.total ?? 0) : "..."} 
                            icon={Users} 
                            trend={stats?.users?.newThisMonth ? { value: stats.users.newThisMonth, isPositive: true } : undefined}
                            color="indigo"
                        />
                        <StatsWidget 
                            title="Total Shipments" 
                            value={stats ? String(stats.shipments?.total ?? 0) : "..."} 
                            icon={Package} 
                            color="emerald"
                        />
                        <StatsWidget 
                            title="Active Logistics" 
                            value={stats ? String(stats.shipments?.activeLogistics ?? 0) : "..."} 
                            icon={TrendingUp} 
                            color="amber"
                        />
                        <StatsWidget 
                            title="Security Status" 
                            value="Secure" 
                            icon={Shield} 
                            description="All systems functional"
                        />
                    </div>

                    {/* User Management Section */}
                    <div>
                        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                                <span className="w-2 h-8 bg-purple-600 rounded-full" />
                                User Management
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter role</span>
                                <select
                                    value={roleFilter}
                                    onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 transition-all"
                                >
                                    <option value="">All roles</option>
                                    <option value="customer">Customer</option>
                                    <option value="employee">Employee</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>

                        <DataTable
                            columns={columns}
                            data={users}
                            isLoading={usersLoading}
                            searchValue={search}
                            onSearchChange={(v) => { setSearch(v); setPage(1); }}
                            searchPlaceholder="Search name or email..."
                            pagination={pagination}
                            onPageChange={(p) => setPage(p)}
                        />
                    </div>
                </div>
            </main>

            {/* Create User Modal */}
            {showCreateUserModal && (
                <CreateUserModal 
                    onClose={() => setShowCreateUserModal(false)} 
                    onSuccess={() => { fetchUsers(); setShowCreateUserModal(false); }} 
                />
            )}

            {showSettingsModal && (
                <SystemSettingsModal 
                    onClose={() => setShowSettingsModal(false)} 
                />
            )}
        </div>
        </ProtectedRoute>
    );
}

// ── Inline CreateUserModal ──
function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', phone: '', role: 'customer' as const,
        isVerified: true, isActive: true
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await createUser({
                ...formData,
                phone: formData.phone || undefined
            });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create user.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Create New User</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg">{error}</div>}
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
                            <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 transition-all text-sm"
                                placeholder="Kofi Mensah" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
                            <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 transition-all text-sm"
                                placeholder="kofi@example.com" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Phone</label>
                            <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 transition-all text-sm"
                                placeholder="+233 26 123 4567" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
                            <div className="relative flex items-center">
                                <input required type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    className="w-full px-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 transition-all text-sm font-medium"
                                    placeholder="Min. 8 characters" minLength={8} />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 text-slate-400 hover:text-[#039B81] transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Role</label>
                            <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 transition-all text-sm text-slate-700">
                                <option value="customer">Customer</option>
                                <option value="employee">Employee</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-6 flex gap-4">
                        <Button type="button" variant="outline" onClick={onClose} className="w-1/2 py-3.5 text-xs font-black uppercase tracking-widest bg-white">Cancel</Button>
                        <Button type="submit" isLoading={isLoading} className="w-1/2 py-3.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-[#039B81]/20">Create User</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
