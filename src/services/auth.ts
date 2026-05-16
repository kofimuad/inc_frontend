import api from './api';

export interface PhoneCheckResult {
    exists: boolean;
    hasPassword: boolean;
    name?: string;
}

export const phoneCheck = async (phone: string): Promise<PhoneCheckResult> => {
    const { data: envelope } = await api.post('/api/auth/phone-check', { phone });
    return envelope.data;
};

export const phoneLogin = async (phone: string, password: string) => {
    const { data: envelope } = await api.post('/api/auth/phone-login', { phone, password });
    return envelope.data; // { accessToken, user }
};

export const phoneSetPassword = async (phone: string, password: string, name?: string) => {
    const { data: envelope } = await api.post('/api/auth/phone-set-password', { phone, password, name });
    return envelope.data; // { accessToken, user }
};

export const phoneSignup = async (phone: string, name: string, password: string) => {
    const { data: envelope } = await api.post('/api/auth/phone-signup', { phone, name, password });
    return envelope.data; // { accessToken, user }
};
