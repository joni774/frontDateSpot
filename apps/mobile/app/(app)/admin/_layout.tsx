/** Admin section layout — redirects non-admin users to home. */
import { fetchMe } from "@datespot/api-client";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { colors } from "../../../src/theme/colors";

export default function AdminLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = await fetchMe();
        if (!mounted) return;
        if (!user.isAdmin) {
          router.replace("/(app)/(tabs)");
          return;
        }
        setAllowed(true);
        setReady(true);
      } catch {
        if (!mounted) return;
        router.replace("/(app)/(tabs)");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (!ready || !allowed) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
