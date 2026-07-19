import type { ConfigContext, ExpoConfig } from "expo/config";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const IS_STAGING = process.env.APP_VARIANT === "staging";

function readEnvFile(key: string): string | undefined {
  const envPath = join(__dirname, ".env");
  if (!existsSync(envPath)) return undefined;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const envKey = trimmed.slice(0, idx).trim();
    if (envKey !== key) continue;
    return trimmed.slice(idx + 1).trim();
  }

  return undefined;
}

const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
  readEnvFile("EXPO_PUBLIC_API_URL") ||
  "http://localhost:3000";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_STAGING ? "DateSpot Staging" : "DateSpot",
  slug: "datespot",
  version: "1.0.0",
  orientation: "portrait",
  scheme: IS_STAGING ? "datespot-staging" : "datespot",
  userInterfaceStyle: "light",
  splash: {
    backgroundColor: "#7C3048",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: IS_STAGING
      ? "co.il.datespot.app.staging"
      : "co.il.datespot.app",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#7C3048",
    },
    package: IS_STAGING ? "co.il.datespot.app.staging" : "co.il.datespot.app",
  },
  plugins: [
    "expo-router",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "DateSpot צריך גישה למיקום שלך כדי להציג מקומות קרובים אליך.",
      },
    ],
    "expo-asset",
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: API_URL,
    ...(process.env.EAS_PROJECT_ID
      ? { eas: { projectId: process.env.EAS_PROJECT_ID } }
      : {}),
    appVariant: IS_STAGING ? "staging" : "production",
  },
});
