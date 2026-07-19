/** Root layout: QueryClient, i18n, auth guard redirecting to login when no JWT. */
import "react-native-gesture-handler";
import "../global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  configureApiBaseUrl,
  getStoredToken,
  setUnauthorizedHandler,
} from "@datespot/api-client";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { I18nextProvider } from "react-i18next";

import { AuthSessionProvider, useAuthSession } from "../src/auth/AuthSession";
import { i18n, initI18n } from "../src/i18n/i18n";
import { setupPushNotifications } from "../src/notifications/push";
import { colors } from "../src/theme/colors";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function resolveApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

  if (Platform.OS === "web" && typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:3000";
    }
  }

  return configured;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { isSessionActive, clearSession } = useAuthSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      router.replace("/onboarding");
    });
  }, [router, clearSession]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      configureApiBaseUrl(resolveApiBaseUrl());
      await initI18n();
      if (mounted) setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;

    let mounted = true;
    (async () => {
      const token = await getStoredToken();
      if (!mounted) return;

      const inAuthGroup = segments[0] === "auth";
      const inOnboarding = segments[0] === "onboarding";
      const atIndex = segments.length === 0;
      const inApp = segments[0] === "(app)";
      const needsLogin = !token || !isSessionActive;

      // Not signed in this session → onboarding (welcome → discover → login)
      if (needsLogin && !inOnboarding && !inAuthGroup) {
        router.replace("/onboarding");
        return;
      }

      // Signed in this session → go to app
      if (!needsLogin && (inOnboarding || inAuthGroup || atIndex)) {
        router.replace("/(app)/(tabs)");
        void setupPushNotifications();
        return;
      }

      if (!needsLogin && inApp) {
        void setupPushNotifications();
      }
    })();

    return () => {
      mounted = false;
    };
  }, [ready, segments, router, isSessionActive]);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <AuthSessionProvider>
          <AuthGuard>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
          </AuthGuard>
        </AuthSessionProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
