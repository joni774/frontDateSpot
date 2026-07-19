/** Bottom tab navigation: Home, Map, Saved, Favorites, Profile. */
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

import { FavoritesTabIcon } from "../../../src/components/icons/FavoritesTabIcon";
import { HomeTabIcon } from "../../../src/components/icons/HomeTabIcon";
import { MapTabIcon } from "../../../src/components/icons/MapTabIcon";
import { ProfileTabIcon } from "../../../src/components/icons/ProfileTabIcon";
import { SavedTabIcon } from "../../../src/components/icons/SavedTabIcon";
import { colors } from "../../../src/theme/colors";

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: { borderTopColor: "#f3f4f6", paddingTop: 4, height: 60 },
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
        name="saved"
        options={{
          title: t("tabs.saved"),
          tabBarIcon: ({ color, size }) => (
            <SavedTabIcon color={color} size={size ?? 24} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t("tabs.favorites"),
          tabBarIcon: ({ color, size }) => (
            <FavoritesTabIcon color={color} size={size ?? 24} />
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
    </Tabs>
  );
}
