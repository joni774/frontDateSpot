# DateSpot Landing

Marketing landing page for DateSpot (Hebrew RTL). Vite + React + TypeScript.

Standalone app — no dependency on `@datespot/ui`, `api-client`, or the mobile Expo app.

Production API (Railway `datespot-production`): `https://datespot-server-production-ecb2.up.railway.app`.
Override with `VITE_API_URL` at build time if you need staging.

## Commands

From the monorepo root (`datespot-client/`):

```bash
pnpm install
pnpm dev:landing
```

Or from this folder:

```bash
pnpm dev      # http://localhost:5173
pnpm build
pnpm preview
```

## Pages

- `/` — Hero, Features, How it works, FAQ, CTA.
- `/privacy.html` — Privacy policy.
- `/terms.html` — Terms of use.

Contact email (`support@datespot.co.il`) is set in [`src/config.ts`](src/config.ts) and used for the footer "יצירת קשר" link and legal pages.

## Store links

When App Store / Google Play URLs are ready, set them in [`src/config.ts`](src/config.ts):

```ts
export const storeLinks = {
  appStoreUrl: "https://apps.apple.com/...",
  playStoreUrl: "https://play.google.com/...",
} as const;
```

While either value is `null`, the matching button stays disabled with a **בקרוב** badge.

## Brand

Colors match the mobile brand palette (`#7C3048` wine, stone neutrals, cool slate accent). Typography: Frank Ruhl Libre (display) + Heebo (body).
