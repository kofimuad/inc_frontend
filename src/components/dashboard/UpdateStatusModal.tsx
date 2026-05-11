import { useState } from "react";
import { X, MapPin, Activity, MessageSquare } from "lucide-react";
import Button from "@/components/common/Button";
import { logCheckpoint } from "@/services/shipments";

interface UpdateStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    shipmentId: string;
}

const STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "picked_up", label: "Picked Up" },
    { value: "on_hold", label: "On Hold" },
    { value: "in_transit", label: "In Transit" },
    { value: "customs", label: "Customs" },
    { value: "out_for_delivery", label: "Out for Delivery" },
    { value: "delivered", label: "Delivered" },
    { value: "failed", label: "Failed" },
    { value: "returned", label: "Returned" },
];

export default function UpdateStatusModal({ isOpen, onClose, onSuccess, shipmentId }: UpdateStatusModalProps) {
    const [formData, setFormData] = useState({
        status: "",
        address: "",
        city: "",
        country: "",
        note: "",
        internalNote: "",
        carrier: "",
        carrierReference: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        
        try {
            await logCheckpoint(shipmentId, {
                status: formData.status,
                location: {
                    address: formData.address,
                    city: formData.city,
                    country: formData.country,
                },
                note: formData.note || undefined,
                internalNote: formData.internalNote || undefined,
                carrier: formData.carrier || undefined,
                carrierReference: formData.carrierReference || undefined,
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to update status.";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Log Checkpoint</h2>
                        <p className="text-xs text-slate-500 font-medium mt-1">Shipment: {shipmentId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg">{error}</div>}
                    
                    {/* Status */}
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                        <div className="relative">
                            <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select required value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 focus:border-[#039B81]/30 transition-all text-sm text-slate-700">
                                <option value="" disabled>Select Status...</option>
                                {STATUS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Location</label>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 transition-all text-sm"
                                    placeholder="Address" />
                            </div>
                            <input required value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 transition-all text-sm"
                                placeholder="City" />
                            <input required value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 transition-all text-sm"
                                placeholder="Country" />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Customer Note <span className="text-slate-300 normal-case">(optional)</span></label>
                        <div className="relative">
                            <MessageSquare className="absolute left-4 top-3 text-slate-400" size={16} />
                            <textarea value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 transition-all text-sm resize-none"
                                placeholder="Cargo loaded and departed" rows={2} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Internal Note <span className="text-slate-300 normal-case">(staff only)</span></label>
                        <textarea value={formData.internalNote} onChange={(e) => setFormData({...formData, internalNote: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 transition-all text-sm resize-none"
                            placeholder="Internal note..." rows={2} />
                    </div>

                    {/* Carrier Info */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Carrier <span className="text-slate-300 normal-case">(opt.)</span></label>
                            <input value={formData.carrier} onChange={(e) => setFormData({...formData, carrier: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 transition-all text-sm"
                                placeholder="Ethiopian Airlines Cargo" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Reference <span className="text-slate-300 normal-case">(opt.)</span></label>
                            <input value={formData.carrierReference} onChange={(e) => setFormData({...formData, carrierReference: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 transition-all text-sm"
                                placeholder="ET-CARGO-88821" />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <Button type="button" variant="outline" onClick={onClose} className="w-1/2 py-3.5 text-xs font-black uppercase tracking-widest bg-white">Cancel</Button>
                        <Button type="submit" isLoading={isLoading} className="w-1/2 py-3.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-[#039B81]/20">Save Update</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
