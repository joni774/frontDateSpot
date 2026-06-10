/**
 * Home screen: category filter + places list sorted by distance.
 * FREE tier users see first 5 places unlocked; index 6+ shows lock overlay.
 */
import { fetchPlaces, getStoredUser } from "@datespot/api-client";
import type { PlaceCategory } from "@datespot/shared-types";
import { PlaceCard } from "@datespot/ui";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  glassCircle,
  getFirstName,
  getGreetingPeriod,
  HomeTopPanel,
  SunsetSceneryBackground,
} from "../../src/components/SunsetSceneryBackground";

type CategoryFilter = PlaceCategory | "ALL";

type CategoryTheme = {
  color: string;
  inactiveBg: string;
  inactiveBorder: string;
  inactiveText: string;
  ripple: string;
};

const CATEGORY_THEMES: Record<CategoryFilter, CategoryTheme> = {
  ALL: {
    color: "#7C3AED",
    inactiveBg: "rgba(124, 58, 237, 0.28)",
    inactiveBorder: "rgba(124, 58, 237, 0.6)",
    inactiveText: "#FFFFFF",
    ripple: "rgba(124, 58, 237, 0.2)",
  },
  ROMANTIC_DATE: {
    color: "#E84393",
    inactiveBg: "rgba(232, 67, 147, 0.28)",
    inactiveBorder: "rgba(232, 67, 147, 0.6)",
    inactiveText: "#FFFFFF",
    ripple: "rgba(232, 67, 147, 0.2)",
  },
  RESTAURANT: {
    color: "#EA580C",
    inactiveBg: "rgba(234, 88, 12, 0.28)",
    inactiveBorder: "rgba(234, 88, 12, 0.6)",
    inactiveText: "#FFFFFF",
    ripple: "rgba(234, 88, 12, 0.2)",
  },
  SUNSET: {
    color: "#F59E0B",
    inactiveBg: "rgba(245, 158, 11, 0.3)",
    inactiveBorder: "rgba(245, 158, 11, 0.65)",
    inactiveText: "#FFFFFF",
    ripple: "rgba(245, 158, 11, 0.2)",
  },
  ATTRACTION: {
    color: "#0891B2",
    inactiveBg: "rgba(8, 145, 178, 0.28)",
    inactiveBorder: "rgba(8, 145, 178, 0.6)",
    inactiveText: "#FFFFFF",
    ripple: "rgba(8, 145, 178, 0.2)",
  },
  DAIRY_RESTAURANT: {
    color: "#0EA5E9",
    inactiveBg: "rgba(14, 165, 233, 0.28)",
    inactiveBorder: "rgba(14, 165, 233, 0.6)",
    inactiveText: "#FFFFFF",
    ripple: "rgba(14, 165, 233, 0.2)",
  },
  MEAT_RESTAURANT: {
    color: "#DC2626",
    inactiveBg: "rgba(220, 38, 38, 0.28)",
    inactiveBorder: "rgba(220, 38, 38, 0.6)",
    inactiveText: "#FFFFFF",
    ripple: "rgba(220, 38, 38, 0.2)",
  },
  SUSHI: {
    color: "#BE185D",
    inactiveBg: "rgba(190, 24, 93, 0.28)",
    inactiveBorder: "rgba(190, 24, 93, 0.6)",
    inactiveText: "#FFFFFF",
    ripple: "rgba(190, 24, 93, 0.2)",
  },
};

const DEFAULT_COORDS = { lat: 32.0853, lng: 34.7818 };

async function resolveDeviceCoords(): Promise<{
  coords: { lat: number; lng: number };
  error: string | null;
}> {
  if (Platform.OS === "web") {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 60_000,
          });
        });

        return {
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          error: null,
        };
      } catch {
        return { coords: DEFAULT_COORDS, error: "home.locationDenied" };
      }
    }

    return { coords: DEFAULT_COORDS, error: null };
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    return { coords: DEFAULT_COORDS, error: "home.locationDenied" };
  }

  const loc = await Location.getCurrentPositionAsync({});
  return {
    coords: { lat: loc.coords.latitude, lng: loc.coords.longitude },
    error: null,
  };
}

const CATEGORIES: { key: CategoryFilter; label: string; emoji: string }[] = [
  { key: "ALL", label: "all", emoji: "" },
  { key: "ROMANTIC_DATE", label: "romantic", emoji: "💕" },
  { key: "RESTAURANT", label: "restaurant", emoji: "🍽" },
  { key: "DAIRY_RESTAURANT", label: "dairy", emoji: "🧀" },
  { key: "MEAT_RESTAURANT", label: "meat", emoji: "🥩" },
  { key: "SUSHI", label: "sushi", emoji: "🍣" },
  { key: "SUNSET", label: "sunset", emoji: "🌅" },
  { key: "ATTRACTION", label: "attraction", emoji: "🎡" },
];

function SkeletonCard() {
  return (
    <View
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.55)",
        borderRadius: 16,
        height: 224,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.45)",
      }}
      className="animate-pulse"
    />
  );
}

function CategoryChip({
  categoryKey,
  active,
  label,
  onPress,
}: {
  categoryKey: CategoryFilter;
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const theme = CATEGORY_THEMES[categoryKey];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      android_ripple={{
        color: active ? "rgba(255,255,255,0.25)" : theme.ripple,
      }}
      style={({ pressed }) => [
        chipStyles.chip,
        active
          ? {
              backgroundColor: theme.color,
              borderColor: theme.color,
              shadowColor: theme.color,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.4,
              shadowRadius: 6,
              elevation: 4,
            }
          : {
              backgroundColor: theme.inactiveBg,
              borderColor: theme.inactiveBorder,
              shadowColor: theme.color,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.15,
              shadowRadius: 3,
              elevation: 2,
              ...Platform.select({
                web: {
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                } as ViewStyle,
                default: {},
              }),
            },
        pressed && chipStyles.chipPressed,
      ]}
    >
      <Text
        style={[
          chipStyles.label,
          active
            ? chipStyles.labelActive
            : { color: theme.inactiveText, textShadowColor: "rgba(0,0,0,0.2)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    marginRight: 6,
    minHeight: 34,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  chipPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  labelActive: {
    color: "#ffffff",
  },
});

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { coords: nextCoords, error } = await resolveDeviceCoords();
      if (!mounted) return;

      setCoords(nextCoords);
      if (error) {
        setLocationError(t(error));
      }
    })();

    return () => {
      mounted = false;
    };
  }, [t]);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: getStoredUser,
  });

  const {
    data: places = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["places", category, coords?.lat, coords?.lng],
    queryFn: () =>
      fetchPlaces({
        category: category === "ALL" ? undefined : category,
        lat: coords!.lat,
        lng: coords!.lng,
        language: i18n.language,
      }),
    enabled: !!coords,
  });

  const isFree = !user || user.subscriptionTier === "FREE";

  const greetingPeriod = useMemo(() => getGreetingPeriod(), []);
  const greetingText = useMemo(() => {
    const firstName = user?.fullName ? getFirstName(user.fullName) : null;
    if (firstName) {
      return t(`home.greeting.${greetingPeriod}`, { name: firstName });
    }
    return t(`home.greeting.${greetingPeriod}NoName`);
  }, [greetingPeriod, t, user?.fullName]);

  const renderPlace = useCallback(
    ({ item, index }: { item: (typeof places)[0]; index: number }) => {
      const locked = isFree && index >= 5;
      return (
        <PlaceCard
          place={item}
          isLocked={locked || item.isLocked}
          onPress={() => router.push(`/(app)/place/${item.id}`)}
          onLockedPress={() => router.push("/(app)/subscription")}
        />
      );
    },
    [isFree, router, t]
  );

  return (
    <SunsetSceneryBackground>
      <SafeAreaView className="flex-1" edges={["top"]}>
        <HomeTopPanel>
          <View style={styles.headerRow}>
            <View className="flex-1 pr-3">
              <Text style={styles.headerTitle}>{greetingText}</Text>
              <Text style={styles.headerSubtitle}>{t("home.title")}</Text>
            </View>
            <Pressable
              onPress={() => router.push("/(app)/profile")}
              style={[styles.profileButton, glassCircle]}
              className="w-9 h-9 rounded-full items-center justify-center"
            >
              <Text className="text-base">👤</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}
          >
            {CATEGORIES.map((cat) => (
              <CategoryChip
                key={cat.key}
                categoryKey={cat.key}
                active={category === cat.key}
                label={`${cat.emoji ? `${cat.emoji} ` : ""}${t(`home.categories.${cat.label}`)}`}
                onPress={() => setCategory(cat.key)}
              />
            ))}
          </ScrollView>
        </HomeTopPanel>

        {locationError ? (
          <Text className="text-amber-100 text-xs px-4 py-1">{locationError}</Text>
        ) : null}

        <View style={styles.content}>
          {!coords || isLoading ? (
            <View className="px-4 pt-2">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : isError ? (
            <View className="items-center px-6 py-16">
              <Text className="text-4xl mb-2">⚠️</Text>
              <Text className="text-white/90 text-center font-medium mb-4">
                {t("home.loadError")}
              </Text>
              <Pressable
                onPress={() => refetch()}
                style={[styles.retryButton, glassCircle]}
                className="px-5 py-3 rounded-full"
              >
                <Text className="text-white font-semibold">{t("common.retry")}</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={places}
              keyExtractor={(item) => item.id}
              renderItem={renderPlace}
              style={styles.list}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingTop: 8,
                paddingBottom: 24,
                flexGrow: 1,
              }}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={refetch}
                  tintColor="#ffffff"
                />
              }
              ListEmptyComponent={
                <View className="items-center py-16">
                  <Text className="text-4xl mb-2">💕</Text>
                  <Text className="text-white/90 text-center font-medium">
                    {t("home.noResults")}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </SafeAreaView>
    </SunsetSceneryBackground>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.82)",
    marginTop: 1,
  },
  profileButton: {
    overflow: "hidden",
  },
  categoriesScroll: {
    flexGrow: 0,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    alignItems: "center",
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
  list: {
    flex: 1,
    backgroundColor: "transparent",
  },
  retryButton: {
    overflow: "hidden",
  },
});
