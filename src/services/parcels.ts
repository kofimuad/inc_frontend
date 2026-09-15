import api from "./api";

/**
 * Client for the two-layer tracking API (v2). A parcel is the derived,
 * cross-stage view of one tracking number for one customer; the endpoints here
 * read that derived model and never touch raw uploads directly.
 */

export type Stage = "intake" | "loading" | "arrival";
export type ParcelStatus = "received" | "loaded" | "shipped" | "at_port" | "ready_for_pickup" | "delivered";

/** One physical receipt on an intake sheet (a waybill can have several). */
export interface IntakeLine { date?: string | null; qty?: number | null; qtyRaw?: string | null; qtyUnit?: string | null; warehouse?: string | null; srcRow?: number; fileHash?: string; }
/** One container leg on a loading sheet, with its own arrival state. */
export interface LoadingLeg { containerNo?: string | null; batchRef?: string | null; loadingDate?: string | null; etd?: string | null; eta?: string | null; cbm?: number | null; qty?: number | null; qtyRaw?: string | null; qtyUnit?: string | null; arrived?: boolean; srcRow?: number; fileHash?: string; }

export interface ParcelIntake  { date?: string; warehouse?: string | null; qty?: number | null; qtyRaw?: string | null; lines?: IntakeLine[]; }
export interface ParcelLoading { containerNo?: string | null; batchRef?: string | null; loadingDate?: string | null; etd?: string | null; eta?: string | null; cbm?: number | null; location?: string | null; qty?: number | null; legs?: LoadingLeg[]; }
export interface ParcelArrival { date?: string | null; containerNo?: string | null; }

export interface ParcelFlags {
  needsPhone: boolean;
  receivedNotLoaded: boolean;
  loadedNeverReceived: boolean;
  qtyMismatch: boolean;
  needsWaybill?: boolean;
  multiIntake?: boolean;
  multiContainer?: boolean;
  mixedUnits?: boolean;
  partiallyArrived?: boolean;
  partiallyLoaded?: boolean;
}

export interface Parcel {
  _id?: string;
  waybill: string;
  customerKey: string;
  customerPhone?: string | null;
  shippingMark?: string | null;
  customerName?: string | null;
  currentStage: Stage;
  status: string;
  receivedDate?: string | null;
  intake: ParcelIntake | null;
  loading: ParcelLoading | null;
  arrival: ParcelArrival | null;
  qty?: number | null;
  qtyByUnit?: Record<string, number> | null;
  containerNos?: string[];
  productDescription?: string | null;
  flags: ParcelFlags;
  observationRefs?: { fileHash: string; srcRow: number; tokenIndex: number; stage: Stage }[];
}

export interface Reconciliation {
  total: number;
  received: number;
  receivedNotLoaded: number;
  loaded: number;
  arrived: number;
  loadedNeverReceived: number;
  needsPhone: number;
  qtyMismatch: number;
}

export interface ContainerSummary {
  containerNo: string;
  parcels: number;
  loadingDate?: string | null;
  etd?: string | null;
  eta?: string | null;
  arrived?: number;
  spansReceivingDays: string[];
}

export type ParcelBucket =
  | "in_warehouse" | "loaded" | "arrived"
  | "loaded_never_received" | "needs_phone" | "qty_mismatch";

export async function getReconciliation(): Promise<Reconciliation> {
  const { data } = await api.get("/api/v2/reconciliation");
  return data.data;
}

export async function listParcels(params: {
  bucket?: ParcelBucket; container?: string; stage?: Stage;
  search?: string; phone?: string; page?: number; limit?: number;
} = {}): Promise<{ total: number; page: number; parcels: Parcel[] }> {
  const { data } = await api.get("/api/v2/parcels", { params });
  return data.data;
}

export async function getParcelsByWaybill(waybill: string): Promise<{ parcels: Parcel[]; observations: unknown[] }> {
  const { data } = await api.get(`/api/v2/parcels/${encodeURIComponent(waybill)}`);
  return data.data;
}

export async function listContainers(): Promise<ContainerSummary[]> {
  const { data } = await api.get("/api/v2/containers");
  return data.data.containers;
}

export async function getContainer(containerNo: string): Promise<{
  containerNo: string; parcels: number; meta: ParcelLoading;
  spansReceivingDays: string[]; list: Parcel[];
}> {
  const { data } = await api.get(`/api/v2/containers/${encodeURIComponent(containerNo)}`);
  return data.data;
}

export interface UploadPreview {
  stage: Stage | null;
  headerWarnings: string[];
  missingColumns: string[];
  totalRows: number;
  skippedRows: number;
  willLinkExisting: number;
  willCreateNew: number;
  sampleRows: { waybill: string; customerPhone: string | null; shippingMark: string | null; customerName: string | null; qty: number | null; receivedDate: string | null }[];
}

/** Preview a sheet without persisting it. */
export async function validateSheet(file: File): Promise<UploadPreview> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/api/v2/uploads/validate", form, { headers: { "Content-Type": "multipart/form-data" } });
  return data.data;
}

export interface UploadResult {
  stage: Stage;
  observationsInserted: number;
  parcelsWritten: number;
  waybillsRederived: number;
  skippedRows: number[];
}

export async function uploadSheet(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/api/v2/uploads", form, { headers: { "Content-Type": "multipart/form-data" } });
  return data.data;
}

export interface SourceFileRow {
  fileHash: string;
  stage: Stage;
  originalFilename?: string | null;
  uploadedAt?: string;
  rowCount?: number;
  skippedRows?: number[];
  status: "active" | "reverted";
  metadata?: Record<string, unknown>;
}

/** List uploaded sheets (batches), newest first. Pass status:'' to include reverted ones. */
export async function listUploads(params: { stage?: Stage; status?: string; page?: number; limit?: number } = {}): Promise<{ total: number; page: number; files: SourceFileRow[] }> {
  const { data } = await api.get("/api/v2/uploads", { params });
  return data.data;
}

/** Revert an upload — deactivates its rows and re-derives the affected parcels. */
export async function revertUpload(fileHash: string): Promise<{ reverted: string; parcelsWritten: number; parcelsRemoved: number }> {
  const { data } = await api.delete(`/api/v2/uploads/${encodeURIComponent(fileHash)}`);
  return data.data;
}

export interface ParcelAdjustment {
  customerPhone?: string;
  statusOverride?: string;
  heldReason?: string;
  staffNotes?: string;
}

/** Record a staff correction on one parcel (fix a phone, place a hold, add a note). */
export async function adjustParcel(waybill: string, customerKey: string, body: ParcelAdjustment): Promise<Parcel | null> {
  const { data } = await api.patch(
    `/api/v2/parcels/${encodeURIComponent(waybill)}/${encodeURIComponent(customerKey)}`,
    body
  );
  return data.data?.parcel ?? null;
}

/** Set one status on many parcels at once (a whole group). */
export async function bulkSetStatus(
  items: { waybill: string; customerKey: string }[],
  status: ParcelStatus,
): Promise<{ updated: number; waybills: number }> {
  const { data } = await api.post("/api/v2/parcels/bulk-status", { items, status });
  return data.data;
}
