/** Default / web map stub — react-native-maps is native-only. */
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

type PlaceMarker = {
  id: string;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
};

type PlaceMapProps = {
  coords: { lat: number; lng: number };
  places: PlaceMarker[];
};

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
