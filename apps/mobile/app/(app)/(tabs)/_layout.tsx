/** Bottom tab navigation: Home, Map, AI Chat, Profile. */
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

import { AiTabIcon } from "../../../src/components/icons/AiTabIcon";
import { HomeTabIcon } from "../../../src/components/icons/HomeTabIcon";
import { MapTabIcon } from "../../../src/components/icons/MapTabIcon";
import { ProfileTabIcon } from "../../../src/components/icons/ProfileTabIcon";
import { colors } from "../../../src/theme/colors";

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: "rgba(250, 249, 247, 0.96)",
          borderTopColor: "rgba(222, 192, 182, 0.45)",
          paddingTop: 6,
          height: 64,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => (
            <HomeTabIcon color={color} size={size ?? 24} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t("tabs.map"),
          tabBarIcon: ({ color, size }) => (
            <MapTabIcon color={color} size={size ?? 24} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: t("tabs.ai"),
          tabBarIcon: ({ color, size }) => (
            <AiTabIcon color={color} size={size ?? 24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size }) => (
            <ProfileTabIcon color={color} size={size ?? 24} />
          ),
        }}
      />
      <Tabs.Screen name="saved" options={{ href: null }} />
      <Tabs.Screen name="favorites" options={{ href: null }} />
    </Tabs>
  );
}
