/** Favorites list — separate from saved/bookmark hearts. */
import { fetchFavoritePlaces } from "@datespot/api-client";
import { PlaceCard } from "@datespot/ui";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const { data: places = [], isLoading } = useQuery({
    queryKey: ["favorite-places"],
    queryFn: () => fetchFavoritePlaces(),
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-3 bg-surface border-b border-border">
        <Text className="text-xl font-semibold text-text flex-1">{t("favorites.title")}</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7C3048" />
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
            />
          )}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-text-muted">{t("favorites.empty")}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
