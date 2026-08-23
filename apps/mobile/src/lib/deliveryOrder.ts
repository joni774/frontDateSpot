/** Resolve Wolt / Ten Bis / Mishloha order URLs for a place (affiliate or search fallback). */
import type { LeadType, PlaceCategory } from "@datespot/shared-types";

export type DeliveryPlatform = "wolt" | "tenbis" | "mishloha";

export const DELIVERY_LEAD_TYPE: Record<DeliveryPlatform, LeadType> = {
  wolt: "DELIVERY_WOLT",
  tenbis: "DELIVERY_TENBIS",
  mishloha: "DELIVERY_MISHLOHA",
};

/** Categories where in-app delivery ordering is the primary CTA. */
const FOOD_ORDER_CATEGORIES: ReadonlySet<PlaceCategory> = new Set([
  "RESTAURANT",
  "DAIRY_RESTAURANT",
  "MEAT_RESTAURANT",
  "SUSHI",
  "ROMANTIC_DATE",
]);

export type DeliveryPlaceUrls = {
  name: string;
  category: PlaceCategory;
  deliveryWoltUrl?: string | null;
  deliveryTenBisUrl?: string | null;
  deliveryMishlohaUrl?: string | null;
};

export function shouldShowDeliveryOrder(place: DeliveryPlaceUrls): boolean {
  if (FOOD_ORDER_CATEGORIES.has(place.category)) return true;
  return Boolean(
    place.deliveryWoltUrl || place.deliveryTenBisUrl || place.deliveryMishlohaUrl
  );
}

function searchFallback(platform: DeliveryPlatform, placeName: string): string {
  const q = encodeURIComponent(placeName.trim());
  switch (platform) {
    case "wolt":
      return `https://wolt.com/he/discovery?q=${q}`;
    case "tenbis":
      return `https://www.10bis.co.il/next/search?query=${q}`;
    case "mishloha":
      return `https://www.mishloha.co.il/?s=${q}`;
  }
}

export function resolveDeliveryUrl(
  platform: DeliveryPlatform,
  place: DeliveryPlaceUrls
): string {
  if (platform === "wolt" && place.deliveryWoltUrl) return place.deliveryWoltUrl;
  if (platform === "tenbis" && place.deliveryTenBisUrl) return place.deliveryTenBisUrl;
  if (platform === "mishloha" && place.deliveryMishlohaUrl) {
    return place.deliveryMishlohaUrl;
  }
  return searchFallback(platform, place.name);
}
