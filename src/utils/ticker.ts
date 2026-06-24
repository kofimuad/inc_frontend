export interface TickerItem {
    id: string;
    type: "news" | "rate";
    text: string;
}

export const DEFAULT_TICKER_ITEMS: TickerItem[] = [
    { id: "1", type: "news", text: "Port of Tema expands capacity for 2026 shipments." },
    { id: "2", type: "rate", text: "USD: 12.45 GHC" },
    { id: "3", type: "news", text: "New direct shipping route from Shenzhen to Accra launched." },
    { id: "4", type: "rate", text: "EUR: 13.52 GHC" },
    { id: "5", type: "news", text: "Clinette Logistics wins 'Best Clearing Agent' award." },
    { id: "6", type: "rate", text: "RMB: 1.72 GHC" },
    { id: "7", type: "news", text: "Holiday Schedule: Port operations remain open 24/7." },
];

const STORAGE_KEY = "inc_ticker_items";

export function getTickerItems(): TickerItem[] {
    if (typeof window === "undefined") return DEFAULT_TICKER_ITEMS;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_TICKER_ITEMS;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        return DEFAULT_TICKER_ITEMS;
    } catch {
        return DEFAULT_TICKER_ITEMS;
    }
}

export function saveTickerItems(items: TickerItem[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    // Emit a custom event so the Navbar re-renders immediately
    window.dispatchEvent(new Event("ticker-updated"));
}

export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
