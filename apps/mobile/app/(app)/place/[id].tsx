/**
 * Place detail screen with gallery, hours, navigation (Google Maps/Waze), WhatsApp share, and save.
 * Maps navigation uses Linking.openURL with geo: or platform-specific map URLs.
 * Contact CTAs (call / WhatsApp / website) record commissionable leads when authenticated.
 */
import {
  addFavorite,
  fetchPlace,
  fetchPlaceReviews,
  recordPlaceLead,
  removeFavorite,
  savePlace,
  submitPlaceReview,
  unsavePlace,
} from "@datespot/api-client";
import type { LeadType, PlaceCategory, PriceRange } from "@datespot/shared-types";
import { Button } from "@datespot/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PlaceThumbnail } from "../../../src/components/PlaceThumbnail";

import { PlaceActionsBar } from "../../../src/components/PlaceActionsBar";
import { PlaceMap } from "../../../src/components/PlaceMap";
import { colors } from "../../../src/theme/colors";
import {
  DELIVERY_LEAD_TYPE,
  type DeliveryPlatform,
  resolveDeliveryUrl,
  shouldShowDeliveryOrder,
} from "../../../src/lib/deliveryOrder";
import {
  openPlaceCall,
  openPlaceNavigation,
  openPlaceWhatsApp,
  safeOpenUrl,
} from "../../../src/lib/placeActions";
import { isRtl } from "../../../src/lib/rtl";

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

function hasKnownHours(openingHours: Record<string, string> | undefined): boolean {
  if (!openingHours) return false;
  return Object.values(openingHours).some(
    (value) => typeof value === "string" && value.trim().length > 0 && value.toLowerCase() !== "closed"
  );
}

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [showHours, setShowHours] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const {
    data: place,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["place", id, i18n.language],
    queryFn: () => fetchPlace(id!, i18n.language),
    enabled: !!id,
  });

  const {
    data: reviewsData,
    isError: reviewsError,
    refetch: refetchReviews,
  } = useQuery({
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
    onError: () => {
      Alert.alert(t("common.error"), t("place.actionFailed"));
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
    onError: () => {
      Alert.alert(t("common.error"), t("place.actionFailed"));
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
    onError: () => {
      Alert.alert(t("common.error"), t("place.reviewFailed"));
    },
  });

  const trackLead = async (type: LeadType) => {
    if (!id) return;
    try {
      await recordPlaceLead(id, type);
    } catch {
      // Lead tracking must not block the contact action.
    }
  };

  /** Directions via Waze / Google Maps / Apple Maps. */
  const openMaps = () => {
    if (!place) return;
    openPlaceNavigation(
      { name: place.name, latitude: place.latitude, longitude: place.longitude },
      {
        title: t("place.navigate"),
        waze: t("place.waze"),
        googleMaps: t("place.googleMaps"),
        appleMaps: t("place.appleMaps"),
        cancel: t("common.cancel"),
      },
      {
        onNavigate: () => {
          void trackLead("NAVIGATE");
        },
      }
    );
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

  const callPlace = async () => {
    if (!place?.phone) return;
    await trackLead("CALL");
    openPlaceCall(place.phone, t("place.linkOpenError"));
  };

  const bookViaWhatsApp = async () => {
    if (!place?.phone) return;
    await trackLead("WHATSAPP");
    openPlaceWhatsApp(
      place.phone,
      t("place.bookWhatsAppText", { name: place.name }),
      t("place.linkOpenError")
    );
  };

  const openWebsite = async () => {
    if (!place?.website) return;
    await trackLead("WEBSITE");
    await safeOpenUrl(place.website, t("place.linkOpenError"));
  };

  const openDelivery = async (platform: DeliveryPlatform) => {
    if (!place) return;
    await trackLead(DELIVERY_LEAD_TYPE[platform]);
    await safeOpenUrl(resolveDeliveryUrl(platform, place), t("place.linkOpenError"));
  };

  if (isLoading && !place) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !place) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-text text-center mb-4">{t("place.loadError")}</Text>
        <Pressable
          onPress={() => void refetch()}
          className="px-4 py-3 rounded-lg bg-primary"
          disabled={isRefetching}
        >
          <Text className="text-white font-semibold">{t("common.retry")}</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} className="mt-4 px-4 py-2">
          <Text className="text-primary">{t("common.back")}</Text>
        </Pressable>
      </View>
    );
  }

  const todayKey = getTodayKey();
  const knownHours = hasKnownHours(place.openingHours as Record<string, string>);
  const todayHours = knownHours
    ? (place.openingHours[todayKey] ?? t("place.closedDay"))
    : t("place.hoursUnknown");
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
              <PlaceThumbnail
                uri={item}
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
            <Text className="text-white text-lg">{isRtl() ? "→" : "←"}</Text>
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
          {place.isSponsored ? (
            <View className="px-2.5 py-1 rounded-md bg-text/90" testID="sponsored-badge">
              <Text className="text-sm font-medium text-white">{t("place.sponsored")}</Text>
            </View>
          ) : null}
          <View className={`px-2.5 py-1 rounded-md ${CATEGORY_COLORS[place.category]}`}>
            <Text className="text-sm font-medium">
              {t(`place.categories.${place.category}`)}
            </Text>
          </View>
          <View
            className={`px-2.5 py-1 rounded-md ${
              !knownHours
                ? "bg-cream"
                : place.isOpen
                  ? "bg-secondary/10"
                  : "bg-primary/10"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                !knownHours
                  ? "text-text-muted"
                  : place.isOpen
                    ? "text-secondary"
                    : "text-primary"
              }`}
            >
              {!knownHours
                ? t("place.hoursUnknown")
                : place.isOpen
                  ? t("place.openNow")
                  : t("place.closed")}
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

        <View className="mt-3 mb-4">
          <PlaceActionsBar
            onNavigate={openMaps}
            onCall={place.phone ? () => void callPlace() : undefined}
            onWhatsApp={place.phone ? () => void bookViaWhatsApp() : undefined}
            navigateLabel={t("place.navigate")}
            callLabel={t("place.call")}
            whatsappLabel={t("place.whatsapp")}
          />
        </View>

        {shouldShowDeliveryOrder(place) ? (
          <View
            testID="place-delivery-order"
            className="mb-5 rounded-2xl border border-primary/25 bg-primary/5 p-4"
          >
            <Text className="text-lg font-bold text-text mb-1">
              {t("place.deliveryTitle")}
            </Text>
            <Text className="text-text-muted text-sm mb-3 leading-5">
              {t("place.deliverySubtitle")}
            </Text>
            <View className="flex-row items-center justify-between mb-4 rounded-xl bg-surface px-3 py-3">
              <Text className="text-text-muted text-sm">{t("place.orderPriceLabel")}</Text>
              <Text className="text-xl font-bold text-text">
                {formatPrice(t, place.priceRange)}
              </Text>
            </View>
            <View style={{ gap: 10 }}>
              <Button onPress={() => void openDelivery("wolt")}>
                {t("place.orderWolt")}
              </Button>
              <Button variant="secondary" onPress={() => void openDelivery("tenbis")}>
                {t("place.orderTenBis")}
              </Button>
              <Button variant="secondary" onPress={() => void openDelivery("mishloha")}>
                {t("place.orderMishloha")}
              </Button>
              <Button variant="secondary" onPress={() => void openDelivery("cibus")}>
                {t("place.orderCibus")}
              </Button>
            </View>
          </View>
        ) : null}

        <View
          style={{
            height: 220,
            borderRadius: 16,
            overflow: "hidden",
            marginBottom: 16,
            backgroundColor: colors.surfaceContainer,
          }}
        >
          <PlaceMap
            coords={{ lat: place.latitude, lng: place.longitude }}
            places={[place]}
            selectedPlaceId={place.id}
            zoomDelta={0.012}
          />
        </View>

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
              <Pressable onPress={() => void callPlace()}>
                <Text className="font-medium text-primary">{place.phone}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {place.website ? (
          <Button variant="outline" onPress={() => void openWebsite()} style={{ marginBottom: 12 }}>
            {t("place.website")}
          </Button>
        ) : null}
        <Button variant="outline" onPress={shareWhatsApp} style={{ marginBottom: 16 }}>
          {t("place.share")}
        </Button>

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

          {reviewsError ? (
            <Pressable onPress={() => void refetchReviews()} className="mt-4">
              <Text className="text-primary">{t("place.reviewsLoadError")} — {t("common.retry")}</Text>
            </Pressable>
          ) : null}

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
