import api from './api';

// ═══════════════════════════════════════════════════
// ADMIN - User Management
// ═══════════════════════════════════════════════════

/**
 * List all users (admin only)
 * GET /api/admin/users?page=&limit=&role=&search=
 */
export const getUsers = async (params: Record<string, any> = {}) => {
    const { data: envelope } = await api.get('/api/admin/users', { params });
    return envelope.data;
};

/**
 * Create a new user (admin only)
 * POST /api/admin/users
 */
export const createUser = async (payload: {
    name: string;
    email: string;
    password: string;
    role: 'customer' | 'employee' | 'admin';
    phone?: string;
    isVerified?: boolean;
    isActive?: boolean;
}) => {
    const { data: envelope } = await api.post('/api/admin/users', payload);
    return envelope.data;
};

/**
 * Update a user (admin only)
 * PATCH /api/admin/users/{id}
 */
export const updateUser = async (id: string, payload: {
    name?: string;
    phone?: string;
    role?: 'customer' | 'employee' | 'admin';
    isActive?: boolean;
    isVerified?: boolean;
}) => {
    const { data: envelope } = await api.patch(`/api/admin/users/${id}`, payload);
    return envelope.data;
};

// ═══════════════════════════════════════════════════
// ADMIN - Audit Logs
// ═══════════════════════════════════════════════════

/**
 * Get audit logs (admin only)
 * GET /api/admin/audit-logs?page=&limit=
 */
export const getAuditLogs = async (params: Record<string, any> = {}) => {
    const { data: envelope } = await api.get('/api/admin/audit-logs', { params });
    return envelope.data;
};

// ═══════════════════════════════════════════════════
// ADMIN - GPS Devices
// ═══════════════════════════════════════════════════

/**
 * List all GPS devices (admin only)
 * GET /api/admin/devices
 */
export const getGpsDevices = async () => {
    const { data: envelope } = await api.get('/api/admin/devices');
    return envelope.data;
};

/**
 * Assign GPS device to shipment (admin only)
 * POST /api/admin/devices/{deviceId}/assign
 */
export const assignGpsDevice = async (deviceId: string, shipmentId: string) => {
    const { data: envelope } = await api.post(`/api/admin/devices/${deviceId}/assign`, { shipmentId });
    return envelope.data;
};

/**
 * Unassign GPS device from shipment (admin only)
 * POST /api/admin/devices/{deviceId}/unassign
 */
export const unassignGpsDevice = async (deviceId: string) => {
    const { data: envelope } = await api.post(`/api/admin/devices/${deviceId}/unassign`);
    return envelope.data;
};

// ═══════════════════════════════════════════════════
// ADMIN - Maintenance
// ═══════════════════════════════════════════════════

/**
 * Trigger database cleanup (admin only)
 * POST /api/admin/cleanup
 */
export const triggerCleanup = async () => {
    const { data: envelope } = await api.post('/api/admin/cleanup');
    return envelope.data;
};

/**
 * DESTRUCTIVE — permanently delete ALL operational data (shipment items,
 * batches, container loadings). Admin only. Requires the exact confirm phrase.
 * POST /api/admin/purge-operational-data
 */
export const PURGE_CONFIRM_PHRASE = "DELETE ALL DATA";

export const purgeOperationalData = async (confirm: string) => {
    const { data: envelope } = await api.post('/api/admin/purge-operational-data', { confirm });
    return envelope.data;
};
