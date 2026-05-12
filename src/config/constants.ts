/**
 * Global application constants and configuration mappings.
 * Aligns frontend structure with the backend's Clean Architecture approach.
 */

export const ACCESS_TOKEN_KEY = 'access_token';

export const SHIPMENT_STATUSES = {
    // Traditional flow
    PENDING: 'pending',
    PICKED_UP: 'picked_up',
    IN_TRANSIT: 'in_transit',
    CUSTOMS: 'customs',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    FAILED: 'failed',
    RETURNED: 'returned',
    // Batch workflow
    IN_WAREHOUSE: 'in_warehouse',
    SHIPPED: 'shipped',
    HELD: 'held',
} as const;

export const STATUS_LABELS: Record<string, string> = {
    [SHIPMENT_STATUSES.PENDING]: 'Pending',
    [SHIPMENT_STATUSES.PICKED_UP]: 'Picked Up',
    [SHIPMENT_STATUSES.IN_TRANSIT]: 'In Transit',
    [SHIPMENT_STATUSES.CUSTOMS]: 'Customs Clearance',
    [SHIPMENT_STATUSES.OUT_FOR_DELIVERY]: 'Out for Delivery',
    [SHIPMENT_STATUSES.DELIVERED]: 'Delivered',
    [SHIPMENT_STATUSES.FAILED]: 'Failed',
    [SHIPMENT_STATUSES.RETURNED]: 'Returned',
    [SHIPMENT_STATUSES.IN_WAREHOUSE]: 'In Warehouse',
    [SHIPMENT_STATUSES.SHIPPED]: 'Shipped',
    [SHIPMENT_STATUSES.HELD]: 'On Hold',
};

export const STATUS_COLORS: Record<string, string> = {
    [SHIPMENT_STATUSES.PENDING]: 'bg-yellow-100 text-yellow-700',
    [SHIPMENT_STATUSES.PICKED_UP]: 'bg-indigo-100 text-indigo-700',
    [SHIPMENT_STATUSES.IN_TRANSIT]: 'bg-blue-100 text-blue-700',
    [SHIPMENT_STATUSES.CUSTOMS]: 'bg-purple-100 text-purple-700',
    [SHIPMENT_STATUSES.OUT_FOR_DELIVERY]: 'bg-cyan-100 text-cyan-700',
    [SHIPMENT_STATUSES.DELIVERED]: 'bg-green-100 text-green-700',
    [SHIPMENT_STATUSES.FAILED]: 'bg-red-100 text-red-700',
    [SHIPMENT_STATUSES.RETURNED]: 'bg-orange-100 text-orange-700',
    [SHIPMENT_STATUSES.IN_WAREHOUSE]: 'bg-amber-100 text-amber-700',
    [SHIPMENT_STATUSES.SHIPPED]: 'bg-sky-100 text-sky-700',
    [SHIPMENT_STATUSES.HELD]: 'bg-teal-100 text-teal-700',
    default: 'bg-slate-100 text-slate-700',
};

export const USER_ROLES = {
    ADMIN: 'admin',
    EMPLOYEE: 'employee',
    CUSTOMER: 'customer',
} as const;

export const ROLE_BADGE_COLORS: Record<string, string> = {
    [USER_ROLES.ADMIN]: 'bg-purple-100 text-purple-700',
    [USER_ROLES.EMPLOYEE]: 'bg-blue-100 text-blue-700',
    [USER_ROLES.CUSTOMER]: 'bg-slate-100 text-slate-700',
};
