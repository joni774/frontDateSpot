import { Text, View, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";
import type { KosherStatus } from "@datespot/shared-types";

type Props = {
  status?: KosherStatus;
  certification?: string | null;
  style?: ViewStyle;
};

export function KosherBadge({ status, certification, style }: Props) {
  const { t } = useTranslation();

  if (!status || status === "UNKNOWN" || status === "NONE") {
    return null;
  }

  const label =
    certification?.trim() ||
    (status === "PARTIAL" ? t("place.kosher.partial") : t("place.kosher.strict"));

  const bg = status === "PARTIAL" ? "bg-amber-100" : "bg-emerald-100";
  const textColor = status === "PARTIAL" ? "text-amber-900" : "text-emerald-900";

  return (
    <View className={`px-2 py-0.5 rounded-md ${bg}`} style={style} testID="kosher-badge">
      <Text className={`text-xs font-semibold ${textColor}`}>{label}</Text>
    </View>
  );
}

export function kosherBadgeLabel(
  status: KosherStatus | undefined,
  certification: string | null | undefined,
  t: (key: string) => string
): string | null {
  if (!status || status === "UNKNOWN" || status === "NONE") return null;
  return (
    certification?.trim() ||
    (status === "PARTIAL" ? t("place.kosher.partial") : t("place.kosher.strict"))
  );
}
