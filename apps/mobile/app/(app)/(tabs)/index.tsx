/**
 * Home screen: Stitch layout — circular categories, featured hero, nearby rows.
 * Browsing is free; subscription lives in AI chat.
 */
import { fetchPlaces } from "@datespot/api-client";
import type { Place } from "@datespot/shared-types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  AppState,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CategoryChipIcon } from "../../../src/components/icons/CategoryChipIcon";
import { ScreenHeader } from "../../../src/components/ScreenHeader";
import {
  DEFAULT_COORDS,
  DEFAULT_PLACES_RADIUS_KM,
  describeCoords,
  openLocationSettings,
  peekCachedDeviceCoords,
  PLACES_RADIUS_OPTIONS_KM,
  resolveDeviceCoords,
} from "../../../src/lib/deviceLocation";
import { textAlignStart } from "../../../src/lib/rtl";
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

function SkeletonCard({ tall }: { tall?: boolean }) {
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
        backgroundColor: colors.surfaceContainer,
        borderRadius: 16,
        height: tall ? 220 : 96,
        marginBottom: 14,
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
  const iconColor = active ? "#FFFFFF" : colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={chipStyles.wrap}
    >
      <View
        style={[
          chipStyles.circle,
          active
            ? { backgroundColor: colors.primary }
            : { backgroundColor: theme.inactiveBg },
        ]}
      >
        <CategoryChipIcon category={categoryKey} size={26} color={iconColor} />
      </View>
      <Text style={[chipStyles.label, active && chipStyles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const chipStyles = StyleSheet.create({
  wrap: {
    width: 72,
    alignItems: "center",
    marginRight: 8,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textMuted,
    textAlign: "center",
  },
  labelActive: {
    color: colors.text,
    fontWeight: "600",
  },
});

function FeaturedPlaceCard({
  place,
  locked,
  sponsoredLabel,
  categoryLabel,
  priceLabel,
  onPress,
}: {
  place: Place;
  locked: boolean;
  sponsoredLabel: string;
  categoryLabel: string;
  priceLabel: string;
  onPress: () => void;
}) {
  const imageUri = place.images[0];

  return (
    <Pressable
      testID={`place-card-${place.id}`}
      onPress={onPress}
      style={featuredStyles.card}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={featuredStyles.image} resizeMode="cover" />
      ) : (
        <View style={[featuredStyles.image, featuredStyles.placeholder]} />
      )}
      <LinearGradient
        colors={["transparent", "rgba(26,25,24,0.2)", "rgba(26,25,24,0.82)"]}
        style={StyleSheet.absoluteFillObject}
      />
      {locked ? (
        <View style={featuredStyles.lock}>
          <Text style={featuredStyles.lockText}>{sponsoredLabel}</Text>
        </View>
      ) : null}
      <View style={featuredStyles.body}>
        <View style={featuredStyles.badges}>
          <View style={featuredStyles.badge}>
            <Text style={featuredStyles.badgeText}>{categoryLabel}</Text>
          </View>
          <View style={featuredStyles.badge}>
            <Text style={featuredStyles.badgeText}>{priceLabel}</Text>
          </View>
        </View>
        <Text style={featuredStyles.name} numberOfLines={2}>
          {place.name}
        </Text>
        {place.description ? (
          <Text style={featuredStyles.desc} numberOfLines={1}>
            {place.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const featuredStyles = StyleSheet.create({
  card: {
    height: 280,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.surfaceContainer,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  placeholder: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  lock: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(26, 25, 24, 0.35)",
  },
  lockText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  body: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
  },
  badges: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.28)",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  desc: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
    marginTop: 4,
  },
});

function NearbyPlaceRow({
  place,
  locked,
  categoryLabel,
  priceLabel,
  distanceLabel,
  onPress,
}: {
  place: Place;
  locked: boolean;
  categoryLabel: string;
  priceLabel: string;
  distanceLabel: string | null;
  onPress: () => void;
}) {
  const imageUri = place.images[0];

  return (
    <Pressable
      testID={`place-card-${place.id}`}
      onPress={onPress}
      style={[rowStyles.row, locked && rowStyles.rowLocked]}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={rowStyles.thumb} resizeMode="cover" />
      ) : (
        <View style={[rowStyles.thumb, rowStyles.thumbPlaceholder]} />
      )}
      <View style={rowStyles.body}>
        <View style={rowStyles.top}>
          <Text style={rowStyles.name} numberOfLines={1}>
            {place.name}
          </Text>
          {distanceLabel ? (
            <Text style={rowStyles.distance}>{distanceLabel}</Text>
          ) : null}
        </View>
        {place.description ? (
          <Text style={rowStyles.desc} numberOfLines={1}>
            {place.description}
          </Text>
        ) : null}
        <Text style={rowStyles.meta}>
          {categoryLabel} · {priceLabel}
        </Text>
      </View>
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 14,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginBottom: 12,
    shadowColor: "#1A1918",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  rowLocked: {
    opacity: 0.72,
  },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerHigh,
  },
  thumbPlaceholder: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  body: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
  },
  distance: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  desc: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
  },
  meta: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
});

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_PLACES_RADIUS_KM);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const autoExpandedRadius = useRef(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
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
      if (acceptFallback) {
        setCoords(DEFAULT_COORDS);
        setFromDevice(false);
        return;
      }
      // GPS failed without fallback: keep cached device coords if any.
      // Do NOT invent Tel Aviv here — that made `showLocationGate` unreachable.
    },
    []
  );

  const loadLocation = useCallback(
    async (opts?: { silent?: boolean; prompt?: boolean }) => {
      if (locatingLock.current) return null;
      locatingLock.current = true;
      if (!opts?.silent) setLocating(true);
      try {
        if (WEB_PREVIEW) {
          setCoords(DEFAULT_COORDS);
          setFromDevice(false);
          setLocationDenied(false);
          setLocationUnavailable(false);
          setLocationServicesOff(false);
          return null;
        }
        const result = await resolveDeviceCoords({ prompt: opts?.prompt ?? false });
        applyLocationResult(result, fallbackAccepted);
        return result;
      } finally {
        setLocating(false);
        locatingLock.current = false;
      }
    },
    [applyLocationResult, fallbackAccepted]
  );

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
    let cancelled = false;
    void (async () => {
      // Prefer cached device coords so the list can render without waiting on
      // a permission prompt. Never invent Tel Aviv here — that skipped the
      // location gate. User can still tap "Show Tel Aviv" on the gate.
      const cached = await peekCachedDeviceCoords();
      if (!cancelled && cached) {
        setCoords(cached);
        setFromDevice(true);
      }
      if (!cancelled) await loadLocation({ prompt: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [loadLocation]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void loadLocation({ silent: true });
    });
    return () => sub.remove();
  }, [loadLocation]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: places = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["places", category, coords?.lat, coords?.lng, debouncedQuery, radiusKm, i18n.language],
    queryFn: () =>
      fetchPlaces({
        category: category === "ALL" ? undefined : category,
        lat: coords!.lat,
        lng: coords!.lng,
        language: i18n.language,
        radius: radiusKm,
        q: debouncedQuery.trim() || undefined,
      }),
    enabled: !!coords,
    // Keep showing the previous results (and the search input) while a new
    // query is in flight instead of unmounting the list for a full skeleton.
    placeholderData: keepPreviousData,
  });

  // If the chosen radius/category returns nothing, widen once (20 → 50) instead of an empty screen.
  useEffect(() => {
    if (isLoading || isError || !coords) return;
    if (places.length > 0) {
      autoExpandedRadius.current = false;
      return;
    }
    if (autoExpandedRadius.current) return;
    if (radiusKm >= 50) return;
    autoExpandedRadius.current = true;
    setRadiusKm(radiusKm < 10 ? 10 : radiusKm < 20 ? 20 : 50);
  }, [places.length, isLoading, isError, coords, radiusKm]);

  useEffect(() => {
    autoExpandedRadius.current = false;
  }, [category, debouncedQuery]);

  const showLocationGate = !WEB_PREVIEW && !fromDevice && !fallbackAccepted && !coords && !locating;
  const primaryOpensSettings = locationServicesOff || (locationDenied && !canAskAgain);

  const onAllowLocation = useCallback(async () => {
    const result = await loadLocation({ prompt: true });
    if (result && !result.fromDevice) {
      await openLocationSettings();
    }
  }, [loadLocation]);

  const featured = places[0];
  const nearby = useMemo(() => places.slice(1), [places]);

  const openPlace = useCallback(
    (place: Place) => {
      router.push(`/(app)/place/${place.id}`);
    },
    [router]
  );

  const listHeader = (
    <View>
      <View style={styles.searchWrap}>
        <TextInput
          testID="home-search"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t("home.searchPlaceholder")}
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { textAlign: textAlignStart() }]}
        />
      </View>

      {fromDevice ? (
        <Text style={styles.locationHint}>
          {t("home.locationUsing", { place: locationLabel ?? t("home.locationYou") })}
        </Text>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
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

      {featured ? (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{t("home.recommended")}</Text>
            <Pressable onPress={() => setCategory("ALL")}>
              <Text style={styles.sectionLink}>{t("home.viewAll")}</Text>
            </Pressable>
          </View>
          <FeaturedPlaceCard
            place={featured}
            locked={!!featured.isLocked}
            sponsoredLabel={
              featured.isLocked ? t("home.locked") : t("place.sponsored")
            }
            categoryLabel={t(`place.categories.${featured.category}`)}
            priceLabel={t(`place.priceRange.${featured.priceRange}`)}
            onPress={() => openPlace(featured)}
          />
        </View>
      ) : null}

      {nearby.length > 0 ? (
        <Text style={[styles.sectionTitle, styles.nearbyTitle]}>{t("home.nearbySection")}</Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t("tabs.home")} />
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
        <View style={styles.pad}>
          <SkeletonCard tall />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : isError ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{t("home.loadError")}</Text>
          <Pressable onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>{t("common.retry")}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          testID="home-place-list"
          data={nearby}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          renderItem={({ item }) => (
            <NearbyPlaceRow
              place={item}
              locked={!!item.isLocked}
              categoryLabel={t(`place.categories.${item.category}`)}
              priceLabel={t(`place.priceRange.${item.priceRange}`)}
              distanceLabel={
                item.distance != null
                  ? `${item.distance.toFixed(1)} ${t("home.km")}`
                  : null
              }
              onPress={() => openPlace(item)}
            />
          )}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            featured ? null : (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>{t("home.noResults")}</Text>
                {radiusKm < 50 ? (
                  <Pressable
                    onPress={() => setRadiusKm(50)}
                    style={styles.retryButton}
                    accessibilityRole="button"
                  >
                    <Text style={styles.retryButtonText}>{t("home.expandRadius")}</Text>
                  </Pressable>
                ) : null}
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pad: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  searchWrap: {
    paddingTop: 8,
  },
  searchInput: {
    height: 52,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 20,
    fontSize: 16,
    color: colors.text,
  },
  locationHint: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textMuted,
  },
  categoriesContent: {
    paddingTop: 20,
    paddingBottom: 8,
  },
  radiusContent: {
    paddingBottom: 8,
    gap: 8,
  },
  radiusChip: {
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainer,
  },
  radiusChipActive: {
    backgroundColor: colors.primary,
  },
  radiusChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  radiusChipTextActive: {
    color: "#fff",
  },
  section: {
    paddingTop: 20,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  sectionLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  nearbyTitle: {
    paddingTop: 28,
    paddingBottom: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  empty: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textMuted,
    fontWeight: "500",
    textAlign: "center",
  },
  errorWrap: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  errorText: {
    color: colors.textMuted,
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  locationCardWrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  locationCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
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
    marginBottom: 12,
  },
  locationPrimaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  locationSkip: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 8,
  },
});
