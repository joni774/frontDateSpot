/**
 * Place detail screen with gallery, hours, navigation (Google Maps/Waze), WhatsApp share, and save.
 * Maps navigation uses Linking.openURL with geo: or platform-specific map URLs.
 */
import {
  fetchPlace,
  savePlace,
  unsavePlace,
} from "@datespot/api-client";
import type { PlaceCategory, PriceRange } from "@datespot/shared-types";
import { Button } from "@datespot/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORY_COLORS: Record<PlaceCategory, string> = {
  ROMANTIC_DATE: "bg-pink-100 text-pink-700",
  RESTAURANT: "bg-orange-100 text-orange-700",
  DAIRY_RESTAURANT: "bg-sky-100 text-sky-700",
  MEAT_RESTAURANT: "bg-red-100 text-red-700",
  SUSHI: "bg-rose-100 text-rose-700",
  SUNSET: "bg-purple-100 text-purple-700",
  ATTRACTION: "bg-blue-100 text-blue-700",
};

const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function getTodayKey(): string {
  return DAYS[new Date().getDay()];
}

function formatPrice(t: (key: string) => string, range: PriceRange): string {
  return t(`place.priceRange.${range}`);
}

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showHours, setShowHours] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const { data: place, isLoading } = useQuery({
    queryKey: ["place", id],
    queryFn: () => fetchPlace(id!),
    enabled: !!id,
  });

  const saveMutation = useMutation({
    mutationFn: async (saved: boolean) => {
      if (saved) {
        await unsavePlace(id!);
      } else {
        await savePlace(id!);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["place", id] });
      queryClient.invalidateQueries({ queryKey: ["saved-places"] });
    },
  });

  /** Opens native maps app with lat/lng — Google Maps URL works cross-platform. */
  const openMaps = () => {
    if (!place) return;
    const { latitude, longitude, name } = place;
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}(${encodeURIComponent(name)})`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(name)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });
    if (url) Linking.openURL(url);
  };

  const shareWhatsApp = () => {
    if (!place) return;
    const text = t("place.shareText", {
      name: place.name,
      address: place.address,
      distance: place.distance?.toFixed(1) ?? "?",
      km: t("home.km"),
    });
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  if (isLoading || !place) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#E84393" />
      </View>
    );
  }

  const todayKey = getTodayKey();
  const todayHours = place.openingHours[todayKey] ?? t("place.closedDay");
  const width = Dimensions.get("window").width;

  return (
    <View className="flex-1 bg-white">
      <View className="relative">
        {place.images.length > 0 ? (
          <FlatList
            data={place.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setGalleryIndex(idx);
            }}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={{ width, height: 280 }}
                resizeMode="cover"
              />
            )}
          />
        ) : (
          <View style={{ width, height: 280 }} className="bg-gray-200 items-center justify-center">
            <Text className="text-5xl">📍</Text>
          </View>
        )}

        <SafeAreaView className="absolute top-0 left-0 right-0 flex-row justify-between px-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
          >
            <Text className="text-white text-lg">←</Text>
          </Pressable>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => saveMutation.mutate(!!place.isSaved)}
              className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
            >
              <Text className="text-lg">{place.isSaved ? "❤️" : "🤍"}</Text>
            </Pressable>
            <Pressable
              onPress={shareWhatsApp}
              className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
            >
              <Text className="text-lg">↗</Text>
            </Pressable>
          </View>
        </SafeAreaView>

        {place.images.length > 1 ? (
          <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-1">
            {place.images.map((_, i) => (
              <View
                key={i}
                className={`w-2 h-2 rounded-full ${i === galleryIndex ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </View>
        ) : null}
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <Text className="text-2xl font-bold text-text mb-2">{place.name}</Text>

        <View className="flex-row flex-wrap gap-2 mb-3">
          <View className={`px-3 py-1 rounded-full ${CATEGORY_COLORS[place.category]}`}>
            <Text className="text-sm font-medium">
              {t(`place.categories.${place.category}`)}
            </Text>
          </View>
          <View
            className={`px-3 py-1 rounded-full ${place.isOpen ? "bg-green-100" : "bg-red-100"}`}
          >
            <Text
              className={`text-sm font-medium ${place.isOpen ? "text-green-700" : "text-red-700"}`}
            >
              {place.isOpen ? t("place.openNow") : t("place.closed")}
            </Text>
          </View>
        </View>

        {place.distance != null ? (
          <Text className="text-gray-500 mb-1">
            {place.distance.toFixed(1)} {t("home.km")} · {place.address}
          </Text>
        ) : (
          <Text className="text-gray-500 mb-1">{place.address}</Text>
        )}

        <Text className="text-gray-700 my-4 leading-6">{place.description}</Text>

        <View className="flex-row flex-wrap mb-4">
          <View className="w-1/2 p-2">
            <Text className="text-gray-400 text-xs mb-1">💰 {t("place.price")}</Text>
            <Text className="font-medium">{formatPrice(t, place.priceRange)}</Text>
          </View>
          <View className="w-1/2 p-2">
            <Text className="text-gray-400 text-xs mb-1">🕐 {t("place.today")}</Text>
            <Text className="font-medium">{todayHours}</Text>
          </View>
          <View className="w-1/2 p-2">
            <Text className="text-gray-400 text-xs mb-1">📍 {t("place.address")}</Text>
            <Text className="font-medium">{place.address}</Text>
          </View>
          {place.phone ? (
            <View className="w-1/2 p-2">
              <Text className="text-gray-400 text-xs mb-1">📞 {t("place.phone")}</Text>
              <Pressable onPress={() => Linking.openURL(`tel:${place.phone}`)}>
                <Text className="font-medium text-primary">{place.phone}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <Button onPress={openMaps} style={{ marginBottom: 12 }}>
          {t("place.navigate")}
        </Button>
        <Button variant="outline" onPress={shareWhatsApp} style={{ marginBottom: 24 }}>
          {t("place.share")}
        </Button>

        <Pressable
          onPress={() => setShowHours(!showHours)}
          className="border-t border-gray-100 pt-4 mb-8"
        >
          <Text className="font-semibold text-text mb-2">
            {t("place.openingHours")} {showHours ? "▲" : "▼"}
          </Text>
          {showHours
            ? DAYS.map((day) => (
                <View key={day} className="flex-row justify-between py-1">
                  <Text className="text-gray-600">{t(`place.days.${day}`)}</Text>
                  <Text className="text-text">
                    {place.openingHours[day] ?? t("place.closedDay")}
                  </Text>
                </View>
              ))
            : null}
        </Pressable>
      </ScrollView>
    </View>
  );
}
