/**
 * Profile screen: user info, menu navigation, language picker, logout.
 * Subscription tier badge colors reflect FREE / DATING (legacy PREMIUM/VIP still styled).
 */
import { clearAuth, getStoredUser } from "@datespot/api-client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { changeLanguage } from "../../../src/i18n/i18n";
import { useAuthSession } from "../../../src/auth/AuthSession";
import { colors } from "../../../src/theme/colors";

const TIER_COLORS: Record<string, string> = {
  FREE: "bg-cream text-text-muted",
  DATING: "bg-primary/15 text-primary",
  PREMIUM: "bg-primary/15 text-primary",
  VIP: "bg-accent/15 text-accent",
};

const LANGUAGES = [
  { code: "he" as const, labelKey: "profile.languageHebrew" },
  { code: "en" as const, labelKey: "profile.languageEnglish" },
  { code: "ar" as const, labelKey: "profile.languageArabic" },
];

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
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [changingLanguage, setChangingLanguage] = useState(false);

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
    { label: t("profile.aiPlanner"), route: "/(app)/(tabs)/ai" as const },
    ...(user?.isAdmin
      ? [{ label: t("profile.adminPanel"), route: "/(app)/admin" as const }]
      : []),
  ];

  const selectLanguage = async (code: "he" | "en" | "ar") => {
    if (changingLanguage || i18n.language === code) {
      setLanguageModalVisible(false);
      return;
    }
    setChangingLanguage(true);
    try {
      await changeLanguage(code);
      setLanguageModalVisible(false);
    } finally {
      setChangingLanguage(false);
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
  const currentLang = (i18n.language || "he").split("-")[0];

  return (
    <SafeAreaView testID="profile-screen" className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-3 bg-surface border-b border-border">
        <Text className="text-xl font-semibold text-text flex-1">{t("profile.title")}</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="items-center py-8 bg-surface mb-3 border-b border-border">
          <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-3">
            <Text className="text-white text-2xl font-semibold">
              {user ? getInitials(user.fullName) : "?"}
            </Text>
          </View>
          <Text className="text-xl font-semibold text-text">{user?.fullName}</Text>
          <Text className="text-text-muted mb-2">{user?.email}</Text>
          <View className={`px-3 py-1 rounded-md ${TIER_COLORS[tier] ?? TIER_COLORS.FREE}`}>
            <Text className="font-semibold text-sm">{tier}</Text>
          </View>
          <Text className="text-text-muted text-xs mt-2">
            {t("profile.currentLanguage", { lang: currentLang.toUpperCase() })}
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
                  setLanguageModalVisible(true);
                } else if ("route" in item) {
                  router.push(item.route);
                }
              }}
              className="flex-row items-center justify-between px-4 py-4 border-b border-border"
            >
              <Text className="text-text text-base">{item.label}</Text>
              <Text className="text-text-muted">→</Text>
            </Pressable>
          ))}

          <Pressable
            onPress={handleLogout}
            className="flex-row items-center justify-between px-4 py-4"
          >
            <Text className="text-red-500 text-base font-medium">
              {t("common.logout")}
            </Text>
            <Text className="text-text-muted">→</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setLanguageModalVisible(false)}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("profile.language")}</Text>
            {LANGUAGES.map((lang) => {
              const selected = currentLang === lang.code;
              return (
                <Pressable
                  key={lang.code}
                  testID={`profile-language-${lang.code}`}
                  disabled={changingLanguage}
                  onPress={() => void selectLanguage(lang.code)}
                  style={[
                    styles.langOption,
                    selected && styles.langOptionSelected,
                    changingLanguage && styles.langOptionDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.langOptionText,
                      selected && styles.langOptionTextSelected,
                    ]}
                  >
                    {t(lang.labelKey)}
                  </Text>
                  {selected ? (
                    <Text style={styles.langCheck}>✓</Text>
                  ) : null}
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setLanguageModalVisible(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(26, 25, 24, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...Platform.select({
      web: { boxShadow: "0 12px 40px rgba(26, 25, 24, 0.2)" },
      default: {
        shadowColor: "#1A1918",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  langOptionSelected: {
    backgroundColor: "#F5E9ED",
    borderColor: colors.primary,
  },
  langOptionDisabled: {
    opacity: 0.6,
  },
  langOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  langOptionTextSelected: {
    color: colors.primary,
  },
  langCheck: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    marginTop: 4,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "600",
  },
});
