import Constants from "expo-constants";
import { Platform } from "react-native";

const DEFAULT_API_URL = "http://localhost:3000";
const STAGING_API_URL = "https://datespot-staging.up.railway.app";

function readEnvApiUrl(): string | undefined {
  const fromExtra = Constants.expoConfig?.extra?.apiUrl;
  if (typeof fromExtra === "string" && fromExtra.trim()) {
    return fromExtra.trim();
  }

  const fromPublicEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromPublicEnv) return fromPublicEnv;

  return undefined;
}

/** Resolve API base URL for the running app (Expo Go, dev build, web). */
export function resolveApiBaseUrl(): string {
  const configured = readEnvApiUrl();

  if (Platform.OS === "web" && typeof window !== "undefined") {
    const host = window.location.hostname;
    if (
      (host === "localhost" || host === "127.0.0.1") &&
      (!configured || !/^https:\/\//i.test(configured))
    ) {
      return DEFAULT_API_URL;
    }
  }

  if (configured) return configured.replace(/\/$/, "");

  // Dev fallback: when .env was not picked up by Metro, still hit Railway staging.
  if (__DEV__) return STAGING_API_URL;

  return DEFAULT_API_URL;
}
