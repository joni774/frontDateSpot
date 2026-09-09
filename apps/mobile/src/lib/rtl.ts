import { I18nManager, Platform } from "react-native";

export function isRtlLanguage(lng: string): boolean {
  const base = lng.split("-")[0];
  return base === "he" || base === "ar";
}

export function layoutDirection(lng?: string | null): "rtl" | "ltr" {
  return isRtlLanguage(lng || "he") ? "rtl" : "ltr";
}

export function isRtl(): boolean {
  return I18nManager.isRTL;
}

/** Physical alignment for Hebrew/Arabic without mirroring the whole layout. */
export function textAlignStart(): "left" | "right" {
  return isRtl() ? "right" : "left";
}

export function applyWebDocumentDir(lng: string): void {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  const rtl = isRtlLanguage(lng);
  document.documentElement.dir = rtl ? "rtl" : "ltr";
  document.documentElement.lang = lng.split("-")[0];
}

/** Configure native RTL flags. Returns true when a restart is needed for layout to flip. */
export function applyNativeRtl(lng: string): boolean {
  const shouldRtl = isRtlLanguage(lng);
  const directionChanged = I18nManager.isRTL !== shouldRtl;
  I18nManager.allowRTL(shouldRtl);
  I18nManager.forceRTL(shouldRtl);
  // Keep left/right as physical sides so Hebrew is RTL without a mirrored UI.
  // react-native-web doesn't implement this API — guard so web doesn't crash on boot.
  if (typeof I18nManager.swapLeftAndRightInRTL === "function") {
    I18nManager.swapLeftAndRightInRTL(false);
  }
  return directionChanged;
}

/** Synchronous boot — Hebrew RTL before AsyncStorage / i18n init on cold start. */
export function bootstrapRtlSync(language = "he"): void {
  applyNativeRtl(language);
  applyWebDocumentDir(language);
}
