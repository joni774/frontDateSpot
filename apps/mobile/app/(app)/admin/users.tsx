/** Admin users list — paginated with subscription tier management. */
import {
  fetchAdminUsers,
  updateUserSubscription,
} from "@datespot/api-client";
import type { SubscriptionTier } from "@datespot/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TIERS: SubscriptionTier[] = ["FREE", "VIP", "DATING"];
type TierFilter = SubscriptionTier | "ALL";

export default function AdminUsersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [tierFilter, setTierFilter] = useState<TierFilter>("ALL");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users", page],
    queryFn: () => fetchAdminUsers(page),
  });

  const filteredUsers = useMemo(() => {
    if (!data?.users) return [];
    if (tierFilter === "ALL") return data.users;
    return data.users.filter((u) => u.subscriptionTier === tierFilter);
  }, [data?.users, tierFilter]);

  const tierMutation = useMutation({
    mutationFn: ({ id, tier }: { id: string; tier: SubscriptionTier }) =>
      updateUserSubscription(id, tier),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    onError: () => Alert.alert(t("common.error"), t("admin.updateTierFailed")),
  });

  const showTierPicker = (userId: string, currentTier: SubscriptionTier) => {
    Alert.alert(t("admin.changeTier"), undefined, [
      ...TIERS.map((tier) => ({
        text: tier,
        onPress: () => tierMutation.mutate({ id: userId, tier }),
      })),
      { text: t("common.cancel"), style: "cancel" as const },
    ].filter(() => true));
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-lg">← {t("common.back")}</Text>
        </Pressable>
        <Text className="text-xl font-bold text-text">{t("admin.users")}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-100 px-4 py-2"
        contentContainerStyle={{ gap: 8 }}
      >
        {(["ALL", ...TIERS] as TierFilter[]).map((tier) => (
          <Pressable
            key={tier}
            onPress={() => setTierFilter(tier)}
            className={`px-4 py-2 rounded-full ${
              tierFilter === tier ? "bg-primary" : "bg-gray-100"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                tierFilter === tier ? "text-white" : "text-gray-700"
              }`}
            >
              {tier === "ALL" ? t("admin.allTiers") : tier}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#B84A62" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-center">
            {error instanceof Error ? error.message : t("common.error")}
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
                <Text className="text-base font-semibold text-text">
                  {item.fullName}
                  {item.isAdmin ? ` (${t("admin.adminBadge")})` : ""}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">{item.email}</Text>
                <Text className="text-sm text-gray-500">{item.phone}</Text>
                <Text className="text-xs text-gray-400 mt-1">
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
                <Pressable
                  disabled={item.isAdmin || tierMutation.isPending}
                  onPress={() =>
                    showTierPicker(item.id, item.subscriptionTier)
                  }
                  className={`mt-3 px-3 py-2 rounded-lg border border-gray-200 self-start ${
                    item.isAdmin ? "opacity-40" : ""
                  }`}
                >
                  <Text className="text-sm font-medium text-primary">
                    {t("admin.plan")}: {item.subscriptionTier}
                  </Text>
                </Pressable>
              </View>
            )}
            ListEmptyComponent={
              <Text className="text-center text-gray-500 py-8">
                {t("admin.noUsers")}
              </Text>
            }
          />

          {data && data.totalPages > 1 && (
            <View className="flex-row items-center justify-between px-4 py-3 bg-white border-t border-gray-100">
              <Text className="text-sm text-gray-500">
                {t("admin.pageOf", {
                  page: data.page,
                  total: data.totalPages,
                  count: data.total,
                })}
              </Text>
              <View className="flex-row gap-2">
                <Pressable
                  disabled={page <= 1}
                  onPress={() => setPage((p) => p - 1)}
                  className={`px-3 py-1.5 rounded-lg border border-gray-200 ${
                    page <= 1 ? "opacity-40" : ""
                  }`}
                >
                  <Text className="text-sm">{t("admin.previous")}</Text>
                </Pressable>
                <Pressable
                  disabled={page >= data.totalPages}
                  onPress={() => setPage((p) => p + 1)}
                  className={`px-3 py-1.5 rounded-lg border border-gray-200 ${
                    page >= data.totalPages ? "opacity-40" : ""
                  }`}
                >
                  <Text className="text-sm">{t("admin.next")}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}
