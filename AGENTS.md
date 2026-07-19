# DateSpot Client — Agent Instructions

Instructions for AI coding agents working in this repository.

## Read first

1. This file (repo-wide rules)
2. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the monorepo map and dependency graph
3. The README of the package you are editing (see table below)

## Package docs

| When editing | Read |
|--------------|------|
| `apps/mobile/**` | [apps/mobile/README.md](apps/mobile/README.md) |
| `packages/api-client/**` | [packages/api-client/README.md](packages/api-client/README.md) |
| `packages/ui/**` | [packages/ui/README.md](packages/ui/README.md) |
| `packages/shared-types/**` | [packages/shared-types/README.md](packages/shared-types/README.md) |

## Commands (from repo root)

```bash
pnpm install
pnpm dev                    # Expo mobile (LAN)
pnpm dev:lan                # Same as dev
pnpm dev:tunnel             # Expo via tunnel
pnpm build                  # turbo build all packages
pnpm lint                   # turbo lint all packages
```

E2E tests live in the sibling `../e2e/` repo — see [e2e/README.md](../e2e/README.md).

Mobile-only:

```bash
pnpm --filter mobile dev
pnpm --filter mobile dev:lan
pnpm --filter mobile dev:tunnel
pnpm --filter mobile lint
```

## Conventions

- TypeScript strict; match existing import style
- Workspace packages use the `@datespot/*` scope
- Mobile routing: Expo Router file-based routes under `apps/mobile/app/`
- i18n: add keys to `he`, `en`, and `ar` locale JSON files; do not hardcode user-facing strings in mobile
- Types: keep `packages/shared-types` in sync with `datespot-server` API responses
- UI: prefer `@datespot/ui` for reusable components; app-specific UI stays in `apps/mobile`
- HTTP: use `@datespot/api-client` from screens; do not add raw `fetch` or duplicate Axios setup in mobile

## Boundaries — do NOT

- Commit `.env` files, API keys, or secrets
- Change server code when the task is client-only (backend lives in `../datespot-server`)
- Add heavy abstractions for one-off use
- Break RTL layouts for Hebrew (`he`) or Arabic (`ar`)
- Import React or React Native UI into `packages/api-client` or `packages/shared-types`

## Verification

Before finishing a mobile change:

```bash
pnpm --filter mobile lint
```

If `shared-types` or `api-client` changed:

```bash
pnpm build
```

E2E (API stack must be running — run from `../e2e/`):

```bash
cd ../e2e
pnpm stack:up
pnpm e2e              # API + web smoke
pnpm mobile           # Maestro on emulator (manual)
```

See [e2e/README.md](../e2e/README.md).

Backend setup and API details: [datespot-server/README.md](../datespot-server/README.md).
