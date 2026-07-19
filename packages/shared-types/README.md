# @datespot/shared-types

TypeScript types mirrored from the DateSpot server API. This package contains **types only** — no runtime code.

## Key exports

### Enums / unions

- `SubscriptionTier` — `FREE` | `PREMIUM` | `VIP`
- `PlaceCategory` — e.g. `ROMANTIC_DATE`, `RESTAURANT`, `SUNSET`, …
- `PriceRange` — `FREE` | `BUDGET` | `MODERATE` | `EXPENSIVE`

### User-facing types

- `User`, `AuthLoginResponse`
- `Place`, `PlaceDetail`

### Admin types

- `AdminStats`, `AdminPlace`, `AdminPlaceInput`
- `AdminUserListItem`, `AdminUsersResponse`
- `PaginatedResponse<T>`

Source: `src/index.ts`

## Consumers

- `@datespot/api-client` — function return types and request payloads
- `@datespot/ui` — component props (e.g. `PlaceCard`)
- `apps/mobile` — screen-level typing via imports from workspace packages

## Sync rule

When the server API shape changes:

1. Update types in [datespot-server](../../../datespot-server/README.md) (if applicable)
2. Update `packages/shared-types/src/index.ts` in this repo
3. Update `@datespot/api-client` wrappers if endpoints or fields changed
4. Run `pnpm build` from the client repo root

Keep field names and enum values aligned with actual JSON responses from the API.

## Conventions

- No imports from React, Axios, or other runtime libraries
- Prefer interfaces for object shapes; use `type` for unions and aliases
- Document non-obvious fields with brief JSDoc comments when needed

## Related docs

- [API client](../api-client/README.md)
- [Client architecture](../../docs/ARCHITECTURE.md)
