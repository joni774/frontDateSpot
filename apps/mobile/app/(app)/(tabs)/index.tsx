/**
 * Home screen: category filter + places list sorted by distance.
 * FREE tier users see first 5 places unlocked; index 6+ shows lock overlay.
 */
import { fetchPlaces, getStoredUser } from "@datespot/api-client";
import { PlaceCard } from "@datespot/ui";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  AppState,
  FlatList,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
} from "../../../src/components/SunsetSceneryBackground";
import { CATEGORY_THEMES, type CategoryFilter } from "../../../src/theme/colors";

const DEFAULT_COORDS = { lat: 32.0853, lng: 34.7818 };

/** Browser preview: fixed Tel Aviv center, no geolocation prompts. */
const WEB_PREVIEW = Platform.OS === "web";

async function resolveDeviceCoords(): Promise<{
  coords: { lat: number; lng: number };
  denied: boolean;
}> {
  if (WEB_PREVIEW) {
    return { coords: DEFAULT_COORDS, denied: false };
  }

  if (Platform.OS === "web") {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        const permission = await navigator.permissions?.query({
          name: "geolocation",
        });
        if (permission?.state === "denied") {
          return { coords: DEFAULT_COORDS, denied: true };
        }
      } catch {
        // permissions API unsupported — fall through to geolocation request
      }

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 0,
          });
        });

        return {
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          denied: false,
        };
      } catch {
        return { coords: DEFAULT_COORDS, denied: true };
      }
    }

    return { coords: DEFAULT_COORDS, denied: false };
  }

  let permission = await Location.getForegroundPermissionsAsync();
  if (permission.status !== "granted" && permission.canAskAgain) {
    permission = await Location.requestForegroundPermissionsAsync();
  }

  if (permission.status !== "granted") {
    return { coords: DEFAULT_COORDS, denied: true };
  }

  const loc = await Location.getCurrentPositionAsync({});
  return {
    coords: { lat: loc.coords.latitude, lng: loc.coords.longitude },
    denied: false,
  };
}

async function openLocationSettings() {
  if (Platform.OS !== "web") {
    await Linking.openSettings();
  }
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
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        opacity,
        backgroundColor: "rgba(255, 255, 255, 0.55)",
        borderRadius: 16,
        height: 224,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.45)",
      }}
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
  const [searchQuery, setSearchQuery] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locationDenied, setLocationDenied] = useState(false);
  const [locating, setLocating] = useState(true);

  const loadLocation = useCallback(async () => {
    setLocating(true);
    const { coords: nextCoords, denied } = await resolveDeviceCoords();
    setCoords(nextCoords);
    setLocationDenied(denied);
    setLocating(false);
  }, []);

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") loadLocation();
    });
    return () => sub.remove();
  }, [loadLocation]);

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
    queryKey: ["places", category, coords?.lat, coords?.lng, searchQuery],
    queryFn: () =>
      fetchPlaces({
        category: category === "ALL" ? undefined : category,
        lat: coords!.lat,
        lng: coords!.lng,
        language: i18n.language,
        radius: 50,
        q: searchQuery.trim() || undefined,
      }),
    enabled: !!coords,
  });

  const isFreePlaces =
    !WEB_PREVIEW && (!user || user.subscriptionTier === "FREE" || user.subscriptionTier === "DATING");

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
      const locked = !WEB_PREVIEW && isFreePlaces && index >= 5;
      return (
        <PlaceCard
          place={item}
          testID={`place-card-${item.id}`}
          isLocked={locked || (!WEB_PREVIEW && !!item.isLocked)}
          onPress={() => router.push(`/(app)/place/${item.id}`)}
          onLockedPress={() => router.push("/(app)/subscription")}
        />
      );
    },
    [isFreePlaces, router]
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
              testID="home-dating-cta"
              onPress={() => router.push("/(app)/nearby")}
              style={[styles.datingCta, glassCircle]}
              accessibilityRole="button"
            >
              <Text style={styles.datingCtaText}>{t("home.datingCta")}</Text>
            </Pressable>
          </View>

          <TextInput
            testID="home-search"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("home.searchPlaceholder")}
            placeholderTextColor="rgba(255,255,255,0.7)"
            style={styles.searchInput}
          />

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

        {locationDenied && !WEB_PREVIEW ? (
          <Pressable
            onPress={openLocationSettings}
            style={styles.locationBanner}
            accessibilityRole="button"
          >
            <Text style={styles.locationBannerText}>📍 {t("home.locationDenied")}</Text>
            <Text style={styles.locationBannerAction}>{t("home.openLocationSettings")} →</Text>
          </Pressable>
        ) : null}

        <View style={styles.content}>
          {!coords || isLoading || locating ? (
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
              testID="home-place-list"
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
  datingCta: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  datingCtaText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
  },
  searchInput: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
    color: "#fff",
    fontSize: 15,
    textAlign: "right",
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
  locationBanner: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(42, 34, 36, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  locationBannerText: {
    color: "rgba(255, 255, 255, 0.92)",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "right",
  },
  locationBannerAction: {
    color: "#F5EDE8",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "right",
  },
});
