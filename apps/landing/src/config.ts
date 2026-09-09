/**
 * Public URLs for the landing page.
 * Store listing URLs — set when App Store / Google Play are live.
 *
 * API: same Railway production host the TestFlight / store app uses.
 * Override at build time with VITE_API_URL (staging build, local, etc.).
 */
export const siteUrl = "https://datespot.co.il";

export const apiUrl = (
  import.meta.env.VITE_API_URL ??
  "https://datespot-server-production-ecb2.up.railway.app"
).replace(/\/$/, "");

export const contactEmail = "support@datespot.co.il";

export const storeLinks = {
  appStoreUrl: null as string | null,
  playStoreUrl: null as string | null,
} as const;
