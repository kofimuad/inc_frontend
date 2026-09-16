import axios from 'axios';
import api from './api';
import {
    NewShipmentPayload,
    CheckpointPayload,
} from '@/types/shipment';

// Plain client for the public v2 tracking endpoints — no auth interceptors, so
// a logged-out visitor's request never triggers a token refresh.
const publicApi = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// A derived Parcel (v2) mapped onto the flat shipment shape the customer
// dashboard and public tracking page already render. Keeps those UIs unchanged
// while the data comes from the two-layer model.
function synthTimeline(p: any) {
    const t: any[] = [];
    if (p.intake)  t.push({ status: 'in_warehouse', timestamp: p.intake.date,  location: p.intake.warehouse,   note: 'Received at the warehouse' });
    const legs: any[] = p.loading?.legs || [];
    if (legs.length > 1) {
        // A shipment split across containers: one loaded/arrived entry per leg,
        // each with its own state, so the customer sees every container.
        for (const l of legs) {
            t.push({ status: 'shipped', timestamp: l.loadingDate, location: l.containerNo, note: `Loaded into container ${l.containerNo || ''}`.trim() });
            if (l.arrived) t.push({ status: 'arrived', timestamp: null, location: l.containerNo, note: `Container ${l.containerNo || ''} arrived at the port`.trim() });
        }
    } else {
        if (p.loading) t.push({ status: 'shipped', timestamp: p.loading.loadingDate, location: p.loading.containerNo, note: 'Loaded into container' });
        if (p.arrival) t.push({ status: 'arrived', timestamp: p.arrival.date,  location: p.arrival.containerNo, note: 'Arrived at the port' });
    }
    return t;
}
function parcelToShipment(p: any) {
    const legs: any[] = p.loading?.legs || [];
    const container = p.loading?.containerNo ?? p.arrival?.containerNo ?? null;
    return {
        _id:               `${p.waybill}|${p.currentStage || ''}`,
        waybillNo:         p.waybill,
        status:            p.status,
        currentStage:      p.currentStage,
        customerName:      p.customerName ?? null,
        destinationCity:   p.loading?.location ?? null,
        productDescription: p.productDescription ?? null,
        quantity:          p.qty ?? null,
        qtyByUnit:         p.qtyByUnit ?? null,
        cbm:               p.cbm ?? p.loading?.cbm ?? null,
        containerRef:      container,
        containerNo:       container,
        // Every container this shipment is split across, each with its own
        // arrival state (empty / single-element for an unsplit shipment).
        containers:        legs.map((l) => ({ containerNo: l.containerNo, loadingDate: l.loadingDate, eta: l.eta, qty: l.qty, arrived: !!l.arrived })),
        partiallyArrived:  !!p.partiallyArrived,
        intakeDate:        p.intake?.date ?? p.receivedDate ?? null,
        receivingDate:     p.loading?.loadingDate ?? null,
        loadingDate:       p.loading?.loadingDate ?? null,
        estimatedDelivery: p.loading?.eta ?? null,
        arrivalDate:       p.arrival?.date ?? null,
        timeline:          synthTimeline(p),
        // Nested shapes the public tracking table reads (dates.* / cargo.*).
        dates: {
            intakeDate: p.intake?.date ?? p.receivedDate ?? null,
            shippedAt:  p.loading?.loadingDate ?? null,
            arrivedAt:  p.arrival?.date ?? null,
        },
        cargo: {
            cbm:         p.cbm ?? p.loading?.cbm ?? null,
            description: p.productDescription ?? null,
        },
    };
}

// A single tracking number for one customer can cover several distinct goods —
// received on different days and/or loaded into different containers. Rather
// than sum them into one row, expand a parcel into one display row per physical
// line: one per goods-received receipt and one per container load. A normal
// single good (≤1 receipt and ≤1 load) stays a single combined row that still
// shows received → loaded → arrived together.
function parcelToRows(p: any): any[] {
    const intakeLines: any[] = (p.intake && p.intake.lines) || [];
    const legs: any[] = (p.loading && p.loading.legs) || [];
    if (intakeLines.length <= 1 && legs.length <= 1) return [parcelToShipment(p)];

    const base = parcelToShipment(p);
    const rows: any[] = [];

    // Each row keeps the parcel's authoritative status (which already reflects
    // any staff/manual override) — only the quantity, dates and container are
    // split per physical line, so a staff-set status is never lost.
    intakeLines.forEach((l, i) => {
        rows.push({
            ...base,
            _id: `${p.waybill}|rcv|${i}`,
            quantity: l.qty ?? null,
            qtyByUnit: null,
            intakeDate: l.date ?? p.receivedDate ?? null,
            receivingDate: null,
            loadingDate: null,
            arrivalDate: null,
            containerRef: null,
            containerNo: null,
            estimatedDelivery: null,
            cbm: null,
            containers: [],
            partiallyArrived: false,
            timeline: [{ status: 'in_warehouse', timestamp: l.date ?? null, location: p.intake?.warehouse ?? null, note: 'Received at the warehouse' }],
            dates: { intakeDate: l.date ?? null, shippedAt: null, arrivedAt: null },
            cargo: { cbm: null, description: p.productDescription ?? null },
        });
    });

    legs.forEach((l, i) => {
        const arrived = !!l.arrived;
        rows.push({
            ...base,
            _id: `${p.waybill}|leg|${i}`,
            quantity: l.qty ?? null,
            qtyByUnit: null,
            intakeDate: null,
            receivingDate: l.loadingDate ?? null,
            loadingDate: l.loadingDate ?? null,
            arrivalDate: arrived ? (p.arrival?.date ?? null) : null,
            containerRef: l.containerNo ?? null,
            containerNo: l.containerNo ?? null,
            estimatedDelivery: l.eta ?? null,
            cbm: l.cbm ?? null,
            containers: [{ containerNo: l.containerNo, loadingDate: l.loadingDate, eta: l.eta, qty: l.qty, arrived }],
            partiallyArrived: false,
            timeline: [
                { status: 'shipped', timestamp: l.loadingDate ?? null, location: l.containerNo, note: 'Loaded into container' },
                ...(arrived ? [{ status: 'arrived', timestamp: p.arrival?.date ?? null, location: l.containerNo, note: 'Arrived at the port' }] : []),
            ],
            dates: { intakeDate: null, shippedAt: l.loadingDate ?? null, arrivedAt: arrived ? (p.arrival?.date ?? null) : null },
            cargo: { cbm: l.cbm ?? null, description: p.productDescription ?? null },
        });
    });

    return rows;
}

// ═══════════════════════════════════════════════════
// PUBLIC / CUSTOMER endpoints
// ═══════════════════════════════════════════════════

/**
 * One customer's entry on a shared tracking number, with identifying details
 * partly masked. Shown so a customer can pick themselves out without learning
 * anyone else's name or number.
 */
export interface TrackingChoice {
    customerName: string | null;
    customerPhone: string | null;
    shippingMark: string | null;
    destinationCity: string | null;
    status: string;
}

/**
 * Public tracking page — no account needed
 * GET /api/tracking/{trackingNumber}?phone=&mark=
 *
 * A tracking number can be shared by several customers on a consolidated
 * shipment. Pass `phone` or `mark` to narrow it to one of them; without either,
 * a shared number comes back with `ambiguous: true` and masked `choices`
 * instead of somebody else's shipment.
 */
export const getPublicTracking = async (
    trackingNumber: string,
    identifier?: { phone?: string; mark?: string },
) => {
    const params: Record<string, string> = {};
    if (identifier?.phone) params.phone = identifier.phone;
    if (identifier?.mark) params.mark = identifier.mark;

    const { data: envelope } = await publicApi.get(
        `/api/v2/track/waybill/${encodeURIComponent(trackingNumber)}`,
        { params },
    );
    const d = envelope.data;
    if (d.ambiguous) {
        return {
            ambiguous: true,
            total: d.total,
            choices: (d.choices || []).map((c: any): TrackingChoice => ({
                customerName: c.name ?? null,
                customerPhone: c.phone ?? null,
                shippingMark: c.mark ?? null,
                destinationCity: null,
                status: '',
            })),
            items: [] as any[],
        };
    }
    return {
        ambiguous: false,
        total: d.total,
        items: (d.parcels || []).flatMap(parcelToRows),
    };
};

/**
 * Public: Look up all shipments for a shipping mark (no auth needed)
 * GET /api/tracking/mark/{mark}
 *
 * The only route in for customers whose sheets carried a mark rather than a
 * phone number.
 */
export const getPublicTrackingByMark = async (mark: string) => {
    const { data: envelope } = await publicApi.get(`/api/v2/track/mark/${encodeURIComponent(mark)}`);
    return { total: envelope.data.total, items: (envelope.data.parcels || []).flatMap(parcelToRows) };
};

/**
 * Public: Look up all shipments for a phone number (no auth needed)
 * GET /api/tracking/phone/{phone}
 * Returns { total, grouped: { in_warehouse, shipped, held } }
 */
export const getPublicTrackingByPhone = async (phone: string) => {
    const { data: envelope } = await publicApi.get(`/api/v2/track/phone/${encodeURIComponent(phone)}`);
    const items = (envelope.data.parcels || []).flatMap(parcelToRows);
    const grouped: Record<string, any[]> = {};
    for (const it of items) (grouped[it.status] = grouped[it.status] || []).push(it);
    return { total: envelope.data.total, grouped, items };
};

/**
 * Customers: See only your own shipments (paginated)
 * GET /api/batch-shipments/mine
 */
export const getMyShipments = async (
    _params: Record<string, any> = {},
): Promise<{ total: number; items: any[]; grouped?: Record<string, any[]> }> => {
    const { data: envelope } = await api.get('/api/v2/parcels/mine');
    const items = (envelope.data.parcels || []).flatMap(parcelToRows);
    return { total: envelope.data.total ?? items.length, items };
};

// ═══════════════════════════════════════════════════
// EMPLOYEE / ADMIN shipment endpoints
// ═══════════════════════════════════════════════════

/**
 * Employee / Admin: Paginated list of all shipment items (manually created)
 * GET /api/items?page=&limit=&status=&search=
 */
export const getAllShipments = async (params: Record<string, any> = {}) => {
    const { data: envelope } = await api.get('/api/items', { params });
    const payload = envelope?.data ?? envelope;
    if (payload && payload.items) {
        return { items: payload.items, pagination: payload.pagination };
    }
    return payload;
};

/**
 * Employee / Admin: Paginated list of all BATCH shipment items (from Excel uploads)
 * GET /api/batch-shipments?page=&limit=&status=&search=
 */
export const getBatchShipments = async (params: Record<string, any> = {}) => {
    const { data: envelope } = await api.get('/api/batch-shipments', { params });
    const payload = envelope?.data ?? envelope;
    // Backend returns { items, pagination }
    if (payload && payload.items) {
        return { items: payload.items, pagination: payload.pagination };
    }
    return payload;
};

/**
 * Employee / Admin: Create a new shipment item manually
 * POST /api/items
 */
export const createShipment = async (payload: NewShipmentPayload) => {
    const { data: envelope } = await api.post('/api/items', payload);
    return envelope.data;
};

/**
 * Employee / Admin: Update shipment item details
 * PATCH /api/items/{id}
 */
export const updateShipment = async (id: string, payload: Record<string, any>) => {
    const { data: envelope } = await api.patch(`/api/items/${id}`, payload);
    return envelope.data;
};

/**
 * Employee / Admin: Full internal detail including staff notes
 * GET /api/items/{id}/tracking
 */
export const getInternalTracking = async (id: string) => {
    const { data: envelope } = await api.get(`/api/items/${id}/tracking`);
    return envelope.data;
};

/**
 * Employee / Admin: Log a new tracking checkpoint / status update
 * POST /api/items/{id}/status
 */
export const logCheckpoint = async (id: string, payload: CheckpointPayload) => {
    const { data: envelope } = await api.post(`/api/items/${id}/status`, payload);
    return envelope.data;
};

// ═══════════════════════════════════════════════════
// DASHBOARD STATS endpoints
// ═══════════════════════════════════════════════════

/**
 * Customer dashboard stats
 * GET /api/dashboard/customer/stats
 */
export const getCustomerStats = async () => {
    const { data: envelope } = await api.get('/api/v2/parcels/mine');
    const parcels: any[] = envelope.data.parcels || [];
    const inTransit = parcels.filter((p) => p.currentStage === 'loading').length;
    const delivered = parcels.filter((p) => p.currentStage === 'arrival').length;
    const etas = parcels
        .map((p) => p.loading?.eta)
        .filter(Boolean)
        .sort();
    return {
        totalShipments: parcels.length,
        totalItems: parcels.length,
        inTransit,
        delivered,
        nextDelivery: etas[0] || null,
    };
};

/**
 * Employee dashboard stats
 * GET /api/dashboard/employee/stats
 */
export const getEmployeeStats = async () => {
    const { data: envelope } = await api.get('/api/dashboard/employee/stats');
    return envelope.data;
};

/**
 * Admin dashboard stats (users + shipments breakdown)
 * GET /api/dashboard/admin/stats
 */
export const getAdminDashboardStats = async () => {
    const { data: envelope } = await api.get('/api/dashboard/admin/stats');
    return envelope.data;
};

/**
 * Legacy: Admin stats with date range filter
 * GET /api/stats
 */
export const getAdminStats = async (params: Record<string, any> = {}) => {
    const { data: envelope } = await api.get('/api/stats', { params });
    return envelope.data;
};

/**
 * Public: Get live GPS trail for tracking
 * GET /api/tracking/{trackingNumber}/live
 */
export const getLiveTrail = async (trackingNumber: string) => {
    const { data: envelope } = await api.get(`/api/tracking/${trackingNumber}/live`);
    return envelope.data;
};

/**
 * Employee: Search customers for shipment creation
 * GET /api/admin/users?page=&limit=&role=customer&search=
 */
const extractUsersFromResponse = (envelope: any) => {
    const payload = envelope?.data ?? envelope;
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    return payload.users ?? payload.items ?? payload.data ?? [];
};

export const searchCustomers = async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    const { data: envelope } = await api.get('/api/employee/users', {
        params: {
            role: 'customer',
            limit: 10,
            search: trimmed,
            q: trimmed,
        },
    });

    const users = extractUsersFromResponse(envelope);
    if (Array.isArray(users) && users.length > 0) {
        return users;
    }

    // Fallback: if the endpoint returns no search results, load customers and filter client-side.
    const { data: fallbackEnvelope } = await api.get('/api/admin/users', {
        params: {
            role: 'customer',
            limit: 100,
        },
    });
    const allCustomers = extractUsersFromResponse(fallbackEnvelope);
    return Array.isArray(allCustomers)
        ? allCustomers.filter((user: any) => {
            const searchValue = trimmed.toLowerCase();
            return [user.name, user.email, user.phone]
                .filter(Boolean)
                .some((field: string) => field.toLowerCase().includes(searchValue));
        })
        : [];
};

// ═══════════════════════════════════════════════════
// BATCH UPLOAD endpoints (Stages 1, 2, 3)
// ═══════════════════════════════════════════════════

/**
 * Stage 1: China Intake
 * POST /api/batches/intake
 */
export const uploadBatchIntake = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data: envelope } = await api.post('/api/batches/intake', formData, {
        headers: { 'Content-Type': 'multipart/form-data' } // Re-enabling but will monitor for Network Error
    });
    return envelope.data;
};

/**
 * Stage 2: China Departure (Shipped)
 * POST /api/batches/shipped
 */
export const uploadBatchShipped = async (file: File, autoHold = false) => {
    const formData = new FormData();
    formData.append('file', file);
    // Opt-in: hold warehouse items not on this packing list (off by default).
    formData.append('autoHold', String(autoHold));
    const { data: envelope } = await api.post('/api/batches/shipped', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return envelope.data;
};

/**
 * Staff: Update a single batch shipment item's details (fill in missing / correct fields)
 * PATCH /api/batches/items/:itemId
 */
export const updateBatchItem = async (itemId: string, updates: Record<string, any>) => {
    const { data: envelope } = await api.patch(`/api/batches/items/${itemId}`, updates);
    return envelope.data;
};

/**
 * Staff: Delete a single shipment item (e.g. a row uploaded by mistake)
 * DELETE /api/batches/items/:itemId
 */
export const deleteBatchItem = async (itemId: string) => {
    const { data: envelope } = await api.delete(`/api/batches/items/${itemId}`);
    return envelope.data as { waybillNo: string };
};

/**
 * Staff: Get all items belonging to a specific batch
 * GET /api/batches/:batchId/items
 */
export const fetchBatchItems = async (batchId: string, params: Record<string, any> = {}) => {
    const { data: envelope } = await api.get(`/api/batches/${batchId}/items`, { params });
    return envelope.data;
};

/**
 * Stage 3: Ghana Arrival
 * POST /api/batches/arrived
 */
export const uploadBatchArrived = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data: envelope } = await api.post('/api/batches/arrived', formData);
    return envelope.data;
};

/**
 * Staff: Retract (delete) a wrong upload at any stage — reverses everything
 * the batch did (items, statuses, auto-created container).
 * DELETE /api/batches/:batchId
 */
export const retractBatch = async (batchId: string, force = false) => {
    const { data: envelope } = await api.delete(`/api/batches/${batchId}`, {
        params: force ? { force: true } : {},
    });
    return envelope.data as { stage: string; batchCode: string; summary: string };
};

export interface BatchSummary {
    _id: string;
    batchCode: string;
    label?: string;
    notes?: string;
    stage: 'intake' | 'shipped' | 'arrived';
    totalItems?: number;
    newItems?: number;
    matchedItems?: number;
    heldItems?: number;
    unclaimedIntake?: number;
    createdAt?: string;
    uploadedBy?: { name?: string; email?: string } | null;
    sourceFilename?: string;
}

/**
 * Staff: rename / edit notes on an upload batch, and optionally move every
 * shipment in it to one status (the upload-level equivalent of advancing a
 * container). Returns the server message too, because a bulk status change
 * reports how many items moved and how many were skipped.
 * PATCH /api/batches/:id
 */
export const updateBatch = async (
    batchId: string,
    payload: { label?: string; notes?: string; status?: string }
) => {
    const { data: envelope } = await api.patch(`/api/batches/${batchId}`, payload);
    return { batch: envelope.data as BatchSummary, message: envelope.message as string };
};

/**
 * Staff: recent upload batches (newest first), for the upload manager.
 * GET /api/batches?limit=&stage=
 */
export const getBatches = async (params: Record<string, any> = {}) => {
    const { data: envelope } = await api.get('/api/batches', { params });
    const payload = envelope?.data ?? envelope;
    return payload as { batches: BatchSummary[]; pagination?: any };
};
