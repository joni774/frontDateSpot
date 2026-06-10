/** Admin dashboard — stats overview and navigation to management screens. */
import { fetchAdminStats } from "@datespot/api-client";
import type { PlaceCategory } from "@datespot/shared-types";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View className="bg-white rounded-xl border border-gray-200 p-4 flex-1 min-w-[45%]">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-2xl font-bold text-text mt-1">
        {value.toLocaleString()}
      </Text>
    </View>
  );
}

export default function AdminDashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
  });

  const categories = data
    ? (Object.entries(data.placesByCategory) as [PlaceCategory, number][])
    : [];
  const maxCount = Math.max(...categories.map(([, c]) => c), 1);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-lg">← {t("common.back")}</Text>
        </Pressable>
        <Text className="text-xl font-bold text-text">{t("admin.title")}</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#E84393" />
        </View>
      ) : error || !data ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-center mb-4">
            {error instanceof Error ? error.message : t("common.error")}
          </Text>
          <Pressable onPress={() => void refetch()}>
            <Text className="text-primary font-semibold">{t("common.retry")}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 py-4">
          <View className="flex-row flex-wrap gap-3 mb-6">
            <StatCard label={t("admin.totalUsers")} value={data.totalUsers} />
            <StatCard
              label={t("admin.weeklyActive")}
              value={data.weeklyActiveUsers}
            />
            <StatCard label={t("admin.totalPlaces")} value={data.totalPlaces} />
            <StatCard
              label={t("admin.premiumUsers")}
              value={data.premiumUsers}
            />
          </View>

          <View className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <Text className="text-lg font-semibold text-text mb-4">
              {t("admin.placesByCategory")}
            </Text>
            {categories.map(([category, count]) => (
              <View key={category} className="mb-3">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm font-medium text-gray-700">
                    {t(`place.categories.${category}`)}
                  </Text>
                  <Text className="text-sm text-gray-500">{count}</Text>
                </View>
                <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </View>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => router.push("/(app)/admin/places")}
            className="bg-white rounded-xl border border-gray-200 p-4 mb-3 flex-row justify-between items-center"
          >
            <Text className="text-base font-semibold text-text">
              {t("admin.managePlaces")}
            </Text>
            <Text className="text-gray-400">→</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(app)/admin/users")}
            className="bg-white rounded-xl border border-gray-200 p-4 mb-3 flex-row justify-between items-center"
          >
            <Text className="text-base font-semibold text-text">
              {t("admin.manageUsers")}
            </Text>
            <Text className="text-gray-400">→</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
