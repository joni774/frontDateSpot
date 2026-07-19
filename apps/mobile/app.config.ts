import type { ConfigContext, ExpoConfig } from "expo/config";

const IS_STAGING = process.env.APP_VARIANT === "staging";

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
    ...(process.env.EAS_PROJECT_ID
      ? { eas: { projectId: process.env.EAS_PROJECT_ID } }
      : {}),
    appVariant: IS_STAGING ? "staging" : "production",
  },
});
