/** i18n configuration with Hebrew default and RTL support for he/ar.
 * RTL is critical for the Israeli market — Hebrew and Arabic users expect
 * right-to-left layout for navigation, forms, and lists. */
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DevSettings, I18nManager, Platform } from "react-native";

import ar from "./locales/ar.json";
import en from "./locales/en.json";
import he from "./locales/he.json";

export const LANGUAGE_KEY = "@datespot/language";

export type AppLanguage = "he" | "en" | "ar";

function isRtlLanguage(lng: string): boolean {
  const base = lng.split("-")[0];
  return base === "he" || base === "ar";
}

function normalizeAppLanguage(raw?: string | null): AppLanguage {
  const base = (raw ?? "he").toLowerCase().split(/[-_]/)[0]?.trim();
  if (base === "en" || base === "ar" || base === "he") return base;
  return "he";
}

/** Source of truth for AI + UI language — prefer on-screen i18n, else storage, default he. */
export async function getStoredAppLanguage(): Promise<AppLanguage> {
  const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
  return normalizeAppLanguage(stored);
}

/** Language for AI calls: matches what the user currently sees in the UI. */
export async function getAiLanguage(i18nLanguage?: string | null): Promise<AppLanguage> {
  const fromUi = i18nLanguage ? normalizeAppLanguage(i18nLanguage) : null;
  if (fromUi) {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (normalizeAppLanguage(stored) !== fromUi) {
      await AsyncStorage.setItem(LANGUAGE_KEY, fromUi);
    }
    return fromUi;
  }

  // Web fallback: RTL document ⇒ Hebrew (DateSpot default), not browser English.
  if (Platform.OS === "web" && typeof document !== "undefined") {
    const htmlLang = document.documentElement.lang?.toLowerCase().split("-")[0];
    if (htmlLang === "he" || htmlLang === "ar" || htmlLang === "en") {
      return htmlLang;
    }
    if (document.documentElement.dir === "rtl") return "he";
  }

  return getStoredAppLanguage();
}

function applyWebDocumentDir(lng: string): void {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  const rtl = isRtlLanguage(lng);
  document.documentElement.dir = rtl ? "rtl" : "ltr";
  document.documentElement.lang = lng.split("-")[0];
}

export async function initI18n(): Promise<void> {
  let stored = await AsyncStorage.getItem(LANGUAGE_KEY);
  // Persist Hebrew default so AI never inherits browser "en".
  if (!stored) {
    stored = "he";
    await AsyncStorage.setItem(LANGUAGE_KEY, "he");
  }
  const lng = normalizeAppLanguage(stored);

  await i18n.use(initReactI18next).init({
    resources: {
      he: { translation: he },
      en: { translation: en },
      ar: { translation: ar },
    },
    lng,
    fallbackLng: "he",
    compatibilityJSON: "v3",
    interpolation: { escapeValue: false },
  });

  applyRTL(lng);
  applyWebDocumentDir(lng);
}

function applyRTL(lng: string): boolean {
  const shouldRtl = isRtlLanguage(lng);
  const directionChanged = I18nManager.isRTL !== shouldRtl;
  I18nManager.allowRTL(shouldRtl);
  I18nManager.forceRTL(shouldRtl);
  return directionChanged;
}

function reloadForRtlIfNeeded(directionChanged: boolean): void {
  if (!directionChanged) return;

  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.location.reload();
    return;
  }

  if (__DEV__ && DevSettings?.reload) {
    DevSettings.reload();
  }
}

export async function changeLanguage(lng: string): Promise<void> {
  const normalized = normalizeAppLanguage(lng);
  await AsyncStorage.setItem(LANGUAGE_KEY, normalized);
  const directionChanged = applyRTL(normalized);
  applyWebDocumentDir(normalized);
  await i18n.changeLanguage(normalized);

  if (directionChanged) {
    reloadForRtlIfNeeded(true);
  }
}

export { i18n };
export { useTranslation } from "react-i18next";
