import api from './api';

export interface AppSettings {
    /** Accra / default rate per CBM (USD) — also used when location is blank/unknown */
    cbmRate: number;
    /** Shared rate for Kumasi & Takoradi */
    cbmRateKumasiTakoradi: number;
    /** Tamale-specific rate */
    cbmRateTamale: number;
    usdToGhsRate: number;
    minFeeUsd: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
    cbmRate: 230,
    cbmRateKumasiTakoradi: 230,
    cbmRateTamale: 230,
    usdToGhsRate: 15.2,
    minFeeUsd: 3,
};

/**
 * Delivery-location options offered in the calculator. Blank/unknown → Accra.
 * Kumasi & Takoradi share a rate; Tamale has its own.
 */
export const LOCATION_OPTIONS = ["Accra", "Kumasi", "Takoradi", "Tamale"] as const;

/** Resolve the CBM rate that applies to a given delivery location. */
export const resolveCbmRate = (location: string | null | undefined, settings: AppSettings): number => {
    const norm = (location ?? "").trim().toUpperCase();
    if (norm === "KUMASI" || norm === "TAKORADI") return settings.cbmRateKumasiTakoradi ?? settings.cbmRate;
    if (norm === "TAMALE") return settings.cbmRateTamale ?? settings.cbmRate;
    return settings.cbmRate;
};

export const getSettings = async (): Promise<AppSettings> => {
    const { data: envelope } = await api.get('/api/settings');
    return { ...DEFAULT_SETTINGS, ...envelope.data };
};

export const updateSettings = async (payload: Partial<AppSettings>): Promise<AppSettings> => {
    const { data: envelope } = await api.put('/api/settings', payload);
    return { ...DEFAULT_SETTINGS, ...envelope.data };
};
