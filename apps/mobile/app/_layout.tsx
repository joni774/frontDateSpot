/** Root layout: QueryClient, i18n, auth guard redirecting to login when no JWT. */
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

import { i18n, initI18n } from "../src/i18n/i18n";

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
  const [ready, setReady] = useState(false);
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setHasToken(false);
      router.replace("/auth/login");
    });
  }, [router]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      configureApiBaseUrl(resolveApiBaseUrl());
      await initI18n();
      const token = await getStoredToken();
      if (mounted) {
        setHasToken(!!token);
        setReady(true);
      }
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
      setHasToken(!!token);

      const inAuthGroup = segments[0] === "auth";

      if (!token && !inAuthGroup) {
        router.replace("/auth/login");
      } else if (token && inAuthGroup) {
        router.replace("/(app)/home");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [ready, segments, router]);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#E84393" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <AuthGuard>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </AuthGuard>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
