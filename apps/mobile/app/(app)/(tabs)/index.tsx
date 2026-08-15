/**
 * Home screen: category filter + places list sorted by distance.
 * FREE tier users see first 5 places unlocked; index 6+ shows lock overlay.
 */
import { fetchPlaces, getStoredUser } from "@datespot/api-client";
import { PlaceCard } from "@datespot/ui";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  AppState,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CategoryChipIcon } from "../../../src/components/icons/CategoryChipIcon";
import {
  glassCircle,
  getFirstName,
  getGreetingPeriod,
  HomeTopPanel,
  SunsetSceneryBackground,
} from "../../../src/components/SunsetSceneryBackground";
import {
  DEFAULT_COORDS,
  DEFAULT_PLACES_RADIUS_KM,
  describeCoords,
  openLocationSettings,
  PLACES_RADIUS_OPTIONS_KM,
  resolveDeviceCoords,
} from "../../../src/lib/deviceLocation";
import { CATEGORY_THEMES, colors, type CategoryFilter } from "../../../src/theme/colors";

/** Browser preview: fixed Tel Aviv center, no geolocation prompts. */
const WEB_PREVIEW = Platform.OS === "web";

const CATEGORIES: { key: CategoryFilter; label: string }[] = [
  { key: "ALL", label: "all" },
  { key: "ROMANTIC_DATE", label: "romantic" },
  { key: "RESTAURANT", label: "restaurant" },
  { key: "DAIRY_RESTAURANT", label: "dairy" },
  { key: "MEAT_RESTAURANT", label: "meat" },
  { key: "SUSHI", label: "sushi" },
  { key: "SUNSET", label: "sunset" },
  { key: "ATTRACTION", label: "attraction" },
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
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        height: 210,
        marginBottom: 14,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#E2DFDB",
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
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: active ? 1.04 : 1,
      friction: 7,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [active, scale]);

  const iconColor = active ? "#FFFFFF" : theme.color;
  const gradientColors = [theme.color, theme.colorDeep] as const;

  return (
    <Animated.View
      style={[
        chipStyles.chipOuter,
        active && chipStyles.chipOuterActive,
        { transform: [{ scale }] },
      ]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        android_ripple={{
          color: active ? "rgba(255,255,255,0.22)" : theme.ripple,
        }}
        style={({ pressed }) => [
          chipStyles.chip,
          active
            ? chipStyles.chipActive
            : {
                backgroundColor: theme.inactiveBg,
                borderColor: theme.inactiveBorder,
              },
          pressed && chipStyles.chipPressed,
        ]}
      >
        {active ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}
        <View
          style={[
            chipStyles.iconWrap,
            { backgroundColor: active ? "rgba(255,255,255,0.22)" : theme.iconBg },
          ]}
        >
          <CategoryChipIcon category={categoryKey} size={13} color={iconColor} />
        </View>
        <Text
          style={[
            chipStyles.label,
            active ? chipStyles.labelActive : chipStyles.labelInactive,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const chipStyles = StyleSheet.create({
  chipOuter: {
    marginRight: 8,
  },
  chipOuterActive: Platform.select({
    ios: {
      shadowColor: "#1A1918",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.28,
      shadowRadius: 5,
    },
    android: {
      elevation: 3,
    },
    default: {
      boxShadow: "0 3px 10px rgba(26, 25, 24, 0.28)",
    },
  }),
  chip: {
    flexDirection: "row",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    gap: 7,
  },
  chipActive: {
    borderColor: "transparent",
  },
  chipPressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  labelActive: {
    color: "#ffffff",
  },
  labelInactive: {
    color: "rgba(255, 255, 255, 0.94)",
  },
});

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_PLACES_RADIUS_KM);
  const [searchQuery, setSearchQuery] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locationDenied, setLocationDenied] = useState(false);
  const [locationUnavailable, setLocationUnavailable] = useState(false);
  const [locationServicesOff, setLocationServicesOff] = useState(false);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [fromDevice, setFromDevice] = useState(false);
  const [fallbackAccepted, setFallbackAccepted] = useState(false);
  const [locating, setLocating] = useState(true);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const locatingLock = useRef(false);

  const applyLocationResult = useCallback(
    (result: Awaited<ReturnType<typeof resolveDeviceCoords>>, acceptFallback: boolean) => {
      setLocationDenied(result.denied);
      setLocationUnavailable(result.unavailable);
      setLocationServicesOff(result.servicesOff);
      setCanAskAgain(result.canAskAgain);
      if (result.fromDevice) {
        setCoords(result.coords);
        setFromDevice(true);
        return;
      }
      setFromDevice(false);
      if (acceptFallback) {
        setCoords(DEFAULT_COORDS);
      } else {
        setCoords(null);
      }
    },
    []
  );

  const loadLocation = useCallback(async (opts?: { silent?: boolean; prompt?: boolean }) => {
    if (locatingLock.current) return;
    locatingLock.current = true;
    if (!opts?.silent) setLocating(true);
    try {
      if (WEB_PREVIEW) {
        setCoords(DEFAULT_COORDS);
        setFromDevice(false);
        setLocationDenied(false);
        setLocationUnavailable(false);
        setLocationServicesOff(false);
        return;
      }
      const result = await resolveDeviceCoords({ prompt: opts?.prompt ?? false });
      applyLocationResult(result, fallbackAccepted);
    } finally {
      setLocating(false);
      locatingLock.current = false;
    }
  }, [applyLocationResult, fallbackAccepted]);

  useEffect(() => {
    if (!fromDevice || !coords) {
      setLocationLabel(null);
      return;
    }
    let cancelled = false;
    void describeCoords(coords).then((label) => {
      if (!cancelled) setLocationLabel(label);
    });
    return () => {
      cancelled = true;
    };
  }, [coords, fromDevice]);

  useEffect(() => {
    void loadLocation();
  }, [loadLocation]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void loadLocation({ silent: true });
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
    queryKey: ["places", category, coords?.lat, coords?.lng, searchQuery, radiusKm],
    queryFn: () =>
      fetchPlaces({
        category: category === "ALL" ? undefined : category,
        lat: coords!.lat,
        lng: coords!.lng,
        language: i18n.language,
        radius: radiusKm,
        q: searchQuery.trim() || undefined,
      }),
    enabled: !!coords,
  });

  const showLocationGate = !WEB_PREVIEW && !fromDevice && !fallbackAccepted && !coords && !locating;
  const primaryOpensSettings =
    locationServicesOff || (locationDenied && !canAskAgain);

  const onAllowLocation = useCallback(async () => {
    if (primaryOpensSettings) {
      await openLocationSettings();
      return;
    }
    await loadLocation({ prompt: true });
  }, [loadLocation, primaryOpensSettings]);

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
          sponsoredLabel={t("place.sponsored")}
          onPress={() => router.push(`/(app)/place/${item.id}`)}
          onLockedPress={() => router.push("/(app)/subscription")}
        />
      );
    },
    [isFreePlaces, router, t]
  );

  return (
    <SunsetSceneryBackground>
      <SafeAreaView className="flex-1" edges={["top"]}>
        <HomeTopPanel>
          <View style={styles.headerRow}>
            <View className="flex-1 pr-3">
              <Text style={styles.headerTitle}>{greetingText}</Text>
              <Text style={styles.headerSubtitle}>
                {fromDevice
                  ? t("home.locationUsing", { place: locationLabel ?? t("home.locationYou") })
                  : t("home.title")}
              </Text>
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
                label={t(`home.categories.${cat.label}`)}
                onPress={() => setCategory(cat.key)}
              />
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.radiusContent}
          >
            {PLACES_RADIUS_OPTIONS_KM.map((km) => {
              const active = radiusKm === km;
              return (
                <Pressable
                  key={km}
                  onPress={() => setRadiusKm(km)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.radiusChip, active && styles.radiusChipActive]}
                >
                  <Text style={[styles.radiusChipText, active && styles.radiusChipTextActive]}>
                    {t("home.radiusKm", { km })}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </HomeTopPanel>

        <View style={styles.content}>
          {showLocationGate ? (
            <ScrollView contentContainerStyle={styles.locationCardWrap}>
              <View style={styles.locationCard}>
                <Text style={styles.locationCardTitle}>{t("home.locationTitle")}</Text>
                <Text style={styles.locationCardBody}>
                  {locationServicesOff
                    ? t("home.locationServicesOff")
                    : locationUnavailable
                      ? t("home.locationUnavailable")
                      : t("home.locationBody")}
                </Text>
                <Pressable
                  onPress={() => void onAllowLocation()}
                  style={styles.locationPrimaryButton}
                  accessibilityRole="button"
                >
                  <Text style={styles.locationPrimaryButtonText}>
                    {primaryOpensSettings
                      ? t("home.openLocationSettings")
                      : t("home.allowLocation")}
                  </Text>
                </Pressable>
                <Text style={styles.locationStepsTitle}>{t("home.locationSettingsTitle")}</Text>
                <Text style={styles.locationSteps}>{t("home.locationSettingsSteps")}</Text>
                <Text style={styles.locationPrivacyPath}>{t("home.locationPrivacyPath")}</Text>
                {primaryOpensSettings ? null : (
                  <Pressable
                    onPress={() => void openLocationSettings()}
                    style={styles.locationSecondaryButton}
                    accessibilityRole="button"
                  >
                    <Text style={styles.locationSecondaryButtonText}>
                      {t("home.openLocationSettings")}
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => {
                    setFallbackAccepted(true);
                    setCoords(DEFAULT_COORDS);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.locationSkip}>{t("home.showTelAviv")}</Text>
                </Pressable>
              </View>
            </ScrollView>
          ) : !coords || isLoading || locating ? (
            <View className="px-4 pt-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : isError ? (
            <View className="items-center px-6 py-16">
              <Text className="text-text-muted text-center font-medium mb-4">
                {t("home.loadError")}
              </Text>
              <Pressable
                onPress={() => refetch()}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
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
                paddingTop: 12,
                paddingBottom: 24,
                flexGrow: 1,
              }}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={refetch}
                  tintColor={colors.primary}
                />
              }
              ListEmptyComponent={
                <View className="items-center py-16">
                  <Text className="text-text-muted text-center font-medium">
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
    fontWeight: "600",
    color: "#ffffff",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.78)",
    marginTop: 2,
  },
  datingCta: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: "hidden",
  },
  datingCtaText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 12,
  },
  searchInput: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(26, 25, 24, 0.32)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.22)",
    color: "#fff",
    fontSize: 15,
    textAlign: "right",
  },
  categoriesScroll: {
    flexGrow: 0,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    alignItems: "center",
  },
  radiusContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: "center",
    gap: 8,
  },
  radiusChip: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(26, 25, 24, 0.28)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.22)",
  },
  radiusChipActive: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderColor: "transparent",
  },
  radiusChipText: {
    color: "rgba(255, 255, 255, 0.92)",
    fontSize: 12,
    fontWeight: "700",
  },
  radiusChipTextActive: {
    color: colors.primary,
  },
  content: {
    flex: 1,
    minHeight: 0,
    backgroundColor: colors.background,
  },
  list: {
    flex: 1,
    backgroundColor: colors.background,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  locationCardWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  locationCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  locationCardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  locationCardBody: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 16,
  },
  locationPrimaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 18,
  },
  locationPrimaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  locationStepsTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  locationSteps: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 8,
  },
  locationPrivacyPath: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 14,
  },
  locationSecondaryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  locationSecondaryButtonText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 15,
  },
  locationSkip: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 8,
  },
});
