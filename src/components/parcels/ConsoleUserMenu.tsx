"use client";

import Link from "next/link";
import { Shield, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * Right-hand actions for the Parcel Console top bar. The console is now the
 * staff home, so it carries its own identity + logout, and an Admin link for
 * admins to reach user management.
 */
export default function ConsoleUserMenu() {
  const { user, logout } = useAuth();
  return (
    <div className="ml-auto flex items-center gap-4">
      {user?.role === "admin" && (
        <Link href="/dashboard/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary transition-colors">
          <Shield size={15} /> Admin
        </Link>
      )}
      {user && <span className="text-sm font-medium text-slate-400 hidden sm:inline">{user.name.split(" ")[0]}</span>}
      <button
        onClick={() => logout()}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-red-600 transition-colors"
        title="Logout"
      >
        <LogOut size={15} /> Logout
      </button>
    </div>
  );
}
