export interface TickerItem {
    id: string;
    type: "news" | "rate";
    text: string;
}

// Fallback shown before the server settings load, or if they come back
// empty/unset. The ticker itself is persisted server-side via
// /api/settings (tickerItems) so an admin's edit reaches every visitor —
// see services/settings.ts. This file previously read/wrote localStorage,
// which is why ticker edits never left the admin's own browser.
export const DEFAULT_TICKER_ITEMS: TickerItem[] = [
    { id: "1", type: "news", text: "Port of Tema expands capacity for 2026 shipments." },
    { id: "2", type: "rate", text: "USD: 12.45 GHC" },
    { id: "3", type: "news", text: "New direct shipping route from Shenzhen to Accra launched." },
    { id: "4", type: "rate", text: "EUR: 13.52 GHC" },
    { id: "5", type: "news", text: "Clinette Logistics wins 'Best Clearing Agent' award." },
    { id: "6", type: "rate", text: "RMB: 1.72 GHC" },
    { id: "7", type: "news", text: "Holiday Schedule: Port operations remain open 24/7." },
];

export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
