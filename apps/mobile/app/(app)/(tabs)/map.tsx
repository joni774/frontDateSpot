/** Interactive map with place markers from the API. */
import { fetchPlaces } from "@datespot/api-client";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

const DEFAULT = { lat: 32.0853, lng: 34.7818 };

export default function MapScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [coords, setCoords] = useState(DEFAULT);

  useEffect(() => {
    (async () => {
      if (Platform.OS === "web") return;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  const { data: places = [], isLoading } = useQuery({
    queryKey: ["map-places", coords.lat, coords.lng],
    queryFn: () =>
      fetchPlaces({
        lat: coords.lat,
        lng: coords.lng,
        language: i18n.language,
        radius: 50,
      }),
  });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-text">{t("tabs.map")}</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#B84A62" />
        </View>
      ) : (
        <MapView
          style={{ flex: 1 }}
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
      )}
    </SafeAreaView>
  );
}
