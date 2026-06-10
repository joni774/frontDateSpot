/**
 * Subscription plans screen. Tier logic: FREE sees locked places 6+;
 * PREMIUM/VIP unlock all. Payment buttons show "Coming soon" for MVP.
 */
import { getStoredUser } from "@datespot/api-client";
import type { SubscriptionTier } from "@datespot/shared-types";
import { Button } from "@datespot/ui";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Plan {
  tier: SubscriptionTier;
  price: string;
  features: string[];
  highlight?: boolean;
  gold?: boolean;
}

export default function SubscriptionScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: getStoredUser,
  });

  const currentTier = user?.subscriptionTier ?? "FREE";

  const plans: Plan[] = [
    {
      tier: "FREE",
      price: t("subscription.free"),
      features: [t("subscription.features.free1"), t("subscription.features.free2")],
    },
    {
      tier: "PREMIUM",
      price: t("subscription.premiumPrice"),
      features: [
        t("subscription.features.premium1"),
        t("subscription.features.premium2"),
        t("subscription.features.premium3"),
      ],
      highlight: true,
    },
    {
      tier: "VIP",
      price: t("subscription.vipPrice"),
      features: [
        t("subscription.features.vip1"),
        t("subscription.features.vip2"),
        t("subscription.features.vip3"),
      ],
      gold: true,
    },
  ];

  const handleSubscribe = () => {
    Alert.alert(t("subscription.comingSoon"));
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-lg">← {t("common.back")}</Text>
        </Pressable>
        <Text className="text-xl font-bold text-text">
          {t("subscription.title")}
        </Text>
      </View>

      <ScrollView className="p-4">
        {plans.map((plan) => {
          const isCurrent = currentTier === plan.tier;
          const borderClass = plan.highlight
            ? "border-2 border-primary"
            : plan.gold
              ? "border-2 border-yellow-400"
              : "border border-gray-200";

          return (
            <View
              key={plan.tier}
              className={`bg-white rounded-2xl p-5 mb-4 ${borderClass}`}
            >
              {plan.highlight ? (
                <View className="absolute -top-3 self-center bg-primary px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-bold">
                    {t("subscription.mostPopular")}
                  </Text>
                </View>
              ) : null}

              <View className="flex-row items-center justify-between mb-2">
                <Text
                  className={`text-lg font-bold ${plan.gold ? "text-yellow-600" : "text-text"}`}
                >
                  {t(`subscription.${plan.tier.toLowerCase()}` as "subscription.free")}
                </Text>
                {isCurrent ? <Text className="text-primary text-xl">✓</Text> : null}
              </View>

              <Text className="text-2xl font-bold text-text mb-3">{plan.price}</Text>

              {plan.features.map((feature) => (
                <Text key={feature} className="text-gray-600 mb-1">
                  • {feature}
                </Text>
              ))}

              {!isCurrent && plan.tier !== "FREE" ? (
                <Button onPress={handleSubscribe} style={{ marginTop: 16 }}>
                  {t("subscription.subscribe")}
                </Button>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
