/** Resolve delivery-platform order URL for a place (affiliate or search fallback). */
import type { LeadType, PlaceCategory } from "@datespot/shared-types";

export type DeliveryPlatform = "wolt" | "tenbis" | "mishloha" | "cibus";

export const DELIVERY_LEAD_TYPE: Record<DeliveryPlatform, LeadType> = {
  wolt: "DELIVERY_WOLT",
  tenbis: "DELIVERY_TENBIS",
  mishloha: "DELIVERY_MISHLOHA",
  cibus: "DELIVERY_CIBUS",
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
  deliveryCibusUrl?: string | null;
};

const AFFILIATE_URL_FIELD: Record<DeliveryPlatform, keyof DeliveryPlaceUrls> = {
  wolt: "deliveryWoltUrl",
  tenbis: "deliveryTenBisUrl",
  mishloha: "deliveryMishlohaUrl",
  cibus: "deliveryCibusUrl",
};

export function shouldShowDeliveryOrder(place: DeliveryPlaceUrls): boolean {
  if (FOOD_ORDER_CATEGORIES.has(place.category)) return true;
  return Boolean(
    place.deliveryWoltUrl || place.deliveryTenBisUrl || place.deliveryMishlohaUrl || place.deliveryCibusUrl
  );
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
    case "cibus":
      return `https://www.cibus.co.il/restaurants?q=${q}`;
  }
}

export function resolveDeliveryUrl(
  platform: DeliveryPlatform,
  place: DeliveryPlaceUrls
): string {
  const affiliateUrl = place[AFFILIATE_URL_FIELD[platform]];
  if (typeof affiliateUrl === "string" && affiliateUrl) return affiliateUrl;
  return searchFallback(platform, place.name);
}
