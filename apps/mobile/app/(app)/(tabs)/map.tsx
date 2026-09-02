/** Interactive map with place markers from the API. */
import { fetchPlaces, recordPlaceLead } from "@datespot/api-client";
import type { LeadType, Place } from "@datespot/shared-types";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PlaceActionsBar } from "../../../src/components/PlaceActionsBar";
import { PlaceThumbnail } from "../../../src/components/PlaceThumbnail";
import { PlaceMap } from "../../../src/components/PlaceMap";
import {
  DELIVERY_LEAD_TYPE,
  type DeliveryPlatform,
  resolveDeliveryUrl,
  shouldShowDeliveryOrder,
} from "../../../src/lib/deliveryOrder";
import {
  DEFAULT_COORDS,
  MAP_PLACES_RADIUS_KM,
  peekCachedDeviceCoords,
  resolveDeviceCoords,
} from "../../../src/lib/deviceLocation";
import {
  openPlaceCall,
  openPlaceNavigation,
  openPlaceWhatsApp,
  safeOpenUrl,
} from "../../../src/lib/placeActions";
import { colors } from "../../../src/theme/colors";

export default function MapScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    Platform.OS === "web" ? DEFAULT_COORDS : null
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const locatingLock = useRef(false);

  const loadLocation = useCallback(async () => {
    if (Platform.OS === "web" || locatingLock.current) return;
    locatingLock.current = true;
    try {
      const result = await resolveDeviceCoords();
      if (result.fromDevice) {
        setCoords(result.coords);
        return;
      }
      const cached = await peekCachedDeviceCoords();
      if (cached) setCoords(cached);
      else setCoords(DEFAULT_COORDS);
    } finally {
      locatingLock.current = false;
    }
  }, []);

  useEffect(() => {
    void loadLocation();
  }, [loadLocation]);

  const { data: places = [], isFetching, isError, refetch } = useQuery({
    queryKey: ["map-places", coords?.lat, coords?.lng, i18n.language],
    queryFn: () =>
      fetchPlaces({
        lat: coords!.lat,
        lng: coords!.lng,
        language: i18n.language,
        radius: MAP_PLACES_RADIUS_KM,
      }),
    enabled: !!coords,
  });

  const selected = useMemo(
    () => places.find((place) => place.id === selectedId) ?? null,
    [places, selectedId]
  );

  const trackLead = async (placeId: string, type: LeadType) => {
    try {
      await recordPlaceLead(placeId, type);
    } catch {
      // Lead tracking must not block the contact action.
    }
  };

  const openNav = (place: Place) => {
    if (place.latitude == null || place.longitude == null) return;
    openPlaceNavigation(
      { name: place.name, latitude: place.latitude, longitude: place.longitude },
      {
        title: t("place.navigate"),
        waze: t("place.waze"),
        googleMaps: t("place.googleMaps"),
        appleMaps: t("place.appleMaps"),
        cancel: t("common.cancel"),
      },
      {
        onNavigate: () => {
          void trackLead(place.id, "NAVIGATE");
        },
      }
    );
  };

  const openDelivery = async (place: Place, platform: DeliveryPlatform) => {
    try {
      await recordPlaceLead(place.id, DELIVERY_LEAD_TYPE[platform]);
    } catch {
      // Lead tracking must not block the delivery action.
    }
    await safeOpenUrl(resolveDeliveryUrl(platform, place), t("place.linkOpenError"));
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-4 py-3 bg-surface border-b border-border">
        <Text className="text-xl font-semibold text-text">{t("tabs.map")}</Text>
        <Text className="text-sm text-text-muted mt-1">{t("map.tapPlaceHint")}</Text>
      </View>

      <View style={styles.mapWrap}>
        {coords ? (
          <PlaceMap
            coords={coords}
            places={places}
            selectedPlaceId={selectedId}
            onPlacePress={setSelectedId}
          />
        ) : null}
        {!coords || isFetching ? (
          <View style={styles.fetchBadge}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null}

        {isError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{t("home.loadError")}</Text>
            <Pressable onPress={() => void refetch()}>
              <Text style={styles.retryText}>{t("common.retry")}</Text>
            </Pressable>
          </View>
        ) : null}

        {selected ? (
          <View style={styles.sheet}>
            <Pressable
              onPress={() => router.push(`/(app)/place/${selected.id}`)}
              style={styles.sheetHeader}
            >
              {selected.images[0] ? (
                <PlaceThumbnail uri={selected.images[0]} style={styles.sheetThumb} />
              ) : (
                <View style={[styles.sheetThumb, styles.sheetThumbEmpty]} />
              )}
              <View style={styles.sheetBody}>
                <Text style={styles.sheetName} numberOfLines={1}>
                  {selected.name}
                </Text>
                <Text style={styles.sheetMeta} numberOfLines={1}>
                  {selected.address ?? t(`place.categories.${selected.category}`)}
                  {selected.distance != null
                    ? ` · ${selected.distance.toFixed(1)} ${t("home.km")}`
                    : ""}
                </Text>
              </View>
            </Pressable>
            <PlaceActionsBar
              onNavigate={() => openNav(selected)}
              onCall={
                selected.phone
                  ? () => {
                      void trackLead(selected.id, "CALL");
                      openPlaceCall(selected.phone!);
                    }
                  : undefined
              }
              onWhatsApp={
                selected.phone
                  ? () => {
                      void trackLead(selected.id, "WHATSAPP");
                      openPlaceWhatsApp(
                        selected.phone!,
                        t("place.bookWhatsAppText", { name: selected.name })
                      );
                    }
                  : undefined
              }
              navigateLabel={t("place.navigate")}
              callLabel={t("place.call")}
              whatsappLabel={t("place.whatsapp")}
            />

            {shouldShowDeliveryOrder(selected) ? (
              <View style={styles.deliveryRow} testID="map-delivery-order">
                <Pressable
                  style={styles.deliveryPill}
                  onPress={() => void openDelivery(selected, "wolt")}
                >
                  <Text style={styles.deliveryPillText}>{t("place.orderWolt")}</Text>
                </Pressable>
                <Pressable
                  style={styles.deliveryPill}
                  onPress={() => void openDelivery(selected, "tenbis")}
                >
                  <Text style={styles.deliveryPillText}>{t("place.orderTenBis")}</Text>
                </Pressable>
                <Pressable
                  style={styles.deliveryPill}
                  onPress={() => void openDelivery(selected, "mishloha")}
                >
                  <Text style={styles.deliveryPillText}>{t("place.orderMishloha")}</Text>
                </Pressable>
                <Pressable
                  style={styles.deliveryPill}
                  onPress={() => void openDelivery(selected, "cibus")}
                >
                  <Text style={styles.deliveryPillText}>{t("place.orderCibus")}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    flex: 1,
  },
  fetchBadge: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorBanner: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  errorText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
  },
  retryText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 13,
  },
  sheet: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    shadowColor: "#1A1918",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  sheetHeader: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  sheetThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerHigh,
  },
  sheetThumbEmpty: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  sheetBody: {
    flex: 1,
    minWidth: 0,
  },
  sheetName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  sheetMeta: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
  },
  deliveryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  deliveryPill: {
    flexGrow: 1,
    minWidth: "45%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 8,
    alignItems: "center",
  },
  deliveryPillText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 12,
  },
});
