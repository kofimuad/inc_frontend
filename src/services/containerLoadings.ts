import axios from "axios";
import api from "./api";

// Plain axios instance for public endpoints — bypasses the auth token refresh
// interceptors so unauthenticated visitors can still load container data.
const publicApi = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: { "Content-Type": "application/json" },
});

export interface ContainerLoading {
    _id: string;
    containerNumber: string;
    vesselName?: string;
    blNumber?: string;
    sealNumber?: string;
    volume?: string;
    portOfLoading: string;
    portOfDischarge: string;
    loadingDate?: string;
    etd?: string;
    eta?: string;
    actualArrivalDate?: string;
    status: "loading" | "shipped" | "at_port" | "arrived" | "ready";
    notes?: string;
    staffNotes?: string;
    batchRef?: any;
    createdBy?: any;
    createdAt: string;
    updatedAt: string;
}

export interface ContainerItem {
    waybillNo: string;
    customerName: string;
    destinationCity: string;
    productDescription: string;
    quantity: number;
    status: string;
    updatedAt: string;
}

export interface ContainerSearchResult {
    containers: ContainerLoading[];
    /**
     * A tracking number shared by several customers has no single shipment
     * behind it, so `item` is null unless the caller identified themselves with
     * a phone or shipping mark. The container is still returned — it is common
     * to everyone on the number and reveals nothing about any one customer.
     */
    waybillMatch: {
        item: ContainerItem | null;
        container: ContainerLoading;
        sharedBy: number;
        ambiguous: boolean;
    } | null;
}

export async function listContainerLoadings(params?: { page?: number; limit?: number; status?: string }) {
    const { data } = await publicApi.get("/api/container-loadings", { params });
    return data.data as { containers: ContainerLoading[]; pagination: any };
}

/**
 * Pass the customer's phone or shipping mark when they gave one — without it a
 * tracking number covering several customers resolves to no shipment at all.
 */
export async function searchContainerLoadings(
    q: string,
    identifier?: { phone?: string; mark?: string },
) {
    const params: Record<string, string> = { q };
    if (identifier?.phone) params.phone = identifier.phone;
    if (identifier?.mark) params.mark = identifier.mark;

    const { data } = await publicApi.get("/api/container-loadings/search", { params });
    return data.data as ContainerSearchResult;
}

export async function getContainerLoading(id: string) {
    const { data } = await api.get(`/api/container-loadings/${id}`);
    return data.data as { container: ContainerLoading; items: ContainerItem[] };
}

export async function listContainerLoadingsStaff(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    const { data } = await api.get("/api/container-loadings/staff/list", { params });
    return data.data as { containers: ContainerLoading[]; pagination: any };
}

export async function createContainerLoading(payload: Partial<ContainerLoading>) {
    const { data } = await api.post("/api/container-loadings", payload);
    return data.data as ContainerLoading;
}

/**
 * Staff: update a container. Changing its status moves every shipment loaded in
 * it, so the server message reports what was synced and what was skipped —
 * return it alongside the record.
 */
export async function updateContainerLoading(id: string, payload: Partial<ContainerLoading>) {
    const { data } = await api.patch(`/api/container-loadings/${id}`, payload);
    return { container: data.data as ContainerLoading, message: data.message as string };
}

/**
 * Staff: every shipment on this container — those assigned by container ref
 * (including ones attached by hand from the Goods Received tab) plus those from
 * the packing list that created it.
 * GET /api/container-loadings/:id/items
 */
export async function listContainerItems(id: string, params?: { status?: string }) {
    const { data } = await api.get(`/api/container-loadings/${id}/items`, { params });
    return data.data as { items: any[]; total: number };
}

export async function deleteContainerLoading(id: string) {
    const { data } = await api.delete(`/api/container-loadings/${id}`);
    return data.data as { containerNumber: string; clearedItems: number };
}
