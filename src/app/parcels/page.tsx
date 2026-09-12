import Link from "next/link";
import ParcelWorkspace from "@/components/parcels/ParcelWorkspace";
import ProtectedRoute from "@/components/common/ProtectedRoute";

export const metadata = {
  title: "Parcel Tracking · Clinette Shipping",
  description: "Track every parcel across warehouse, container and arrival.",
};

/**
 * Staff Parcel Tracking workspace. Reads the derived two-layer model (v2 API),
 * falling back to bundled sample data when the backend is unreachable so the
 * screen is always demonstrable. Staff-only.
 */
export default function ParcelsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "employee"]}>
      <main className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-2.5">
            <span className="text-base tracking-tight">
              <span className="font-black text-slate-800">Clinette</span>{" "}
              <span className="font-semibold text-secondary">Shipping</span>
            </span>
            <span className="text-slate-200">|</span>
            <span className="font-bold text-slate-500 text-sm">Parcel Console</span>
            <Link href="/dashboard/employee" className="ml-auto text-sm font-semibold text-slate-400 hover:text-primary">← Dashboard</Link>
          </div>
        </div>
        <ParcelWorkspace />
      </main>
    </ProtectedRoute>
  );
}
