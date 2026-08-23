/** iPhone map — Apple Maps. */
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { colors } from "../theme/colors";
import { hasCoords, type PlaceMapProps } from "./placeMapTypes";

export function PlaceMap({
  coords,
  places,
  selectedPlaceId,
  onPlacePress,
  zoomDelta = 0.08,
}: PlaceMapProps) {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    mapRef.current?.animateToRegion(
      {
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: zoomDelta,
        longitudeDelta: zoomDelta,
      },
      400
    );
  }, [coords.lat, coords.lng, zoomDelta]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: coords.lat,
          longitude: coords.lng,
          latitudeDelta: zoomDelta,
          longitudeDelta: zoomDelta,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {places.filter(hasCoords).map((place) => (
          <Marker
            key={place.id}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            title={place.name}
            pinColor={place.id === selectedPlaceId ? colors.coral : colors.primary}
            onPress={() => {
              if (onPlacePress) onPlacePress(place.id);
              else router.push(`/(app)/place/${place.id}`);
            }}
          />
        ))}
      </MapView>
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
});
