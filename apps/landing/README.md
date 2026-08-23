# DateSpot Landing

Marketing landing page for DateSpot (Hebrew RTL). Vite + React + TypeScript.

Standalone app — no dependency on `@datespot/ui`, `api-client`, or the mobile Expo app.

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
