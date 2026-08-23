import { I18nManager } from "react-native";

export function isRtl(): boolean {
  return I18nManager.isRTL;
}

/** Physical alignment for Hebrew/Arabic without mirroring the whole layout. */
export function textAlignStart(): "left" | "right" {
  return isRtl() ? "right" : "left";
}
