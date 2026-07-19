/**
 * Place detail screen with gallery, hours, navigation (Google Maps/Waze), WhatsApp share, and save.
 * Maps navigation uses Linking.openURL with geo: or platform-specific map URLs.
 */
import {
  addFavorite,
  fetchPlace,
  fetchPlaceReviews,
  removeFavorite,
  savePlace,
  submitPlaceReview,
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
  TextInput,
  View,
} from "react-native";
import { Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORY_COLORS: Record<PlaceCategory, string> = {
  ROMANTIC_DATE: "bg-primary/10 text-primary",
  RESTAURANT: "bg-secondary/10 text-secondary",
  DAIRY_RESTAURANT: "bg-accent/15 text-accent",
  MEAT_RESTAURANT: "bg-primary/10 text-primary-dark",
  SUSHI: "bg-accent/10 text-accent",
  SUNSET: "bg-secondary/10 text-secondary",
  ATTRACTION: "bg-cream text-text-muted",
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
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const { data: place, isLoading } = useQuery({
    queryKey: ["place", id],
    queryFn: () => fetchPlace(id!),
    enabled: !!id,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ["place-reviews", id],
    queryFn: () => fetchPlaceReviews(id!),
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

  const favoriteMutation = useMutation({
    mutationFn: async (fav: boolean) => {
      if (fav) await removeFavorite(id!);
      else await addFavorite(id!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["place", id] });
      queryClient.invalidateQueries({ queryKey: ["favorite-places"] });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      submitPlaceReview(id!, { rating: reviewRating, text: reviewText.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["place-reviews", id] });
      queryClient.invalidateQueries({ queryKey: ["place", id] });
      setReviewText("");
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
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#7C3048" />
      </View>
    );
  }

  const todayKey = getTodayKey();
  const todayHours = place.openingHours[todayKey] ?? t("place.closedDay");
  const width = Dimensions.get("window").width;

  return (
    <View testID="place-detail" className="flex-1 bg-background">
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
          <View style={{ width, height: 280 }} className="bg-cream" />
        )}

        <SafeAreaView className="absolute top-0 left-0 right-0 flex-row justify-between px-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-lg bg-black/45 items-center justify-center"
          >
            <Text className="text-white text-lg">←</Text>
          </Pressable>
          <View className="flex-row gap-2">
            <Pressable
              testID="place-favorite-button"
              onPress={() => favoriteMutation.mutate(!!place.isFavorite)}
              className="w-10 h-10 rounded-lg bg-black/45 items-center justify-center"
            >
              <Text className="text-white text-lg">
                {place.isFavorite ? "★" : "☆"}
              </Text>
            </Pressable>
            <Pressable
              testID="place-save-button"
              onPress={() => saveMutation.mutate(!!place.isSaved)}
              className="w-10 h-10 rounded-lg bg-black/45 items-center justify-center"
            >
              <Text className="text-white text-lg">
                {place.isSaved ? "♥" : "♡"}
              </Text>
            </Pressable>
            <Pressable
              onPress={shareWhatsApp}
              className="w-10 h-10 rounded-lg bg-black/45 items-center justify-center"
            >
              <Text className="text-white text-lg">↗</Text>
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
          <View className={`px-2.5 py-1 rounded-md ${CATEGORY_COLORS[place.category]}`}>
            <Text className="text-sm font-medium">
              {t(`place.categories.${place.category}`)}
            </Text>
          </View>
          <View
            className={`px-2.5 py-1 rounded-md ${place.isOpen ? "bg-secondary/10" : "bg-primary/10"}`}
          >
            <Text
              className={`text-sm font-medium ${place.isOpen ? "text-secondary" : "text-primary"}`}
            >
              {place.isOpen ? t("place.openNow") : t("place.closed")}
            </Text>
          </View>
        </View>

        {place.distance != null ? (
          <Text className="text-text-muted mb-1">
            {place.distance.toFixed(1)} {t("home.km")} · {place.address}
          </Text>
        ) : (
          <Text className="text-text-muted mb-1">{place.address}</Text>
        )}

        {reviewsData?.averageRating != null ? (
          <Text className="text-text font-medium mb-2">
            ★ {reviewsData.averageRating.toFixed(1)} ({reviewsData.reviewCount} {t("place.reviews")})
          </Text>
        ) : null}

        {place.viewCount != null ? (
          <Text className="text-text-muted text-xs mb-2">
            {t("place.views", { count: place.viewCount })}
          </Text>
        ) : null}

        <Text className="text-text my-4 leading-6 opacity-90">{place.description}</Text>

        <View className="flex-row flex-wrap mb-4">
          <View className="w-1/2 p-2">
            <Text className="text-text-muted text-xs mb-1">{t("place.price")}</Text>
            <Text className="font-medium text-text">{formatPrice(t, place.priceRange)}</Text>
          </View>
          <View className="w-1/2 p-2">
            <Text className="text-text-muted text-xs mb-1">{t("place.today")}</Text>
            <Text className="font-medium text-text">{todayHours}</Text>
          </View>
          <View className="w-1/2 p-2">
            <Text className="text-text-muted text-xs mb-1">{t("place.address")}</Text>
            <Text className="font-medium text-text">{place.address}</Text>
          </View>
          {place.phone ? (
            <View className="w-1/2 p-2">
              <Text className="text-text-muted text-xs mb-1">{t("place.phone")}</Text>
              <Pressable onPress={() => Linking.openURL(`tel:${place.phone}`)}>
                <Text className="font-medium text-primary">{place.phone}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <Button onPress={openMaps} style={{ marginBottom: 12 }}>
          {t("place.navigate")}
        </Button>
        <Button variant="outline" onPress={shareWhatsApp} style={{ marginBottom: 16 }}>
          {t("place.share")}
        </Button>

        {place.deliveryWoltUrl || place.deliveryTenBisUrl || place.deliveryMishlohaUrl ? (
          <View className="mb-6">
            <Text className="font-semibold text-text mb-3">{t("place.deliveryTitle")}</Text>
            {place.deliveryWoltUrl ? (
              <Button
                variant="outline"
                onPress={() => Linking.openURL(place.deliveryWoltUrl!)}
                style={{ marginBottom: 8 }}
              >
                {t("place.orderWolt")}
              </Button>
            ) : null}
            {place.deliveryTenBisUrl ? (
              <Button
                variant="outline"
                onPress={() => Linking.openURL(place.deliveryTenBisUrl!)}
                style={{ marginBottom: 8 }}
              >
                {t("place.orderTenBis")}
              </Button>
            ) : null}
            {place.deliveryMishlohaUrl ? (
              <Button
                variant="outline"
                onPress={() => Linking.openURL(place.deliveryMishlohaUrl!)}
                style={{ marginBottom: 8 }}
              >
                {t("place.orderMishloha")}
              </Button>
            ) : null}
          </View>
        ) : null}

        <View className="border-t border-gray-100 pt-4 mb-8">
          <Text className="font-semibold text-text mb-3">{t("place.writeReview")}</Text>
          <View className="flex-row gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setReviewRating(star)}>
                <Text className="text-2xl">{star <= reviewRating ? "★" : "☆"}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={reviewText}
            onChangeText={setReviewText}
            placeholder={t("place.reviewPlaceholder")}
            multiline
            className="border border-gray-200 rounded-xl p-3 mb-3 text-text min-h-[80px]"
            textAlignVertical="top"
          />
          <Button onPress={() => reviewMutation.mutate()} loading={reviewMutation.isPending}>
            {t("place.submitReview")}
          </Button>

          {reviewsData?.reviews.map((review) => (
            <View key={review.id} className="mt-4 pb-3 border-b border-gray-100">
              <Text className="font-semibold text-text">{review.userName}</Text>
              <Text className="text-amber-600">{"★".repeat(review.rating)}</Text>
              {review.text ? <Text className="text-gray-600 mt-1">{review.text}</Text> : null}
            </View>
          ))}
        </View>

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
