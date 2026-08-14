import axios, { InternalAxiosRequestConfig, AxiosError } from "axios";

import { ACCESS_TOKEN_KEY } from "@/config/constants";

// Persist access token in localStorage so it survives page reloads
const getStoredToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
};

const setStoredToken = (token: string | null): void => {
    if (typeof window === 'undefined') return;
    if (token) {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
};

export const setAccessToken = (token: string | null) => {
    setStoredToken(token);
};

export const getAccessToken = (): string | null => {
    return getStoredToken();
};

// Decode JWT exp claim without verifying signature (client-side only)
function getTokenExpiry(token: string): number | null {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return typeof payload.exp === 'number' ? payload.exp : null;
    } catch {
        return null;
    }
}

// Returns true if the token is expired or will expire within bufferSeconds.
// A token with no readable exp is treated as expired rather than valid — it
// cannot be trusted, and assuming it is good means never attempting a refresh.
function isTokenExpiredOrExpiringSoon(token: string, bufferSeconds = 60): boolean {
    const exp = getTokenExpiry(token);
    if (!exp) return true;
    return Date.now() / 1000 >= exp - bufferSeconds;
}

// ─── Session expiry notification ──────────────────────────────────────────────
//
// When the refresh token is gone the session is genuinely over, and the app has
// to be told. Without this the access token was cleared while AuthContext still
// held a user, so protected pages kept rendering, every request 401'd, and the
// dashboard sat empty with nothing explaining why.

type SessionExpiredHandler = () => void;
const sessionExpiredHandlers = new Set<SessionExpiredHandler>();

/** Subscribe to session expiry. Returns an unsubscribe function. */
export const onSessionExpired = (handler: SessionExpiredHandler): (() => void) => {
    sessionExpiredHandlers.add(handler);
    return () => { sessionExpiredHandlers.delete(handler); };
};

// Guards against a burst of in-flight requests each announcing the same expiry
// and each retrying the dead refresh endpoint.
let sessionIsOver = false;

const notifySessionExpired = () => {
    if (sessionIsOver) return;
    sessionIsOver = true;
    setStoredToken(null);
    sessionExpiredHandlers.forEach((handler) => {
        try { handler(); } catch { /* a bad subscriber must not break the rest */ }
    });
};

/** Called after a successful login so the next expiry is announced again. */
export const resetSessionExpiry = () => { sessionIsOver = false; };

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true, // Crucial for sending httpOnly refresh cookies
    headers: {
        "Content-Type": "application/json",
    },
});

// Variables to handle multiple simultaneous requests when token expires
let isRefreshing = false;
// Queued waiters resolve with null when the refresh failed, so callers must
// handle the absence of a token rather than interpolating it into a header.
let failedQueue: { resolve: (token: string | null) => void; reject: (error: any) => void; }[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

async function doRefresh(): Promise<string> {
    const response = await axios.post(
        `${api.defaults.baseURL}/api/auth/refresh`,
        {},
        { withCredentials: true }
    );
    const newToken = response.data?.data?.accessToken || response.data?.accessToken;
    if (!newToken) throw new Error("No token received from refresh endpoint");
    setAccessToken(newToken);
    // A refresh that succeeds means the session is alive again.
    sessionIsOver = false;
    return newToken;
}

// Request interceptor — proactively refresh if the token is expired/expiring soon
// so requests never hit the server with a stale token.
api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        // Skip refresh logic for the auth endpoints themselves
        const url = config.url ?? '';
        const isAuthEndpoint = url.includes('/api/auth/refresh') || url.includes('/api/auth/login');

        if (!isAuthEndpoint) {
            let token = getAccessToken();

            if (token && isTokenExpiredOrExpiringSoon(token)) {
                if (isRefreshing) {
                    // Another request is already refreshing — wait for it
                    token = await new Promise<string | null>((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    }).catch(() => null);
                } else {
                    isRefreshing = true;
                    try {
                        token = await doRefresh();
                        processQueue(null, token);
                    } catch (err) {
                        // The request still goes out unauthenticated, because public
                        // endpoints (tracking, container lookups) share this client
                        // and must keep working for a signed-out visitor. What
                        // changes is that the app is now told the session is over,
                        // so protected pages stop rendering an empty shell.
                        processQueue(null, null);
                        notifySessionExpired();
                        token = null;
                    } finally {
                        isRefreshing = false;
                    }
                }
            }

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        // Fix for multipart/form-data: let the browser set Content-Type with boundary
        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — last-resort 401 handler for edge cases the request
// interceptor couldn't catch (e.g. clock skew, server-side token invalidation).
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        const isAuthEndpoint = originalRequest?.url?.includes('/api/auth/login') ||
                               originalRequest?.url?.includes('/api/auth/refresh');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            // Once the session is known to be over, stop hammering the refresh
            // endpoint — otherwise every in-flight request retries it in turn,
            // since each carries its own _retry flag.
            if (sessionIsOver) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise<string | null>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    // The refresh may have failed, in which case there is no
                    // token. Interpolating one here produced the literal header
                    // "Bearer null", guaranteeing another 401.
                    if (token) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    } else {
                        delete originalRequest.headers.Authorization;
                    }
                    return api(originalRequest);
                }).catch(() => Promise.reject(error));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const newToken = await doRefresh();
                processQueue(null, newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(null, null);
                notifySessionExpired();
                // Reject with the original 401 error so callers see the real failure
                return Promise.reject(error);
            } finally {
                isRefreshing = false;
            }
        }

        if (error.response?.status === 500) {
            console.error("API 500 Error Body:", error.response.data);
            console.error("API 500 Request URL:", originalRequest?.url);
        }

        return Promise.reject(error);
    }
);

export default api;
