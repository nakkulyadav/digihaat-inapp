// ─── Data Source Settings ────────────────────────────────────────────────────
//
// These are the three values you need to change when wiring up production.
// See README.md § "The three things you must wire up for production" for details.

// The Google Sheets document ID — read from VITE_SHEET_ID in .env.
// See .env.example for the required format.
export const SHEET_ID = import.meta.env.VITE_SHEET_ID;

// GID of the single sheet tab containing all rows (all categories in one place).
// The first/default tab is always "0". Override via VITE_SHEET_GID in .env.
export const SHEET_GID = import.meta.env.VITE_SHEET_GID ?? "0";

// Controls whether catalogue data is synthesised locally ('mock') or fetched
// from the live API ('live'). Switch to 'live' once CATALOGUE_ENDPOINT is set
// and CORS is handled via a proxy.
// Allowed values: 'mock' | 'live'
export const DATA_MODE = "mock";

// Base URL for the CORS proxy in front of the ONDC catalogue API.
// Example: "https://your-proxy.vercel.app/catalogue/item"
// Leave empty while DATA_MODE is 'mock'.
export const CATALOGUE_ENDPOINT = "";

// Base URL for the Vercel serverless function that proxies brand logo images
// from storage.googleapis.com to avoid canvas taint on export.
// Defaults to /api/proxy-image (same-origin on Vercel).
export const IMAGE_PROXY_ENDPOINT = import.meta.env.VITE_IMAGE_PROXY_ENDPOINT || "/api/proxy-image";

// Base URL for the Vercel serverless function that fetches the provider logo URL
// from Digihaat's analytics API server-side (avoids CORS block on prod.digihaat.in).
// Defaults to /api/provider-logo (same-origin on Vercel).
export const PROVIDER_LOGO_ENDPOINT = import.meta.env.VITE_PROVIDER_LOGO_ENDPOINT || "/api/provider-logo";
