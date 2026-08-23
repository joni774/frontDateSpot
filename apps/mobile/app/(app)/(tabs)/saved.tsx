/** Saved places list fetched from GET /api/places/saved. */
import { fetchSavedPlaces } from "@datespot/api-client";
import { PlaceCard } from "@datespot/ui";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../../src/theme/colors";

export default function SavedScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const { data: places = [], isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["saved-places", i18n.language],
    queryFn: () => fetchSavedPlaces(i18n.language),
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-3 bg-surface border-b border-border">
        <Text className="text-xl font-semibold text-text flex-1">
          {t("profile.savedPlaces")}
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-text text-center mb-4">{t("common.error")}</Text>
          <Pressable onPress={() => void refetch()} disabled={isRefetching}>
            <Text className="text-primary font-semibold">{t("common.retry")}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <PlaceCard
              place={item}
              onPress={() => router.push(`/(app)/place/${item.id}`)}
              sponsoredLabel={t("place.sponsored")}
              categoryLabel={t(`place.categories.${item.category}`)}
              priceLabel={t(`place.priceRange.${item.priceRange}`)}
              distanceLabel={
                item.distance != null
                  ? `${item.distance.toFixed(1)} ${t("home.km")}`
                  : null
              }
              noPhotoLabel={t("place.noPhoto")}
              lockedLabel={t("home.locked")}
            />
          )}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-text-muted">{t("saved.empty")}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
