/** Admin leads list — commissionable contact intents from users. */
import {
  createAdminLeadInvoices,
  fetchAdminLeadInvoices,
  fetchAdminLeads,
} from "@datespot/api-client";
import type { LeadType } from "@datespot/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
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

const LEAD_TYPES: Array<LeadType | "ALL"> = [
  "ALL",
  "CALL",
  "WHATSAPP",
  "WEBSITE",
  "NAVIGATE",
  "DELIVERY_WOLT",
  "DELIVERY_TENBIS",
  "DELIVERY_MISHLOHA",
  "DELIVERY_CIBUS",
];

function formatFee(agorot: number): string {
  return `₪${(agorot / 100).toFixed(2)}`;
}

export default function AdminLeadsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [type, setType] = useState<LeadType | "ALL">("ALL");
  const [tab, setTab] = useState<"leads" | "invoices">("leads");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-leads", page, type],
    queryFn: () =>
      fetchAdminLeads({
        page,
        limit: 30,
        type: type === "ALL" ? undefined : type,
      }),
    enabled: tab === "leads",
  });

  const {
    data: invoicesData,
    isLoading: invoicesLoading,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useQuery({
    queryKey: ["admin-lead-invoices"],
    queryFn: () => fetchAdminLeadInvoices({ page: 1, limit: 50 }),
    enabled: tab === "invoices",
  });

  const invoiceMutation = useMutation({
    mutationFn: () => createAdminLeadInvoices({ sendEmail: true }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-lead-invoices"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });

      const createdCount = result.created.length;
      const skippedCount = result.skipped.length;
      if (createdCount === 0 && skippedCount === 0) {
        Alert.alert(t("admin.invoiceLeads"), t("admin.invoiceNothingToBill"));
        return;
      }

      const lines = [
        t("admin.invoiceCreatedCount", { count: createdCount }),
        skippedCount > 0
          ? t("admin.invoiceSkippedCount", { count: skippedCount })
          : null,
      ].filter(Boolean);

      Alert.alert(t("admin.invoiceLeads"), lines.join("\n"));
      setTab("invoices");
    },
    onError: (err) => {
      Alert.alert(
        t("common.error"),
        err instanceof Error ? err.message : t("admin.invoiceFailed")
      );
    },
  });

  return (
    <SafeAreaView testID="admin-leads" className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-lg">← {t("common.back")}</Text>
        </Pressable>
        <Text className="text-xl font-bold text-text flex-1">{t("admin.leads")}</Text>
        <Pressable
          testID="admin-invoice-leads"
          disabled={invoiceMutation.isPending}
          onPress={() => invoiceMutation.mutate()}
          className="px-3 py-2 rounded-lg bg-primary"
        >
          {invoiceMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white text-sm font-semibold">{t("admin.invoiceLeads")}</Text>
          )}
        </Pressable>
      </View>

      <View className="flex-row bg-white border-b border-gray-100">
        {(["leads", "invoices"] as const).map((item) => {
          const active = tab === item;
          return (
            <Pressable
              key={item}
              onPress={() => setTab(item)}
              className={`flex-1 py-3 border-b-2 ${
                active ? "border-primary" : "border-transparent"
              }`}
            >
              <Text
                className={`text-center text-sm font-semibold ${
                  active ? "text-primary" : "text-gray-500"
                }`}
              >
                {item === "leads" ? t("admin.allLeads") : t("admin.leadInvoices")}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === "leads" ? (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="bg-white border-b border-gray-100"
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
          >
            {LEAD_TYPES.map((leadType) => {
              const active = type === leadType;
              return (
                <Pressable
                  key={leadType}
                  onPress={() => {
                    setType(leadType);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full border ${
                    active ? "bg-primary border-primary" : "bg-white border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${active ? "text-white" : "text-gray-600"}`}
                  >
                    {leadType === "ALL"
                      ? t("admin.allLeads")
                      : t(`admin.leadType.${leadType}`)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#7C3048" />
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-red-500 text-center mb-4">
                {error instanceof Error ? error.message : t("common.error")}
              </Text>
              <Pressable onPress={() => void refetch()}>
                <Text className="text-primary font-semibold">{t("common.retry")}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <FlatList
                data={data?.leads ?? []}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                  <View className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
                    <View className="flex-row justify-between items-start">
                      <Text className="text-base font-semibold text-text flex-1 mr-2">
                        {item.place.nameHe}
                      </Text>
                      <Text className="text-sm font-medium text-primary">
                        {formatFee(item.feeAgorot)}
                      </Text>
                    </View>
                    <Text className="text-sm text-gray-600 mt-1">
                      {t(`admin.leadType.${item.type}`)} · {item.user.fullName}
                    </Text>
                    <Text className="text-xs text-gray-400 mt-1">
                      {new Date(item.createdAt).toLocaleString()}
                    </Text>
                  </View>
                )}
                ListEmptyComponent={
                  <Text className="text-center text-gray-500 py-8">{t("admin.noLeads")}</Text>
                }
              />
              {data && data.totalPages > 1 ? (
                <View className="flex-row justify-between items-center px-4 py-3 bg-white border-t border-gray-100">
                  <Pressable
                    disabled={page <= 1}
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <Text
                      className={`font-medium ${page <= 1 ? "text-gray-300" : "text-primary"}`}
                    >
                      {t("admin.previous")}
                    </Text>
                  </Pressable>
                  <Text className="text-sm text-gray-500">
                    {t("admin.pageOf", {
                      page: data.page,
                      total: data.totalPages,
                      count: data.total,
                    })}
                  </Text>
                  <Pressable
                    disabled={page >= data.totalPages}
                    onPress={() => setPage((p) => p + 1)}
                  >
                    <Text
                      className={`font-medium ${
                        page >= data.totalPages ? "text-gray-300" : "text-primary"
                      }`}
                    >
                      {t("admin.next")}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          )}
        </>
      ) : invoicesLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7C3048" />
        </View>
      ) : invoicesError ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-center mb-4">
            {invoicesError instanceof Error ? invoicesError.message : t("common.error")}
          </Text>
          <Pressable onPress={() => void refetchInvoices()}>
            <Text className="text-primary font-semibold">{t("common.retry")}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={invoicesData?.invoices ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
              <View className="flex-row justify-between items-start">
                <Text className="text-base font-semibold text-text flex-1 mr-2">
                  {item.placeNameHe}
                </Text>
                <Text className="text-sm font-medium text-primary">
                  {formatFee(item.totalAgorot)}
                </Text>
              </View>
              <Text className="text-sm text-gray-600 mt-1">
                {t(`admin.invoiceStatus.${item.status}`)} · {item.leadCount}{" "}
                {t("admin.leadShort")}
              </Text>
              <Text className="text-xs text-gray-400 mt-1">
                {new Date(item.periodStart).toLocaleDateString()} –{" "}
                {new Date(item.periodEnd).toLocaleDateString()}
              </Text>
              {item.stripeInvoiceId ? (
                <Text className="text-xs text-gray-400 mt-1">{item.stripeInvoiceId}</Text>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <Text className="text-center text-gray-500 py-8">{t("admin.noInvoices")}</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}
