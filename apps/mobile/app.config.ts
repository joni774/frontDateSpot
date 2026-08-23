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

const MAPBOX_ACCESS_TOKEN =
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ||
  readEnvFile("EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN") ||
  "";

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
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSLocationWhenInUseUsageDescription:
        "DateSpot צריך גישה למיקום שלך כדי להציג מקומות יציאה קרובים אליך.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "DateSpot צריך גישה למיקום שלך כדי להציג מקומות יציאה קרובים אליך.",
      NSLocationAlwaysUsageDescription:
        "DateSpot צריך גישה למיקום שלך כדי להציג מקומות יציאה קרובים אליך.",
    },
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyCollectedDataTypes: [
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypePreciseLocation",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            "NSPrivacyCollectedDataTypePurposeAppFunctionality",
          ],
        },
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeCoarseLocation",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            "NSPrivacyCollectedDataTypePurposeAppFunctionality",
          ],
        },
      ],
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#7C3048",
    },
    package: IS_STAGING ? "co.il.datespot.app.staging" : "co.il.datespot.app",
    supportsRtl: true,
    permissions: [
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
    ],
  },
  plugins: [
    "expo-router",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "DateSpot צריך גישה למיקום שלך כדי להציג מקומות יציאה קרובים אליך.",
        locationAlwaysAndWhenInUsePermission:
          "DateSpot צריך גישה למיקום שלך כדי להציג מקומות יציאה קרובים אליך.",
        locationAlwaysPermission:
          "DateSpot צריך גישה למיקום שלך כדי להציג מקומות יציאה קרובים אליך.",
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: false,
      },
    ],
    "expo-asset",
    // Mapbox is Android-only. Skip the plugin on iOS EAS so Apple Maps / TestFlight
    // builds do not pull in the Mapbox iOS SDK.
    ...(process.env.EAS_BUILD_PLATFORM === "ios"
      ? []
      : [
          [
            "@rnmapbox/maps",
            { RNMapboxMapsVersion: "11.18.2" },
          ] as [string, { RNMapboxMapsVersion: string }],
        ]),
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supportsRTL: true,
    apiUrl: API_URL,
    mapboxAccessToken: MAPBOX_ACCESS_TOKEN,
    eas: {
      projectId:
        process.env.EAS_PROJECT_ID ?? "64c99bdb-3795-46d5-ab6c-6ba6affa6f76",
    },
    appVariant: IS_STAGING ? "staging" : "production",
  },
});
