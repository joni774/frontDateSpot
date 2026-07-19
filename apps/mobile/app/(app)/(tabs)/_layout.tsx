/** Bottom tab navigation: Home, Map, AI, Saved, Favorites, Profile. */
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { AiTabIcon } from "../../../src/components/icons/AiTabIcon";
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
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 4,
          height: 64,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
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
          tabBarLabel: t("tabs.ai"),
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.aiIconWrap,
                focused ? styles.aiIconWrapActive : styles.aiIconWrapIdle,
              ]}
            >
              <AiTabIcon color="#FFFFFF" size={24} />
            </View>
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

const styles = StyleSheet.create({
  aiIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -18,
  },
  aiIconWrapActive: {
    backgroundColor: colors.primary,
  },
  aiIconWrapIdle: {
    backgroundColor: colors.primaryLight,
  },
});
