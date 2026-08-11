import { STATUS_LABELS, SHIPMENT_STATUSES } from "./constants";

/**
 * The statuses staff may set by hand — on a single shipment, or in bulk from an
 * upload / container card. Mirrors MANUAL_ITEM_STATUSES in the backend's
 * services/logistics.service.js; keep the two in step.
 *
 * Ordered along the real journey: China warehouse → sea → Tema Port → cleared →
 * collected, with the exception states last.
 */
export const MANUAL_STATUSES = [
    SHIPMENT_STATUSES.IN_WAREHOUSE,
    SHIPMENT_STATUSES.SHIPPED,
    SHIPMENT_STATUSES.AT_PORT,
    SHIPMENT_STATUSES.CUSTOMS,
    SHIPMENT_STATUSES.READY_FOR_PICKUP,
    SHIPMENT_STATUSES.OUT_FOR_DELIVERY,
    SHIPMENT_STATUSES.DELIVERED,
    SHIPMENT_STATUSES.HELD,
    SHIPMENT_STATUSES.RETURNED,
    SHIPMENT_STATUSES.FAILED,
] as const;

export interface StatusOption { value: string; label: string }

export const STATUS_OPTIONS: StatusOption[] = MANUAL_STATUSES.map((value) => ({
    value,
    label: STATUS_LABELS[value] ?? value,
}));

/**
 * States a bulk change refuses to overwrite — the backend skips these and
 * reports how many it left alone (PROTECTED_ITEM_STATUSES).
 */
export const PROTECTED_STATUSES: string[] = [
    SHIPMENT_STATUSES.HELD,
    SHIPMENT_STATUSES.DELIVERED,
    SHIPMENT_STATUSES.RETURNED,
    SHIPMENT_STATUSES.FAILED,
];

/** How a container's status lands on the shipments loaded in it. */
export const CONTAINER_TO_ITEM_STATUS: Record<string, string> = {
    loading: SHIPMENT_STATUSES.IN_WAREHOUSE,
    shipped: SHIPMENT_STATUSES.SHIPPED,
    at_port: SHIPMENT_STATUSES.AT_PORT,
    arrived: SHIPMENT_STATUSES.CUSTOMS,
    ready:   SHIPMENT_STATUSES.READY_FOR_PICKUP,
};
