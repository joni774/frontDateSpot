/** Interactive map with place markers from the API. */
import { fetchPlaces } from "@datespot/api-client";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PlaceMap } from "../../../src/components/PlaceMap";
import {
  DEFAULT_COORDS,
  DEFAULT_PLACES_RADIUS_KM,
  resolveDeviceCoords,
} from "../../../src/lib/deviceLocation";

export default function MapScreen() {
  const { t, i18n } = useTranslation();
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const locatingLock = useRef(false);

  const loadLocation = useCallback(async () => {
    if (Platform.OS === "web" || locatingLock.current) return;
    locatingLock.current = true;
    try {
      const result = await resolveDeviceCoords();
      setCoords(result.coords);
    } finally {
      locatingLock.current = false;
    }
  }, []);

  useEffect(() => {
    void loadLocation();
  }, [loadLocation]);

  const { data: places = [], isFetching } = useQuery({
    queryKey: ["map-places", coords.lat, coords.lng],
    queryFn: () =>
      fetchPlaces({
        lat: coords.lat,
        lng: coords.lng,
        language: i18n.language,
        radius: DEFAULT_PLACES_RADIUS_KM,
      }),
  });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-4 py-3 bg-surface border-b border-border">
        <Text className="text-xl font-semibold text-text">{t("tabs.map")}</Text>
      </View>

      <View style={styles.mapWrap}>
        <PlaceMap coords={coords} places={places} />
        {isFetching ? (
          <View style={styles.fetchBadge}>
            <ActivityIndicator size="small" color="#7C3048" />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    flex: 1,
  },
  fetchBadge: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
