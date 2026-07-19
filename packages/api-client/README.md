# @datespot/api-client

Axios-based HTTP client for the DateSpot mobile app. Handles JWT storage, auth interceptors, and typed API wrappers.

## Structure

| File | Purpose |
|------|---------|
| `src/http.ts` | Shared Axios instance, base URL config, JWT request/response interceptors |
| `src/index.ts` | Auth, places, and user-facing API functions |
| `src/admin.ts` | Admin-only endpoints (`/api/admin/*`) |

## HTTP layer (`http.ts`)

- Default base URL: `http://localhost:3000` (overridden by `configureApiBaseUrl()` from mobile root layout)
- JWT stored in AsyncStorage (`@datespot/token`, `@datespot/user`)
- Request interceptor attaches `Authorization: Bearer <token>`
- Response interceptor clears auth on 401 and calls `setUnauthorizedHandler()` callback

## Public API (`index.ts`)

### Auth

- `login`, `register`, `changePassword`
- `getStoredUser`, `getStoredToken`, `clearAuth`

### Places

- `fetchPlaces({ lat, lng, category?, language? })`
- `fetchPlace(id)`
- `fetchSavedPlaces`, `savePlace`, `unsavePlace`

### Re-exports

- `apiClient`, `configureApiBaseUrl`, `setUnauthorizedHandler`, `TOKEN_KEY`, `USER_KEY`

## Admin API (`admin.ts`)

- `fetchAdminStats`, `fetchAdminPlaces`
- `createAdminPlace`, `updateAdminPlace`, `deleteAdminPlace`, `updateAdminPlaceOrder`
- `fetchAdminUsers`, `updateUserSubscription`

## Endpoint groups

| Prefix | Used by |
|--------|---------|
| `/api/auth/*` | Login, register, change password |
| `/api/places/*` | List, detail, save/unsave |
| `/api/admin/*` | Mobile admin panel |

## Conventions

- All return types come from `@datespot/shared-types`
- No React or React Native UI imports in this package
- Add new endpoints here rather than in mobile screen files
- Keep paths aligned with [datespot-server](../../../datespot-server/README.md) API routes

## Related docs

- [Shared types](../shared-types/README.md)
- [Client architecture](../../docs/ARCHITECTURE.md)
