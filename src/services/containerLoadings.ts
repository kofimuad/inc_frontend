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
    status: "loading" | "shipped" | "arrived" | "ready";
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
    waybillMatch: { item: ContainerItem; container: ContainerLoading } | null;
}

export async function listContainerLoadings(params?: { page?: number; limit?: number; status?: string }) {
    const { data } = await publicApi.get("/api/container-loadings", { params });
    return data.data as { containers: ContainerLoading[]; pagination: any };
}

export async function searchContainerLoadings(q: string) {
    const { data } = await publicApi.get("/api/container-loadings/search", { params: { q } });
    return data.data as ContainerSearchResult;
}

export async function getContainerLoading(id: string) {
    const { data } = await api.get(`/api/container-loadings/${id}`);
    return data.data as { container: ContainerLoading; items: ContainerItem[] };
}

export async function listContainerLoadingsStaff(params?: { page?: number; limit?: number; status?: string }) {
    const { data } = await api.get("/api/container-loadings/staff/list", { params });
    return data.data as { containers: ContainerLoading[]; pagination: any };
}

export async function createContainerLoading(payload: Partial<ContainerLoading>) {
    const { data } = await api.post("/api/container-loadings", payload);
    return data.data as ContainerLoading;
}

export async function updateContainerLoading(id: string, payload: Partial<ContainerLoading>) {
    const { data } = await api.patch(`/api/container-loadings/${id}`, payload);
    return data.data as ContainerLoading;
}

export async function deleteContainerLoading(id: string) {
    const { data } = await api.delete(`/api/container-loadings/${id}`);
    return data.data as { containerNumber: string; clearedItems: number };
}
