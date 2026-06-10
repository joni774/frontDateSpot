# DateSpot Mobile App

Expo React Native app for discovering date spots near you.

Part of the DateSpot monorepo aligned with PRD section 9 (Expo mobile, iOS 15+, Android 10+, Google Maps Platform, i18n/RTL).

See [SETUP.md](../SETUP.md) for local workspace setup and [datespot-server/README.md](../datespot-server/README.md) for the full tech stack.

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
| `pnpm --filter mobile dev` | Start Expo dev server |
| `pnpm build` | Build all packages |

## i18n / RTL

Default language is Hebrew (`he`). Supported: Hebrew, English, Arabic (PRD 9.4).

- Locale files: `apps/mobile/src/i18n/locales/{he,en,ar}.json`
- Change language from Profile → Language
- Hebrew and Arabic enable RTL via `I18nManager.forceRTL`

## E2E Checklist

With the API running and seeded:

1. Register a new user → check server logs for generated password
2. Login → home shows places sorted by distance
3. FREE tier: first 5 places unlocked, rest show lock overlay
4. Tap a place → details, navigate, share, save
5. Profile → switch language to he/ar → verify RTL layout
6. Admin (mobile): login as `admin@datespot.co.il` / `admin123` → Profile → Admin Panel → create a place → appears in home list
