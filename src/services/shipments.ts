import api from './api';
import { 
    ShipmentItem, 
    NewShipmentPayload, 
    CheckpointPayload, 
    PaginatedResponse 
} from '@/types/shipment';

// ═══════════════════════════════════════════════════
// PUBLIC / CUSTOMER endpoints
// ═══════════════════════════════════════════════════

/**
 * Public tracking page — no account needed
 * GET /api/tracking/{trackingNumber}
 * Returns { shipment, events }
 */
export const getPublicTracking = async (trackingNumber: string) => {
    const { data: envelope } = await api.get(`/api/tracking/${trackingNumber}`);
    return envelope.data;
};

/**
 * Customers: See only your own shipments (paginated)
 * GET /api/batch-shipments/mine
 */
export const getMyShipments = async (params: Record<string, any> = {}) => {
    const { data: envelope } = await api.get('/api/batch-shipments/mine', { params });
    return envelope.data;
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
    const { data: envelope } = await api.get('/api/dashboard/customer/stats');
    return envelope.data;
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
export const uploadBatchShipped = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
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
