import ParcelWorkspace from "@/components/parcels/ParcelWorkspace";

export const metadata = {
  title: "Parcel Tracking · I&C Logistics",
  description: "Track every parcel across warehouse, container and arrival.",
};

/**
 * Staff Parcel Tracking workspace. Reads the derived two-layer model (v2 API),
 * falling back to bundled sample data when the backend is unreachable so the
 * screen is always demonstrable.
 */
export default function ParcelsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-black text-sm">I&amp;C</div>
          <span className="font-bold text-slate-700">Logistics Console</span>
        </div>
      </div>
      <ParcelWorkspace />
    </main>
  );
}
