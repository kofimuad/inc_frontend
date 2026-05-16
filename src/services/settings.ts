import api from './api';

export interface AppSettings {
    cbmRate: number;
    usdToGhsRate: number;
}

export const getSettings = async (): Promise<AppSettings> => {
    const { data: envelope } = await api.get('/api/settings');
    return envelope.data;
};

export const updateSettings = async (payload: Partial<AppSettings>): Promise<AppSettings> => {
    const { data: envelope } = await api.put('/api/settings', payload);
    return envelope.data;
};
