/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(app)` | `/(app)/admin` | `/(app)/admin/` | `/(app)/admin/places` | `/(app)/admin/users` | `/(app)/change-password` | `/(app)/home` | `/(app)/profile` | `/(app)/saved` | `/(app)/subscription` | `/_sitemap` | `/admin` | `/admin/` | `/admin/places` | `/admin/users` | `/auth` | `/auth/login` | `/auth/register` | `/change-password` | `/home` | `/profile` | `/saved` | `/subscription`;
      DynamicRoutes: `/(app)/place/${Router.SingleRoutePart<T>}` | `/place/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/(app)/place/[id]` | `/place/[id]`;
    }
  }
}
