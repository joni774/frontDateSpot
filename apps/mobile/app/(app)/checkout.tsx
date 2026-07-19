/**
 * In-app card checkout for VIP / DATING subscriptions.
 * Dev/staging charges via API mock card flow; production can swap to a payment gateway.
 */
import { purchaseSubscription } from "@datespot/api-client";
import type { SubscriptionTier } from "@datespot/shared-types";
import { Button, Input } from "@datespot/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAID_TIERS = new Set<SubscriptionTier>(["VIP", "DATING"]);

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function CheckoutScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ tier?: string }>();

  const tier = (params.tier?.toUpperCase() ?? "") as SubscriptionTier;
  const validTier = PAID_TIERS.has(tier);

  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const priceLabel = useMemo(() => {
    if (tier === "VIP") return t("subscription.vipPrice");
    if (tier === "DATING") return t("subscription.datingPrice");
    return "";
  }, [t, tier]);

  const planTitle = useMemo(() => {
    if (tier === "VIP") return t("subscription.vip");
    if (tier === "DATING") return t("subscription.dating");
    return "";
  }, [t, tier]);

  const payMutation = useMutation({
    mutationFn: () =>
      purchaseSubscription(tier, {
        cardNumber: cardNumber.replace(/\s+/g, ""),
        cardExpiry,
        cardCvv,
        cardHolder: cardHolder.trim(),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      await queryClient.invalidateQueries({ queryKey: ["nearby-status"] });
      Alert.alert(t("common.success"), t("checkout.success"), [
        { text: t("common.ok"), onPress: () => router.replace("/(app)/subscription") },
      ]);
    },
    onError: () => Alert.alert(t("common.error"), t("checkout.failed")),
  });

  const canPay =
    validTier &&
    cardHolder.trim().length >= 2 &&
    cardNumber.replace(/\s+/g, "").length >= 12 &&
    /^\d{2}\/\d{2}$/.test(cardExpiry) &&
    /^\d{3,4}$/.test(cardCvv);

  if (!validTier) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Text className="text-text text-center mb-4">{t("checkout.invalidPlan")}</Text>
        <Button onPress={() => router.back()}>{t("common.back")}</Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView testID="checkout-screen" className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-lg">← {t("common.back")}</Text>
        </Pressable>
        <Text className="text-xl font-bold text-text">{t("checkout.title")}</Text>
      </View>

      <ScrollView className="p-4" keyboardShouldPersistTaps="handled">
        <View className="bg-white rounded-2xl border border-primary/30 p-5 mb-4">
          <Text className="text-lg font-bold text-primary mb-1">{planTitle}</Text>
          <Text className="text-2xl font-bold text-text mb-2">{priceLabel}</Text>
          <Text className="text-gray-500 text-sm">{t("checkout.monthly")}</Text>
        </View>

        <Text className="text-base font-semibold text-text mb-3">
          {t("checkout.cardDetails")}
        </Text>

        <Input
          label={t("checkout.cardHolder")}
          value={cardHolder}
          onChangeText={setCardHolder}
          autoCapitalize="words"
        />
        <Input
          label={t("checkout.cardNumber")}
          value={cardNumber}
          onChangeText={(v) => setCardNumber(formatCardNumber(v))}
          keyboardType="number-pad"
        />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input
              label={t("checkout.expiry")}
              value={cardExpiry}
              onChangeText={(v) => setCardExpiry(formatExpiry(v))}
              keyboardType="number-pad"
              placeholder="MM/YY"
            />
          </View>
          <View className="flex-1">
            <Input
              label={t("checkout.cvv")}
              value={cardCvv}
              onChangeText={(v) => setCardCvv(v.replace(/\D/g, "").slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
            />
          </View>
        </View>

        <Text className="text-gray-500 text-xs mb-4 leading-5">
          {t("checkout.secureNote")}
        </Text>

        <Button
          onPress={() => payMutation.mutate()}
          loading={payMutation.isPending}
          disabled={!canPay}
        >
          {t("checkout.payNow", { price: priceLabel })}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
