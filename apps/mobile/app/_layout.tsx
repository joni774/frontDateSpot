/** Root layout: QueryClient, i18n, auth guard redirecting to login when no JWT. */
import "react-native-gesture-handler";
import "../global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  configureApiBaseUrl,
  getStoredToken,
  setUnauthorizedHandler,
} from "@datespot/api-client";
import { Stack, useRouter, useRootNavigationState, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { I18nextProvider } from "react-i18next";

import { AuthSessionProvider, useAuthSession } from "../src/auth/AuthSession";
import { BootScreen } from "../src/components/BootScreen";
import { resolveApiBaseUrl } from "../src/config/api";
import { i18n, initI18n } from "../src/i18n/i18n";
import { colors } from "../src/theme/colors";

/** Lazy — avoid loading expo-notifications (and its top-level handler) during cold start. */
function queuePushSetup(): void {
  void import("../src/notifications/push")
    .then(({ setupPushNotifications }) => setupPushNotifications())
    .catch(() => {
      // Push is optional
    });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const rootNavigation = useRootNavigationState();
  const navReady = Boolean(rootNavigation?.key);
  const { isSessionActive, activateSession, clearSession } = useAuthSession();
  const [ready, setReady] = useState(false);
  const [sessionBootstrapped, setSessionBootstrapped] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler((context) => {
      const expired = context?.expired ?? false;
      const goLogin = () => {
        clearSession();
        router.replace("/onboarding");
      };
      if (expired) {
        Alert.alert(
          i18n.t("auth.sessionExpiredTitle"),
          i18n.t("auth.sessionExpiredBody"),
          [{ text: i18n.t("common.ok"), onPress: goLogin }]
        );
        return;
      }
      goLogin();
    });
  }, [router, clearSession]);

  useEffect(() => {
    if (!ready || sessionBootstrapped) return;
    let mounted = true;
    (async () => {
      try {
        const token = await getStoredToken();
        if (!mounted) return;
        if (token) {
          activateSession();
        }
      } catch {
        // Still mark bootstrapped so we never stick on a blank frame.
      } finally {
        if (mounted) setSessionBootstrapped(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [ready, sessionBootstrapped, activateSession]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const apiUrl = resolveApiBaseUrl();
        configureApiBaseUrl(apiUrl);
        if (__DEV__) {
          console.log("[DateSpot] API base URL:", apiUrl);
        }
        await initI18n();
      } catch (err) {
        if (__DEV__) {
          console.warn("[DateSpot] boot init failed:", err);
        }
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready || !sessionBootstrapped || !navReady) return;

    let mounted = true;
    (async () => {
      const token = await getStoredToken();
      if (!mounted) return;

      const inAuthGroup = segments[0] === "auth";
      const inOnboarding = segments[0] === "onboarding";
      const inApp = segments[0] === "(app)";
      const needsLogin = !token || !isSessionActive;

      // Not signed in this session → onboarding (welcome → discover → login)
      if (needsLogin && !inOnboarding && !inAuthGroup) {
        router.replace("/onboarding");
        return;
      }

      // Signed in this session → go to app
      if (!needsLogin && (inOnboarding || inAuthGroup)) {
        router.replace("/(app)/(tabs)");
        queuePushSetup();
        return;
      }

      if (!needsLogin && inApp) {
        queuePushSetup();
      }
    })();

    return () => {
      mounted = false;
    };
  }, [ready, sessionBootstrapped, navReady, segments, router, isSessionActive]);

  const showBootOverlay = !ready || !sessionBootstrapped || !navReady;

  return (
    <View style={styles.root}>
      {children}
      {showBootOverlay ? (
        <View style={styles.overlay} pointerEvents="auto">
          <BootScreen />
        </View>
      ) : null}
    </View>
  );
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
});
