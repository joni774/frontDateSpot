/** Nearby people — age verify, opt-in visibility, discover & match. */
import {
  blockNearbyUser,
  fetchNearbyMatches,
  fetchNearbyStatus,
  fetchNearbyUsers,
  reportNearbyUser,
  sendNearbyInterest,
  updateNearbyPresence,
  verifyNearbyAge,
} from "@datespot/api-client";
import type { NearbyMatch, NearbyUser } from "@datespot/shared-types";
import { Button } from "@datespot/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DEFAULT_COORDS = { lat: 32.0853, lng: 34.7818 };

async function resolveCoords(): Promise<{ lat: number; lng: number; denied: boolean }> {
  if (Platform.OS === "web") {
    return { ...DEFAULT_COORDS, denied: false };
  }
  let permission = await Location.getForegroundPermissionsAsync();
  if (permission.status !== "granted" && permission.canAskAgain) {
    permission = await Location.requestForegroundPermissionsAsync();
  }
  if (permission.status !== "granted") {
    return { ...DEFAULT_COORDS, denied: true };
  }
  const loc = await Location.getCurrentPositionAsync({});
  return { lat: loc.coords.latitude, lng: loc.coords.longitude, denied: false };
}

function UserCard({
  user,
  onInterest,
  onBlock,
  onReport,
  t,
}: {
  user: NearbyUser;
  onInterest: (id: string) => void;
  onBlock: (id: string) => void;
  onReport: (id: string) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-full bg-primary/15 items-center justify-center">
            <Text className="text-primary font-bold text-lg">
              {user.displayName.slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text className="text-lg font-bold text-text">{user.displayName}</Text>
            <Text className="text-gray-500 text-sm">
              {t("nearby.yearsOld", { age: user.age })} · {user.approxDistance}
            </Text>
          </View>
        </View>
        {user.matched ? (
          <Text className="text-primary font-semibold">{t("nearby.matched")}</Text>
        ) : null}
      </View>

      <View className="flex-row gap-2 mt-2">
        {!user.matched && !user.interestSent ? (
          <View className="flex-1">
            <Button onPress={() => onInterest(user.id)}>{t("nearby.interest")}</Button>
          </View>
        ) : user.interestSent && !user.matched ? (
          <Text className="text-gray-500 py-3">{t("nearby.interested")}</Text>
        ) : null}
        <Pressable onPress={() => onBlock(user.id)} className="px-3 py-2">
          <Text className="text-red-500 text-sm">{t("nearby.block")}</Text>
        </Pressable>
        <Pressable onPress={() => onReport(user.id)} className="px-3 py-2">
          <Text className="text-gray-500 text-sm">{t("nearby.report")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function NearbyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [ageChecked, setAgeChecked] = useState(false);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [locationDenied, setLocationDenied] = useState(false);

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["nearby-status"],
    queryFn: fetchNearbyStatus,
  });

  const loadLocation = useCallback(async () => {
    const result = await resolveCoords();
    setCoords({ lat: result.lat, lng: result.lng });
    setLocationDenied(result.denied);
    return result;
  }, []);

  useEffect(() => {
    if (status?.isVisibleNearby) {
      setVisible(true);
    }
  }, [status?.isVisibleNearby]);

  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ["nearby-users", coords.lat, coords.lng, visible],
    queryFn: () => fetchNearbyUsers(coords.lat, coords.lng),
    enabled: !!status?.ageVerified && !!status?.datingSubscribed && visible,
    refetchInterval: visible ? 30_000 : false,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["nearby-matches"],
    queryFn: fetchNearbyMatches,
    enabled: !!status?.ageVerified && !!status?.datingSubscribed,
  });

  useEffect(() => {
    if (status?.ageVerified && status?.datingSubscribed && visible) {
      void loadLocation().then(() => refetchUsers());
    }
  }, [status?.ageVerified, status?.datingSubscribed, visible, loadLocation, refetchUsers]);

  const verifyMutation = useMutation({
    mutationFn: verifyNearbyAge,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nearby-status"] }),
    onError: () => Alert.alert(t("common.error"), t("nearby.ageFailed")),
  });

  const presenceMutation = useMutation({
    mutationFn: async (nextVisible: boolean) => {
      const loc = await loadLocation();
      if (nextVisible && loc.denied) {
        throw new Error("location_denied");
      }
      return updateNearbyPresence({
        visible: nextVisible,
        lat: loc.lat,
        lng: loc.lng,
      });
    },
    onSuccess: (_data, nextVisible) => {
      setVisible(nextVisible);
      queryClient.invalidateQueries({ queryKey: ["nearby-status"] });
      queryClient.invalidateQueries({ queryKey: ["nearby-users"] });
    },
    onError: (err) => {
      if (err instanceof Error && err.message === "location_denied") {
        Alert.alert(t("common.error"), t("nearby.locationRequired"), [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("nearby.openSettings"), onPress: () => void Linking.openSettings() },
        ]);
        setVisible(false);
        return;
      }
      Alert.alert(t("common.error"), t("nearby.loadError"));
      setVisible(false);
    },
  });

  const interestMutation = useMutation({
    mutationFn: sendNearbyInterest,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["nearby-users"] });
      queryClient.invalidateQueries({ queryKey: ["nearby-matches"] });
      if (data.matched) {
        Alert.alert(t("common.success"), t("nearby.matchAlert"));
      }
    },
  });

  const blockMutation = useMutation({
    mutationFn: blockNearbyUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nearby-users"] });
      Alert.alert(t("common.success"), t("nearby.blocked"));
    },
  });

  const reportMutation = useMutation({
    mutationFn: (userId: string) => reportNearbyUser(userId),
    onSuccess: () => Alert.alert(t("common.success"), t("nearby.reported")),
  });

  const handleToggleVisible = (next: boolean) => {
    if (next) {
      presenceMutation.mutate(true);
    } else {
      presenceMutation.mutate(false);
    }
  };

  const confirmBlock = (userId: string) => {
    Alert.alert(t("nearby.block"), t("nearby.blockConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("nearby.block"), style: "destructive", onPress: () => blockMutation.mutate(userId) },
    ]);
  };

  const confirmReport = (userId: string) => {
    Alert.alert(t("nearby.report"), t("nearby.reportConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("nearby.report"), onPress: () => reportMutation.mutate(userId) },
    ]);
  };

  if (statusLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#B84A62" />
      </View>
    );
  }

  if (!status?.ageVerified) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-3 border-b border-border bg-surface">
          <Pressable onPress={() => router.back()} className="mr-3">
            <Text className="text-primary text-lg">← {t("common.back")}</Text>
          </Pressable>
          <Text className="text-xl font-bold text-text">{t("nearby.title")}</Text>
        </View>
        <ScrollView className="flex-1 px-6 pt-8">
          <Text className="text-2xl font-bold text-text mb-4">{t("nearby.ageTitle")}</Text>
          <Text className="text-gray-600 text-base leading-7 mb-8">{t("nearby.ageBody")}</Text>
          <Pressable
            onPress={() => setAgeChecked(!ageChecked)}
            className="flex-row items-center gap-3 mb-8"
          >
            <View
              className={`w-6 h-6 rounded border-2 items-center justify-center ${
                ageChecked ? "bg-primary border-primary" : "border-gray-300"
              }`}
            >
              {ageChecked ? <Text className="text-white text-xs">✓</Text> : null}
            </View>
            <Text className="flex-1 text-text text-base">{t("nearby.ageConfirm")}</Text>
          </Pressable>
          <Button
            onPress={() => verifyMutation.mutate()}
            loading={verifyMutation.isPending}
            disabled={!ageChecked}
          >
            {t("nearby.ageVerify")}
          </Button>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!status.datingSubscribed) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-3 border-b border-border bg-surface">
          <Pressable onPress={() => router.back()} className="mr-3">
            <Text className="text-primary text-lg">← {t("common.back")}</Text>
          </Pressable>
          <Text className="text-xl font-bold text-text">{t("nearby.title")}</Text>
        </View>
        <ScrollView className="flex-1 px-6 pt-8">
          <Text className="text-2xl font-bold text-text mb-4">
            {t("nearby.datingRequiredTitle")}
          </Text>
          <Text className="text-gray-600 text-base leading-7 mb-8">
            {t("nearby.datingRequiredBody")}
          </Text>
          <Button onPress={() => router.push("/(app)/subscription")}>
            {t("nearby.datingSubscribe")}
          </Button>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView testID="nearby-screen" className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-lg">← {t("common.back")}</Text>
        </Pressable>
        <Text className="text-xl font-bold text-text flex-1">{t("nearby.title")}</Text>
      </View>

      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="font-semibold text-text">{t("nearby.visibleLabel")}</Text>
            <Text className="text-gray-500 text-sm mt-1">{t("nearby.visibleHint")}</Text>
          </View>
          <Switch
            value={visible}
            onValueChange={handleToggleVisible}
            disabled={presenceMutation.isPending}
            trackColor={{ true: "#B84A62", false: "#d1d5db" }}
          />
        </View>
        <Text className={`text-sm mt-2 ${visible ? "text-green-600" : "text-gray-400"}`}>
          {visible ? t("nearby.onlineNow") : t("nearby.offline")}
        </Text>
        {locationDenied && visible ? (
          <Text className="text-amber-600 text-sm mt-2">{t("nearby.locationRequired")}</Text>
        ) : null}
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          <>
            {matches.length > 0 ? (
              <View className="mb-4">
                <Text className="text-lg font-bold text-text mb-2">{t("nearby.matches")}</Text>
                {matches.map((m: NearbyMatch) => (
                  <View
                    key={m.id}
                    className="bg-primary/10 rounded-xl p-3 mb-2 flex-row items-center gap-3"
                  >
                    <Text className="text-2xl">💕</Text>
                    <View>
                      <Text className="font-semibold text-text">{m.displayName}</Text>
                      <Text className="text-gray-500 text-sm">
                        {t("nearby.yearsOld", { age: m.age })}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
            <Text className="text-lg font-bold text-text mb-3">{t("nearby.peopleNearby")}</Text>
          </>
        }
        renderItem={({ item }) => (
          <UserCard
            user={item}
            t={t}
            onInterest={(id) => interestMutation.mutate(id)}
            onBlock={confirmBlock}
            onReport={confirmReport}
          />
        )}
        ListEmptyComponent={
          !visible ? (
            <Text className="text-gray-500 text-center py-8">{t("nearby.visibleHint")}</Text>
          ) : usersLoading ? (
            <ActivityIndicator color="#B84A62" className="py-8" />
          ) : (
            <Text className="text-gray-500 text-center py-8">{t("nearby.empty")}</Text>
          )
        }
      />
    </SafeAreaView>
  );
}
