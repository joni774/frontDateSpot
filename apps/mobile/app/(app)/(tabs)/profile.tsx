/**
 * Profile screen: Stitch layout — avatar, membership, grouped settings cards.
 */
import { clearAuth, fetchMe, getStoredUser } from "@datespot/api-client";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
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

import { useAuthSession } from "../../../src/auth/AuthSession";
import { ScreenHeader } from "../../../src/components/ScreenHeader";
import { changeLanguage } from "../../../src/i18n/i18n";
import { colors } from "../../../src/theme/colors";

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

function MenuCard({
  title,
  subtitle,
  iconBg,
  onPress,
  testID,
  trailing,
}: {
  title: string;
  subtitle?: string;
  iconBg: string;
  onPress: () => void;
  testID?: string;
  trailing?: string;
}) {
  return (
    <Pressable testID={testID} onPress={onPress} style={styles.card}>
      <View style={[styles.cardIcon, { backgroundColor: iconBg }]} />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{title}</Text>
        {subtitle ? <Text style={styles.cardSub}>{subtitle}</Text> : null}
      </View>
      {trailing ? <Text style={styles.cardTrailing}>{trailing}</Text> : null}
      <Text style={styles.chevron}>‹</Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { clearSession } = useAuthSession();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [changingLanguage, setChangingLanguage] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        return await fetchMe();
      } catch {
        return getStoredUser();
      }
    },
  });

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
  const langLabel =
    currentLang === "en"
      ? t("profile.languageEnglish")
      : currentLang === "ar"
        ? t("profile.languageArabic")
        : t("profile.languageHebrew");

  return (
    <View testID="profile-screen" style={styles.screen}>
      <ScreenHeader title={t("profile.title")} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <LinearGradient
            colors={["rgba(255,127,80,0.16)", "rgba(250,249,247,0)", "rgba(0,181,192,0.1)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user ? getInitials(user.fullName) : "?"}
              </Text>
            </View>
            <Pressable
              style={styles.editBadge}
              onPress={() => router.push("/(app)/edit-profile")}
              accessibilityRole="button"
            >
              <Text style={styles.editGlyph}>✎</Text>
            </Pressable>
          </View>
          <Text style={styles.name}>{user?.fullName}</Text>
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>{t(`subscription.tier.${tier}`)}</Text>
          </View>
          <Pressable
            style={styles.upgrade}
            onPress={() => router.push("/(app)/subscription")}
            accessibilityRole="button"
          >
            <Text style={styles.upgradeText}>{t("profile.upgradeAi")}</Text>
            <Text style={styles.upgradeBolt}>⚡</Text>
          </Pressable>
        </View>

        <View style={styles.sheet}>
          <Text style={styles.sectionTitle}>{t("profile.accountSettings")}</Text>
          <MenuCard
            title={t("profile.favorites")}
            subtitle={t("profile.favoritesSubtitle")}
            iconBg="#FFDBCF"
            onPress={() => router.push("/(app)/(tabs)/favorites")}
          />
          <MenuCard
            title={t("profile.savedPlaces")}
            subtitle={t("profile.savedSubtitle")}
            iconBg="#7AF4FF33"
            onPress={() => router.push("/(app)/(tabs)/saved")}
          />
          <MenuCard
            title={t("profile.editProfile")}
            iconBg={colors.surfaceContainerHigh}
            onPress={() => router.push("/(app)/edit-profile")}
          />
          <MenuCard
            title={t("profile.subscription")}
            iconBg={colors.surfaceContainerHigh}
            onPress={() => router.push("/(app)/subscription")}
          />
          <MenuCard
            title={t("profile.changePassword")}
            iconBg={colors.surfaceContainerHigh}
            onPress={() => router.push("/(app)/change-password")}
          />
          <MenuCard
            title={t("profile.verifyPhone")}
            iconBg={colors.surfaceContainerHigh}
            onPress={() => router.push("/(app)/verify-otp")}
          />

          <Text style={[styles.sectionTitle, styles.sectionSpaced]}>
            {t("profile.preferences")}
          </Text>
          <MenuCard
            testID="profile-menu-language"
            title={t("profile.language")}
            trailing={langLabel}
            iconBg={colors.surfaceContainerHigh}
            onPress={() => setLanguageModalVisible(true)}
          />
          <MenuCard
            title={t("profile.nearbyPeople")}
            iconBg={colors.surfaceContainerHigh}
            onPress={() => router.push("/(app)/nearby")}
          />
          <MenuCard
            title={t("profile.aiPlanner")}
            iconBg={colors.surfaceContainerHigh}
            onPress={() => router.push("/(app)/(tabs)/ai")}
          />
          {user?.isAdmin ? (
            <MenuCard
              testID="profile-menu-admin"
              title={t("profile.adminPanel")}
              iconBg={colors.surfaceContainerHigh}
              onPress={() => router.push("/(app)/admin")}
            />
          ) : null}

          <Pressable onPress={handleLogout} style={styles.logout}>
            <Text style={styles.logoutText}>{t("profile.logoutAccount")}</Text>
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
                  {selected ? <Text style={styles.langCheck}>✓</Text> : null}
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  hero: {
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  avatarRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    padding: 4,
    backgroundColor: colors.coral,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 64,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
  },
  editBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1A1918",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  editGlyph: {
    color: colors.primary,
    fontSize: 14,
  },
  name: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  tierBadge: {
    backgroundColor: "#FFD9E0",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  tierText: {
    color: "#3F001A",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  upgrade: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  upgradeText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  upgradeBolt: {
    fontSize: 14,
  },
  sheet: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    marginTop: -16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  sectionSpaced: {
    marginTop: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(222,192,182,0.45)",
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 14,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  cardSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardTrailing: {
    fontSize: 13,
    color: colors.textMuted,
    marginRight: 4,
  },
  chevron: {
    fontSize: 22,
    color: colors.outline,
  },
  logout: {
    alignItems: "center",
    paddingVertical: 24,
  },
  logoutText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: "600",
  },
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
  },
  langOptionSelected: {
    backgroundColor: "#FFDBCF",
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
