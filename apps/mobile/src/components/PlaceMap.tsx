/** Default / web map stub — native maps are iOS Apple Maps / Android Mapbox. */
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import type { PlaceMapProps } from "./placeMapTypes";

export function PlaceMap(_props: PlaceMapProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-text-muted text-center text-base leading-6">
        {t("map.webUnavailable")}
      </Text>
    </View>
  );
}
