/** Saved places list fetched from GET /api/places/saved. */
import { fetchSavedPlaces } from "@datespot/api-client";
import { PlaceCard } from "@datespot/ui";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SavedScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const { data: places = [], isLoading } = useQuery({
    queryKey: ["saved-places"],
    queryFn: fetchSavedPlaces,
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-lg">← {t("common.back")}</Text>
        </Pressable>
        <Text className="text-xl font-bold text-text">
          {t("profile.savedPlaces")}
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#E84393" />
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
              <Text className="text-4xl mb-2">💕</Text>
              <Text className="text-gray-500">{t("saved.empty")}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
