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

// Google OAuth client id(s) for "Sign in with Google" (expo-auth-session).
// Create in Google Cloud Console → APIs & Services → Credentials.
// Without this set, the Google sign-in button is hidden.
const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ||
  readEnvFile("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID") ||
  "";
const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() ||
  readEnvFile("EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID") ||
  "";
const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ||
  readEnvFile("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID") ||
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
    // Temporarily disabled: Apple Developer Portal capability for "Sign in with Apple"
    // is not yet enabled for co.il.datespot.app, so the current provisioning profile
    // lacks the com.apple.developer.applesignin entitlement and Xcode build fails.
    // Re-enable once the capability + profile are set up (see build 891e74f3 error).
    // "expo-apple-authentication",
    "expo-web-browser",
    // Mapbox is Android-only. Skip the plugin on iOS EAS so Apple Maps / TestFlight
    // builds do not pull in the Mapbox iOS SDK.
    ...(process.env.EAS_BUILD_PLATFORM === "ios"
      ? []
      : [
          [
            "@rnmapbox/maps",
            // Must match (or exceed) the "mapbox.android" version pinned in
            // node_modules/@rnmapbox/maps/package.json for the installed
            // @rnmapbox/maps version — older SDK versions are missing newer
            // style properties (e.g. lineElevationGroundScale) and fail Kotlin
            // compilation with "Unresolved reference" errors.
            { RNMapboxMapsVersion: "11.23.1" },
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
    googleIosClientId: GOOGLE_IOS_CLIENT_ID,
    googleAndroidClientId: GOOGLE_ANDROID_CLIENT_ID,
    googleWebClientId: GOOGLE_WEB_CLIENT_ID,
    eas: {
      projectId:
        process.env.EAS_PROJECT_ID ?? "64c99bdb-3795-46d5-ab6c-6ba6affa6f76",
    },
    appVariant: IS_STAGING ? "staging" : "production",
  },
});
