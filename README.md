# DateSpot Client

pnpm + Turborepo monorepo for the DateSpot mobile app and shared client packages.

Expo React Native app for discovering date spots near you. Aligned with PRD section 9 (Expo mobile, iOS 15+, Android 10+, Google Maps Platform, i18n/RTL).

See [datespot-server/README.md](../datespot-server/README.md) for the API backend, Docker setup, and full tech stack.

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Monorepo map, dependencies, where to change what |
| [AGENTS.md](AGENTS.md) | Instructions for AI coding agents |
| [apps/mobile/README.md](apps/mobile/README.md) | Mobile app routes, stack, env, scripts |
| [packages/api-client/README.md](packages/api-client/README.md) | HTTP client and API wrappers |
| [packages/ui/README.md](packages/ui/README.md) | Shared UI components |
| [packages/shared-types/README.md](packages/shared-types/README.md) | TypeScript types (synced with server) |

## Prerequisites

- Node.js 20+
- pnpm 9+
- Expo Go on your phone (for physical device testing)
- DateSpot API running locally or on Railway (see [datespot-server](../datespot-server/README.md))
- Google Maps Platform API key (PRD 9.2)

## Setup

```bash
pnpm install
cp apps/mobile/.env.example apps/mobile/.env
pnpm --filter mobile dev
```

Scan the QR code with Expo Go.

## Environment

Edit `apps/mobile/.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes | API base URL. Use `http://localhost:3000` for emulator/simulator |
| `EXPO_PUBLIC_GOOGLE_MAPS_KEY` | Yes (PRD) | Google Maps Platform key — [Google Cloud Console](https://console.cloud.google.com/google/maps-apis). Enable Maps SDK for Android/iOS. |

**Physical device:** replace `localhost` with your computer's LAN IP, e.g. `http://192.168.1.10:3000`.

**Production (Railway):** set to your deployed API URL:

```env
EXPO_PUBLIC_API_URL=https://your-app.up.railway.app
```

See `apps/mobile/.env.production.example` for a template.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Expo dev server (LAN) |
| `pnpm dev:lan` | Same as `dev` |
| `pnpm dev:tunnel` | Start Expo via tunnel |
| `pnpm --filter mobile dev` | Start mobile only |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |

E2E tests moved to the sibling [`e2e/`](../e2e/) repo — see [e2e/README.md](../e2e/README.md).

## i18n / RTL

Default language is Hebrew (`he`). Supported: Hebrew, English, Arabic (PRD 9.4).

- Locale files: `apps/mobile/src/i18n/locales/{he,en,ar}.json`
- Change language from Profile → Language
- Hebrew and Arabic enable RTL via `I18nManager.forceRTL`

## E2E Testing

Automated smoke tests live in the sibling [`e2e/`](../e2e/) repo: API smoke, Playwright web, and Maestro mobile flows.

| Layer | Tool | Docs |
|-------|------|------|
| API + web | Playwright + API verify | [e2e/README.md](../e2e/README.md) |
| Native | Maestro | [e2e/README.md](../e2e/README.md#mobile-maestro) |

**CI:** pull requests on the `datespot-e2e` repo run API + Playwright via [e2e/.github/workflows/e2e.yml](../e2e/.github/workflows/e2e.yml).

### Quick start (local)

```bash
# From e2e/ (sibling of datespot-client and datespot-server)
cd ../e2e
pnpm install
pnpm exec playwright install chromium   # once
pnpm stack:up
pnpm e2e
```

**Seed credentials:** admin `admin@datespot.co.il` / `admin123`; free-tier `free@datespot.co.il` / `free123`.

### Manual checklist (optional)

With the API running and seeded:

1. Register a new user → check server logs for generated password
2. Login → home shows places sorted by distance
3. FREE tier: first 5 places unlocked, rest show lock overlay
4. Tap a place → details, navigate, share, save
5. Profile → switch language to he/ar → verify RTL layout
6. Admin (mobile): login as admin → Profile → Admin Panel → create a place → appears in home list
