# @datespot/ui

Shared React Native UI components for the DateSpot mobile app.

## Exports

From `src/index.ts`:

- `Button` — primary action button
- `Input` — text input field
- `PlaceCard` — place list card with image, name, category, distance

Component implementations live in `src/components/`.

## Theme

Shared colors: `src/theme/colors.ts`

The mobile app also has app-specific theme values in `apps/mobile/src/theme/colors.ts`. Prefer `@datespot/ui` theme for shared components; extend in mobile only when the design is app-specific.

## Conventions

- **Presentational only** — no API calls, no navigation, no AsyncStorage
- **Peer dependencies:** `react`, `react-native` (provided by the mobile app)
- **Types:** use `@datespot/shared-types` for props that mirror API data (e.g. `Place` on `PlaceCard`)
- **New shared components:** add under `src/components/` and export from `src/index.ts`
- **App-specific visuals** (backgrounds, one-off layouts) belong in `apps/mobile/src/components/`

## Related docs

- [Mobile app](../../apps/mobile/README.md)
- [Client architecture](../../docs/ARCHITECTURE.md)
