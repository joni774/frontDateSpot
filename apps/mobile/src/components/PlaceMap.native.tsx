/** Native map implementation — loaded only on iOS/Android via Metro platform extension. */
import { useRouter } from "expo-router";
import { Platform, StyleSheet } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

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

export function PlaceMap({ coords, places }: PlaceMapProps) {
  const router = useRouter();

  return (
    <MapView
      style={styles.map}
      provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
      initialRegion={{
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }}
      showsUserLocation
    >
      {places.map((place) => (
        <Marker
          key={place.id}
          coordinate={{
            latitude: place.latitude ?? coords.lat,
            longitude: place.longitude ?? coords.lng,
          }}
          title={place.name}
          onCalloutPress={() => router.push(`/(app)/place/${place.id}`)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
