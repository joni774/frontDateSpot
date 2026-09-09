/** Resolve delivery-platform order URL for a place — only AVAILABLE providers. */
import type {
  DeliveryAvailability,
  LeadType,
  PlaceCategory,
  ResolvedDeliveryProviders,
} from "@datespot/shared-types";

export type DeliveryPlatform = "wolt" | "tenbis" | "mishloha";

export const DELIVERY_LEAD_TYPE: Record<DeliveryPlatform, LeadType> = {
  wolt: "DELIVERY_WOLT",
  tenbis: "DELIVERY_TENBIS",
  mishloha: "DELIVERY_MISHLOHA",
};

const PLATFORM_LABEL_KEY: Record<DeliveryPlatform, string> = {
  wolt: "place.orderWolt",
  tenbis: "place.orderTenBis",
  mishloha: "place.orderMishloha",
};

export { PLATFORM_LABEL_KEY };

/** Categories where in-app delivery ordering can appear. */
const FOOD_ORDER_CATEGORIES: ReadonlySet<PlaceCategory> = new Set([
  "RESTAURANT",
  "DAIRY_RESTAURANT",
  "MEAT_RESTAURANT",
  "SUSHI",
  "ROMANTIC_DATE",
]);

export type DeliveryPlaceInfo = {
  name: string;
  category: PlaceCategory;
  delivery?: ResolvedDeliveryProviders;
  deliveryWoltUrl?: string | null;
  deliveryTenBisUrl?: string | null;
  deliveryMishlohaUrl?: string | null;
  deliveryWoltStatus?: DeliveryAvailability;
  deliveryTenBisStatus?: DeliveryAvailability;
  deliveryMishlohaStatus?: DeliveryAvailability;
};

function statusOf(
  place: DeliveryPlaceInfo,
  platform: DeliveryPlatform
): DeliveryAvailability {
  if (place.delivery) {
    return place.delivery[platform].status;
  }
  switch (platform) {
    case "wolt":
      return place.deliveryWoltStatus ?? "UNKNOWN";
    case "tenbis":
      return place.deliveryTenBisStatus ?? "UNKNOWN";
    case "mishloha":
      return place.deliveryMishlohaStatus ?? "UNKNOWN";
  }
}

function urlOf(place: DeliveryPlaceInfo, platform: DeliveryPlatform): string | null {
  if (place.delivery?.[platform]?.url) return place.delivery[platform].url;
  switch (platform) {
    case "wolt":
      return place.deliveryWoltUrl ?? null;
    case "tenbis":
      return place.deliveryTenBisUrl ?? null;
    case "mishloha":
      return place.deliveryMishlohaUrl ?? null;
  }
}

function searchFallback(platform: DeliveryPlatform, placeName: string): string {
  const q = encodeURIComponent(placeName.trim());
  switch (platform) {
    case "wolt":
      return `https://wolt.com/he/discovery?q=${q}`;
    case "tenbis":
      return `https://www.10bis.co.il/next/he/restaurants?q=${q}`;
    case "mishloha":
      return `https://www.mishloha.co.il/search?q=${q}`;
  }
}

export type AvailableDeliveryPlatform = {
  platform: DeliveryPlatform;
  url: string;
};

/** Platforms marked AVAILABLE for this place (no search-fallback spam for unknown). */
export function getAvailableDeliveryPlatforms(
  place: DeliveryPlaceInfo
): AvailableDeliveryPlatform[] {
  const platforms: DeliveryPlatform[] = ["wolt", "tenbis", "mishloha"];
  const out: AvailableDeliveryPlatform[] = [];
  for (const platform of platforms) {
    if (statusOf(place, platform) !== "AVAILABLE") continue;
    const stored = urlOf(place, platform);
    out.push({
      platform,
      url: stored || searchFallback(platform, place.name),
    });
  }
  return out;
}

export function shouldShowDeliveryOrder(place: DeliveryPlaceInfo): boolean {
  return getAvailableDeliveryPlatforms(place).length > 0;
}

export function resolveDeliveryUrl(
  platform: DeliveryPlatform,
  place: DeliveryPlaceInfo
): string {
  const available = getAvailableDeliveryPlatforms(place).find((p) => p.platform === platform);
  if (available) return available.url;
  const stored = urlOf(place, platform);
  if (stored) return stored;
  return searchFallback(platform, place.name);
}

export function isFoodOrderCategory(category: PlaceCategory): boolean {
  return FOOD_ORDER_CATEGORIES.has(category);
}
