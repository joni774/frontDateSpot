/**
 * Profile screen: user info, menu navigation, language picker, logout.
 * Subscription tier badge colors reflect FREE / DATING (legacy PREMIUM/VIP still styled).
 */
import { clearAuth, getStoredUser } from "@datespot/api-client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActionSheetIOS, Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { changeLanguage } from "../../../src/i18n/i18n";
import { useAuthSession } from "../../../src/auth/AuthSession";

const TIER_COLORS: Record<string, string> = {
  FREE: "bg-gray-200 text-gray-700",
  DATING: "bg-primary/20 text-primary",
  PREMIUM: "bg-primary/20 text-primary",
  VIP: "bg-yellow-100 text-yellow-800",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { clearSession } = useAuthSession();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: getStoredUser,
  });

  const menuItems = [
    { label: t("profile.nearbyPeople"), route: "/(app)/nearby" as const },
    { label: t("profile.savedPlaces"), route: "/(app)/(tabs)/saved" as const },
    { label: t("profile.favorites"), route: "/(app)/(tabs)/favorites" as const },
    { label: t("profile.editProfile"), route: "/(app)/edit-profile" as const },
    { label: t("profile.verifyPhone"), route: "/(app)/verify-otp" as const },
    { label: t("profile.changePassword"), route: "/(app)/change-password" as const },
    { label: t("profile.language"), action: "language" as const },
    { label: t("profile.subscription"), route: "/(app)/subscription" as const },
    { label: t("profile.aiPlanner"), route: "/(app)/ai-chat" as const },
    ...(user?.isAdmin
      ? [{ label: t("profile.adminPanel"), route: "/(app)/admin" as const }]
      : []),
  ];

  const showLanguagePicker = () => {
    const options = [
      t("profile.languageHebrew"),
      t("profile.languageEnglish"),
      t("profile.languageArabic"),
      t("common.cancel"),
    ];
    const langs = ["he", "en", "ar"] as const;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 3, title: t("profile.language") },
        (index) => {
          if (index < 3) void changeLanguage(langs[index]);
        }
      );
    } else {
      Alert.alert(t("profile.language"), undefined, [
        { text: t("profile.languageHebrew"), onPress: () => void changeLanguage("he") },
        { text: t("profile.languageEnglish"), onPress: () => void changeLanguage("en") },
        { text: t("profile.languageArabic"), onPress: () => void changeLanguage("ar") },
        { text: t("common.cancel"), style: "cancel" },
      ]);
    }
  };

  const handleLogout = () => {
    Alert.alert(t("common.logout"), t("profile.logoutConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.logout"),
        style: "destructive",
        onPress: async () => {
          await clearAuth();
          clearSession();
          router.replace("/onboarding");
        },
      },
    ]);
  };

  const tier = user?.subscriptionTier ?? "FREE";

  return (
    <SafeAreaView testID="profile-screen" className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-3 bg-surface border-b border-border">
        <Text className="text-xl font-bold text-text flex-1">{t("profile.title")}</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="items-center py-8 bg-surface mb-4">
          <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-3">
            <Text className="text-white text-2xl font-bold">
              {user ? getInitials(user.fullName) : "?"}
            </Text>
          </View>
          <Text className="text-xl font-bold text-text">{user?.fullName}</Text>
          <Text className="text-gray-500 mb-2">{user?.email}</Text>
          <View className={`px-3 py-1 rounded-full ${TIER_COLORS[tier] ?? TIER_COLORS.FREE}`}>
            <Text className="font-semibold text-sm">{tier}</Text>
          </View>
          <Text className="text-gray-400 text-xs mt-2">
            {t("profile.currentLanguage", { lang: i18n.language.toUpperCase() })}
          </Text>
        </View>

        <View className="bg-surface">
          {menuItems.map((item) => (
            <Pressable
              key={item.label}
              testID={
                "action" in item && item.action === "language"
                  ? "profile-menu-language"
                  : "route" in item && item.route === "/(app)/admin"
                    ? "profile-menu-admin"
                    : undefined
              }
              onPress={() => {
                if ("action" in item && item.action === "language") {
                  showLanguagePicker();
                } else if ("route" in item) {
                  router.push(item.route);
                }
              }}
              className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100"
            >
              <Text className="text-text text-base">{item.label}</Text>
              <Text className="text-gray-400">→</Text>
            </Pressable>
          ))}

          <Pressable
            onPress={handleLogout}
            className="flex-row items-center justify-between px-4 py-4"
          >
            <Text className="text-red-500 text-base font-medium">
              {t("common.logout")}
            </Text>
            <Text className="text-gray-400">→</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
