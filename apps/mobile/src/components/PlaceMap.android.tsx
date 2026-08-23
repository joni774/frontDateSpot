/** Android map — Mapbox. */
import Mapbox from "@rnmapbox/maps";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { hasCoords, type PlaceMapProps } from "./placeMapTypes";

const MAPBOX_TOKEN =
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ||
  String(Constants.expoConfig?.extra?.mapboxAccessToken ?? "").trim();

if (MAPBOX_TOKEN) {
  Mapbox.setAccessToken(MAPBOX_TOKEN);
}

export function PlaceMap({ coords, places, selectedPlaceId, onPlacePress }: PlaceMapProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const markers = useMemo(() => places.filter(hasCoords), [places]);

  if (!MAPBOX_TOKEN) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>{t("map.mapboxMissingToken")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.Street}
        scaleBarEnabled={false}
        logoEnabled
        attributionEnabled
      >
        <Mapbox.Camera
          defaultSettings={{
            centerCoordinate: [coords.lng, coords.lat],
            zoomLevel: 13,
          }}
          centerCoordinate={[coords.lng, coords.lat]}
          zoomLevel={13}
          animationDuration={400}
        />
        <Mapbox.UserLocation visible />
        {markers.map((place) => (
          <Mapbox.PointAnnotation
            key={place.id}
            id={place.id}
            title={place.name}
            coordinate={[place.longitude, place.latitude]}
            onSelected={() => {
              if (onPlacePress) onPlacePress(place.id);
              else router.push(`/(app)/place/${place.id}`);
            }}
          >
            <View
              style={[styles.pin, place.id === selectedPlaceId && styles.pinSelected]}
              collapsable={false}
            />
          </Mapbox.PointAnnotation>
        ))}
      </Mapbox.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  fallbackText: {
    color: "#6B5B63",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  pin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#A43C12",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  pinSelected: {
    backgroundColor: "#FF7F50",
    width: 22,
    height: 22,
    borderRadius: 11,
  },
});
