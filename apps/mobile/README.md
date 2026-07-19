# Mobile App (`mobile`)

Expo React Native app for discovering date spots. Uses Expo Router, NativeWind, React Query, and i18next.

## Stack

- Expo ~54, React Native 0.81, React 19
- Expo Router (file-based routing)
- NativeWind + Tailwind CSS
- TanStack React Query
- i18next / react-i18next (Hebrew default, RTL for `he` and `ar`)
- `@datespot/api-client`, `@datespot/ui`, `@datespot/shared-types`

## Directory structure

```
apps/mobile/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root: QueryClient, i18n, auth guard, API base URL
│   ├── index.tsx           # Entry redirect
│   ├── auth/               # login, register
│   └── (app)/              # Authenticated routes
│       ├── home.tsx
│       ├── profile.tsx
│       ├── saved.tsx
│       ├── subscription.tsx
│       ├── change-password.tsx
│       ├── place/[id].tsx
│       └── admin/          # In-app admin panel
├── src/
│   ├── i18n/               # i18n setup + locales (he, en, ar)
│   ├── theme/              # App-specific colors
│   └── components/         # App-only components (e.g. backgrounds)
└── scripts/                # Expo start / QR helpers
```

## Environment

Copy `.env.example` to `.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes | API base URL (`http://localhost:3000` for emulator) |
| `EXPO_PUBLIC_GOOGLE_MAPS_KEY` | Yes | Google Maps Platform key |

**Physical device:** use your computer's LAN IP instead of `localhost`, e.g. `http://192.168.1.10:3000`.

**Production:** see `.env.production.example`.

The root layout calls `configureApiBaseUrl()` on startup using `EXPO_PUBLIC_API_URL`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` / `pnpm dev:lan` | Start Expo on LAN |
| `pnpm dev:tunnel` | Start Expo via tunnel |
| `pnpm dev:web` | Start Expo web on port 8081 (used by Playwright) |
| `pnpm print-qr` | Print QR code to terminal |
| `pnpm build` | Typecheck (`tsc --noEmit`) |
| `pnpm lint` | Same as build |

From repo root: `pnpm --filter mobile dev`.

## E2E

E2E tests (Playwright web + Maestro native) live in the sibling [`e2e/`](../../../e2e/) repo — see [e2e/README.md](../../../e2e/README.md).

Web tests need the API on `localhost:3000`. Maestro needs a dev build (`pnpm exec expo run:android`) and `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000` on Android emulator.

## Conventions

- **Routing:** add screens under `app/` following Expo Router conventions
- **HTTP:** use `@datespot/api-client` functions; do not create new Axios instances in screens
- **Strings:** use i18n keys from `src/i18n/locales/`; support `he`, `en`, and `ar`
- **RTL:** test layout changes with Hebrew or Arabic enabled (Profile → Language)
- **Shared UI:** use `Button`, `Input`, `PlaceCard` from `@datespot/ui` when applicable
- **Admin:** admin screens live under `app/(app)/admin/`; require admin user (`isAdmin`)

## Related docs

- [Client architecture](../../docs/ARCHITECTURE.md)
- [API client](../../packages/api-client/README.md)
- [Root README](../../README.md) — setup and E2E testing
