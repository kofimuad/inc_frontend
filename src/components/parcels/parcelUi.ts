import { Warehouse, Ship, PackageCheck, type LucideIcon } from "lucide-react";
import type { Parcel, Stage } from "@/services/parcels";

/** Visual identity for each stage of the pipeline. */
export const STAGE_META: Record<Stage, {
  label: string; short: string; icon: LucideIcon;
  dot: string; text: string; soft: string; ring: string; bar: string;
}> = {
  intake:  { label: "In Warehouse", short: "Warehouse", icon: Warehouse,     dot: "bg-amber-500",   text: "text-amber-700",   soft: "bg-amber-50",   ring: "ring-amber-200",   bar: "bg-amber-400" },
  loading: { label: "On the Water", short: "Loaded",    icon: Ship,          dot: "bg-sky-500",     text: "text-sky-700",     soft: "bg-sky-50",     ring: "ring-sky-200",     bar: "bg-sky-400" },
  arrival: { label: "Arrived",      short: "Arrived",   icon: PackageCheck,  dot: "bg-emerald-500", text: "text-emerald-700", soft: "bg-emerald-50", ring: "ring-emerald-200", bar: "bg-emerald-400" },
};

export const STAGE_ORDER: Stage[] = ["intake", "loading", "arrival"];

export function stageRank(s: Stage): number {
  return STAGE_ORDER.indexOf(s);
}

export function fmtDate(d?: string | null): string {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDay(d?: string | null): string {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

/** Whole days a parcel has waited in the warehouse without being loaded. */
export function daysWaiting(p: Parcel): number | null {
  if (!p.receivedDate || p.currentStage !== "intake") return null;
  const then = new Date(p.receivedDate).getTime();
  if (isNaN(then)) return null;
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
}

export function customerLabel(p: Parcel): string {
  return p.customerName || p.shippingMark || p.customerPhone || "Unidentified";
}

/** The most pressing exception flag on a parcel, for a badge. */
export function alertOf(p: Parcel): { label: string; className: string } | null {
  if (p.flags.loadedNeverReceived) return { label: "No intake record", className: "bg-rose-50 text-rose-600 ring-rose-200" };
  if (p.flags.needsPhone)          return { label: "Needs phone",       className: "bg-orange-50 text-orange-600 ring-orange-200" };
  if (p.flags.qtyMismatch)         return { label: "Qty mismatch",      className: "bg-fuchsia-50 text-fuchsia-600 ring-fuchsia-200" };
  return null;
}
