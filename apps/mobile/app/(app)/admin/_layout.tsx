/** Admin section layout — redirects non-admin users to home. */
import { getStoredUser } from "@datespot/api-client";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function AdminLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const user = await getStoredUser();
      if (!mounted) return;
      if (!user?.isAdmin) {
        router.replace("/(app)/(tabs)");
        return;
      }
      setAllowed(true);
      setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (!ready || !allowed) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#7C3048" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
