"use client";

import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import {
  Package,
  Search,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getPublicTracking, type TrackingChoice } from "@/services/shipments";
import {
  searchContainerLoadings,
  type ContainerLoading,
} from "@/services/containerLoadings";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { STATUS_COLORS, STATUS_LABELS } from "@/config/constants";

const formatLocation = (loc: any) => {
  if (!loc) return "N/A";
  if (typeof loc === "string") return loc;
  const parts = [loc.city, loc.country].filter(Boolean);
  return parts.join(", ") || loc.address || "N/A";
};

function formatDate(date?: string | Date | null): string {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

// Goods still at the China warehouse have no container number or ETA —
// those only exist once the item appears on a loaded packing list.
const PRE_LOADING_STATUSES = ["in_warehouse", "held"];

// Map status to timeline props
const getStatusDisplay = (status: string) => {
  return (
    status?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
    "Unknown"
  );
};

type TrackResult = {
  trackingNumber: string;
  shipment: any | null;
  container: ContainerLoading | null;
  containerItem: any | null;
  events: any[];
  found: boolean;
  // A consolidated tracking number carries several customers' goods. When one
  // is searched without an identifier, the server withholds the shipments and
  // returns masked entries to choose from instead.
  ambiguous?: boolean;
  choices?: TrackingChoice[];
};

function TrackingContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  // Phone number or shipping mark carried over from the homepage search box.
  const initialId = searchParams.get("id") || "";
  const [trackingInput, setTrackingInput] = useState(initialQuery);
  // Optional second identifier: a phone number, or a shipping mark for the
  // customers whose records carry no phone at all.
  const [identifierInput, setIdentifierInput] = useState(initialId);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<TrackResult[]>([]);
  const [noMatchFor, setNoMatchFor] = useState<string[]>([]);
  const lastAutoSearch = useRef<string>("");

  // A mark is anything with a letter in it ("ACC-28672", "ANGIE"); anything
  // else is treated as a phone number. Mirrors how the backend reads the
  // CONTACT column on the spreadsheets.
  const buildIdentifier = (raw: string) => {
    const value = raw.trim();
    if (!value) return undefined;
    return /[A-Za-z]/.test(value) ? { mark: value } : { phone: value };
  };

  const runTrackSearch = async (inputValue: string, identifierValue = "") => {
    const numbers = inputValue
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    if (numbers.length === 0) return;

    const identifier = buildIdentifier(identifierValue);

    setIsSearching(true);
    const settled = await Promise.allSettled(
      numbers.map(async (num): Promise<TrackResult[]> => {
        const shipmentData = await getPublicTracking(num, identifier);

        if (shipmentData?.ambiguous) {
          return [
            {
              trackingNumber: num,
              shipment: null,
              container: null,
              containerItem: null,
              events: [],
              found: false,
              ambiguous: true,
              choices: shipmentData.choices ?? [],
            },
          ];
        }

        // Fetch container data in parallel — silently ignore if not found
        const containerSearch = await searchContainerLoadings(num).catch(
          () => null,
        );
        const container = containerSearch?.waybillMatch?.container ?? null;
        const containerItem = containerSearch?.waybillMatch?.item ?? null;

        // One number can resolve to several shipments — a customer with more
        // than one parcel under it, or an unshared number narrowed by nothing.
        // Render a row for each rather than silently showing only the first.
        const shipments: any[] = shipmentData?.items?.length
          ? shipmentData.items
          : [shipmentData];

        return shipments.map((s: any) => ({
          trackingNumber: num,
          shipment: s,
          container,
          containerItem,
          events: s?.timeline || [],
          found: true,
        }));
      }),
    );

    const next = settled.flatMap((res, i) =>
      res.status === "fulfilled"
        ? res.value
        : [
            {
              trackingNumber: numbers[i],
              shipment: null,
              container: null,
              containerItem: null,
              events: [],
              found: false,
            },
          ],
    );

    setResults(next);
    // An identifier that matched nothing is a different failure from an unknown
    // tracking number, and deserves its own message.
    setNoMatchFor(
      identifier
        ? next.filter((r) => !r.found && !r.ambiguous).map((r) => r.trackingNumber)
        : [],
    );
    setHasSearched(true);
    setIsSearching(false);
  };

  useEffect(() => {
    // Keyed on both values, so arriving from the homepage with an identifier
    // runs the narrowed search rather than the bare tracking-number one.
    const key = `${initialQuery}::${initialId}`;
    if (!initialQuery || lastAutoSearch.current === key) return;

    lastAutoSearch.current = key;
    setTrackingInput(initialQuery);
    setIdentifierInput(initialId);
    void runTrackSearch(initialQuery, initialId);
  }, [initialQuery, initialId]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    await runTrackSearch(trackingInput, identifierInput);
  };

  const foundResults = results.filter((r) => r.found);
  const ambiguousResults = results.filter((r) => r.ambiguous);
  const notFoundNumbers = results
    .filter((r) => !r.found && !r.ambiguous && !noMatchFor.includes(r.trackingNumber))
    .map((r) => r.trackingNumber);

  return (
    <main className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-white pt-32 pb-20 border-b border-slate-100">
        <div className="container mx-auto px-4 mt-10">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Track Your Shipment
            </h1>
            <p className="text-lg text-slate-500 font-medium mb-12">
              Enter one or more tracking numbers to get real-time updates
            </p>

            {/* Tracking Form */}
            <form
              onSubmit={handleTrack}
              className="bg-white rounded-2xl p-2 flex flex-col gap-2 shadow-2xl shadow-slate-200 border border-slate-100"
            >
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative grow">
                  <Package
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="e.g. GH377033115, GH377033116"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    className="w-full pl-14 pr-4 py-4 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 focus:bg-white focus:border-[#039B81]/30 transition-all font-medium text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-[#039B81] hover:bg-[#027a65] disabled:bg-slate-300 disabled:shadow-none text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#039B81]/20 shrink-0"
                >
                  {isSearching ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search size={18} />
                  )}
                  <span>{isSearching ? "Searching..." : "Track Item"}</span>
                </button>
              </div>
              {/* Some tracking numbers cover several customers' goods, so this
                  is how a customer says which of them is theirs. */}
              <div className="relative">
                <Phone
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Phone number or shipping mark (optional)"
                  value={identifierInput}
                  onChange={(e) => setIdentifierInput(e.target.value)}
                  className="w-full pl-14 pr-4 py-3 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#039B81]/20 focus:bg-white focus:border-[#039B81]/30 transition-all font-medium text-sm"
                />
              </div>
            </form>
            <p className="text-xs text-slate-400 font-medium mt-3">
              Separate multiple tracking numbers with commas. Add your phone
              number or shipping mark if a number covers more than one customer.
            </p>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          {/* Empty state */}
          {!hasSearched && (
            <div className="max-w-2xl mx-auto text-center py-12">
              <Truck className="mx-auto mb-4 text-gray-300" size={64} />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">
                Enter a Tracking Number
              </h2>
              <p className="text-gray-500">
                Your shipment details will appear here once you search
              </p>
            </div>
          )}

          {/* Shared tracking number — ask which customer they are */}
          {hasSearched && ambiguousResults.length > 0 && (
            <div className="max-w-3xl mx-auto mb-8">
              {ambiguousResults.map((r) => (
                <div
                  key={r.trackingNumber}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6"
                >
                  <div className="px-6 py-5 border-b border-slate-100 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                      <Users className="text-amber-500" size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                        More than one shipment
                      </h2>
                      <p className="text-sm text-slate-500 font-medium mt-1">
                        Tracking number{" "}
                        <span className="font-mono font-bold text-slate-700">
                          {r.trackingNumber}
                        </span>{" "}
                        covers {r.choices?.length ?? 0} customers&apos; goods.
                        Enter your phone number or shipping mark above to see
                        yours.
                      </p>
                    </div>
                  </div>
                  <ul className="divide-y divide-slate-50">
                    {(r.choices ?? []).map((c, i) => (
                      <li
                        key={i}
                        className="px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-1"
                      >
                        <span className="text-sm font-bold text-slate-700 min-w-40">
                          {c.customerName || "—"}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {c.customerPhone || c.shippingMark || "—"}
                        </span>
                        {c.destinationCity && (
                          <span className="text-xs font-medium text-slate-400">
                            {c.destinationCity}
                          </span>
                        )}
                        <span className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-auto">
                          {STATUS_LABELS[c.status] || getStatusDisplay(c.status)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="px-6 py-3 bg-slate-50/60 text-[11px] text-slate-400 font-medium">
                    Details are hidden until you confirm which shipment is
                    yours.
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Identifier supplied, but it matched nothing on that number */}
          {hasSearched && noMatchFor.length > 0 && (
            <div className="max-w-2xl mx-auto text-center py-8">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="text-amber-500" size={28} />
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-2 tracking-tight">
                No match for that phone or shipping mark
              </h2>
              <p className="text-slate-500 font-medium">
                We found{" "}
                <span className="font-bold">
                  &quot;{noMatchFor.join('", "')}&quot;
                </span>
                , but nothing on it matches{" "}
                <span className="font-bold">{identifierInput}</span>. Check the
                number, or search without it to see how many shipments share it.
              </p>
            </div>
          )}

          {/* All not found */}
          {hasSearched &&
            foundResults.length === 0 &&
            ambiguousResults.length === 0 &&
            noMatchFor.length === 0 && (
            <div className="max-w-2xl mx-auto text-center py-12">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="text-amber-500" size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">
                Not Received Yet
              </h2>
              <p className="text-slate-500 font-medium mb-6">
                We have not received any shipment for{" "}
                <span className="font-bold">
                  "{notFoundNumbers.join('", "')}"
                </span>{" "}
                yet. Your package may still be on its way to our warehouse.
              </p>
              <p className="text-sm text-slate-400 font-medium">
                If you believe this is an error, please{" "}
                <a
                  href="/contact"
                  className="text-[#039B81] hover:underline font-bold uppercase tracking-widest text-[10px]"
                >
                  Contact Support
                </a>
                .
              </p>
            </div>
          )}

          {/* Results */}
          {hasSearched && foundResults.length > 0 && (
            <div className="w-full">
              {/* Partial not-found warning */}
              {notFoundNumbers.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
                  <Package
                    className="text-amber-500 shrink-0 mt-0.5"
                    size={18}
                  />
                  <p className="text-sm font-medium text-amber-800">
                    <span className="font-black">Not received yet: </span>
                    {notFoundNumbers.join(", ")}
                  </p>
                </div>
              )}

              {/* Shipments Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-8 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                    <span className="w-2 h-6 bg-[#039B81] rounded-full" />
                    Shipment Results
                  </h2>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {foundResults.length}{" "}
                    {foundResults.length === 1 ? "shipment" : "shipments"} found
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/60">
                        <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">
                          Shipping Mark
                        </th>
                        <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">
                          Tracking No.
                        </th>
                        <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">
                          Product Name
                        </th>
                        <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">
                          Qty
                        </th>
                        <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">
                          CBM
                        </th>
                        <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">
                          Date Received
                        </th>
                        <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">
                          Date Loaded
                        </th>
                        <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">
                          Container No.
                        </th>
                        <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">
                          ETA
                        </th>
                        <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] border-b border-slate-100">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {foundResults.map((r, idx) => {
                        const s = r.shipment;
                        const c = r.container;
                        const ci = r.containerItem;
                        const tracking =
                          s.waybillNo || s.trackingNumber || r.trackingNumber;
                        // Date Received = when goods were received at the origin
                        // warehouse (from the sheet's RECEIVING DATE → intakeDate).
                        // The record's createdAt (upload time) is only a last resort.
                        const dateReceived =
                          s.dates?.intakeDate ||
                          s.dates?.receivedAt ||
                          s.dates?.created ||
                          s.createdAt;
                        // Date Loaded = container's loading date or ETD (departure from China)
                        const dateLoaded =
                          c?.loadingDate ||
                          c?.etd ||
                          s.dates?.shippedAt ||
                          s.loadingDate;
                        // CBM: try container item first (has it even if public API omits it), then shipment fields
                        const cbm = ci?.cbm ?? s.cargo?.cbm ?? s.cbm ?? null;
                        const productName =
                          ci?.productDescription ||
                          s.cargo?.description ||
                          s.cargo?.productDescription ||
                          s.productDescription ||
                          s.description ||
                          s.goodsType ||
                          "—";
                        const qty =
                          s.cargo?.quantity ?? s.quantity ?? s.itemsCount ?? 0;
                        const shippingMarkName =
                          ci?.customerName ||
                          s.customerName ||
                          s.cargo?.customerName ||
                          "—";
                        const shippingMarkPhone =
                          s.customerPhoneRaw ||
                          s.customerPhone ||
                          ci?.customerPhone ||
                          s.cargo?.customerPhone ||
                          "";
                        const statusCode = s.status?.code || s.status;
                        // Container number and ETA only exist once goods are
                        // loaded — warehouse goods must show neither.
                        const isLoaded =
                          !PRE_LOADING_STATUSES.includes(statusCode);
                        const containerNo = isLoaded
                          ? c?.containerNumber ||
                            s.containerNo ||
                            s.containerRef ||
                            null
                          : null;
                        // ETA comes from the container the shipment belongs to
                        const eta = isLoaded
                          ? c?.eta ||
                            s.dates?.estimatedDelivery ||
                            s.estimatedDelivery
                          : null;
                        const statusLabel =
                          STATUS_LABELS[statusCode] ||
                          getStatusDisplay(statusCode);
                        const statusBadge =
                          STATUS_COLORS[statusCode] || STATUS_COLORS.default;

                        return (
                          <tr
                            key={`${r.trackingNumber}-${shippingMarkPhone || shippingMarkName || idx}`}
                            className={`hover:bg-slate-50/60 transition-colors ${idx !== foundResults.length - 1 ? "border-b border-slate-50" : ""}`}
                          >
                            <td className="px-4 py-4 text-sm text-slate-700 min-w-40">
                              <span className="font-medium block">{shippingMarkName}</span>
                              {shippingMarkPhone && (
                                <span className="text-xs text-slate-400 font-mono">{shippingMarkPhone}</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm font-bold text-slate-800 font-mono whitespace-nowrap">
                              {tracking}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-slate-700 min-w-35"
                              title={productName}
                            >
                              {productName}
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                                {qty}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm font-bold text-slate-700 tabular-nums whitespace-nowrap">
                              {cbm != null ? (
                                <>
                                  {cbm}{" "}
                                  <span className="text-[10px] font-medium text-slate-400">
                                    m³
                                  </span>
                                </>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-slate-600 tabular-nums whitespace-nowrap">
                              {formatDate(dateReceived)}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-slate-600 tabular-nums whitespace-nowrap">
                              {formatDate(dateLoaded)}
                            </td>
                            <td className="px-4 py-4 text-sm font-bold text-[#039B81] font-mono whitespace-nowrap">
                              {containerNo || (
                                <span className="text-slate-300 font-medium">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-slate-600 tabular-nums whitespace-nowrap">
                              {formatDate(eta)}
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${statusBadge}`}
                              >
                                {statusLabel}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Timelines — one per found shipment */}
              {foundResults.map((r, ti) => (
                <div
                  key={`${r.trackingNumber}-timeline-${ti}`}
                  className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-6"
                >
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-3">
                    <span className="w-2 h-6 bg-[#FC6100] rounded-full" />
                    Timeline —{" "}
                    <span className="font-mono text-[#039B81]">
                      {r.shipment?.waybillNo ||
                        r.shipment?.trackingNumber ||
                        r.trackingNumber}
                    </span>
                    {/* Several customers can share one number, so name whose
                        timeline this is when more than one row came back. */}
                    {foundResults.length > 1 && r.shipment?.customerName && (
                      <span className="text-slate-400 font-bold normal-case tracking-normal">
                        {r.shipment.customerName}
                      </span>
                    )}
                  </h3>
                  {r.events.length > 0 ? (
                    <div className="space-y-0">
                      {r.events.map((event: any, index: number) => {
                        const isLatest = index === 0;
                        const isCompleted = index > 0;
                        return (
                          <div
                            key={event._id || event.id || index}
                            className="flex gap-4"
                          >
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                  isLatest
                                    ? "bg-[#039B81]"
                                    : isCompleted
                                      ? "bg-[#10b981]"
                                      : "bg-gray-200"
                                }`}
                              >
                                {isLatest ? (
                                  <Truck className="text-white" size={16} />
                                ) : isCompleted ? (
                                  <CheckCircle
                                    className="text-white"
                                    size={16}
                                  />
                                ) : (
                                  <Clock className="text-slate-400" size={16} />
                                )}
                              </div>
                              {index < r.events.length - 1 && (
                                <div
                                  className={`w-0.5 h-12 ${isCompleted ? "bg-[#10b981]" : "bg-slate-200"}`}
                                />
                              )}
                            </div>
                            <div className="pb-8">
                              <p
                                className={`font-black text-sm uppercase tracking-wide ${isLatest ? "text-[#039B81]" : "text-slate-800"}`}
                              >
                                {getStatusDisplay(event.status)}
                              </p>
                              <p className="text-xs text-slate-500 font-medium font-mono mt-0.5">
                                {event.timestamp
                                  ? new Date(event.timestamp).toLocaleString()
                                  : ""}
                              </p>
                              {event.location && (
                                <div className="flex items-center gap-1 text-xs text-slate-400 font-medium mt-1">
                                  <MapPin size={12} />
                                  <span>{formatLocation(event.location)}</span>
                                </div>
                              )}
                              {event.note && (
                                <p className="text-xs text-slate-500 mt-1">
                                  {event.note}
                                </p>
                              )}
                              {event.carrier && (
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Carrier: {event.carrier}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm font-medium text-center py-8">
                      No tracking events recorded yet.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function TrackingPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            Loading...
          </div>
        }
      >
        <TrackingContent />
      </Suspense>
      <Footer />
    </>
  );
}
