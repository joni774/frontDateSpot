/** i18n configuration with Hebrew default and RTL support for he/ar.
 * RTL is critical for the Israeli market — Hebrew and Arabic users expect
 * right-to-left layout for navigation, forms, and lists. */
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { I18nManager } from "react-native";

import ar from "./locales/ar.json";
import en from "./locales/en.json";
import he from "./locales/he.json";

const LANGUAGE_KEY = "@datespot/language";

export async function initI18n(): Promise<void> {
  const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
  const lng = stored ?? "he";

  await i18n.use(initReactI18next).init({
    resources: {
      he: { translation: he },
      en: { translation: en },
      ar: { translation: ar },
    },
    lng,
    fallbackLng: "he",
    interpolation: { escapeValue: false },
  });

  applyRTL(lng);
}

function applyRTL(lng: string): void {
  const isRTL = lng === "he" || lng === "ar";
  I18nManager.allowRTL(isRTL);
  I18nManager.forceRTL(isRTL);
}

export async function changeLanguage(lng: string): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  applyRTL(lng);
  await i18n.changeLanguage(lng);
}

export { i18n };
export { useTranslation } from "react-i18next";
