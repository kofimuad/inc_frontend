"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";

export const useTracking = (trackingNumber: string) => {
    const [trackingData, setTrackingData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTracking = async (num: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const { data: envelope } = await api.get(`/api/tracking/${num}`);
            // Backend returns { success, message, data: { shipment, events } }
            setTrackingData(envelope.data);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || "Failed to fetch tracking data";
            setError(msg);
            console.error("Tracking fetch error", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (trackingNumber) {
            fetchTracking(trackingNumber);
        }
    }, [trackingNumber]);

    return { trackingData, isLoading, error, refetch: () => fetchTracking(trackingNumber) };
};
