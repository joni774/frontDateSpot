/** Shared TypeScript types mirrored from datespot-server API responses. */

export type SubscriptionTier = "FREE" | "PREMIUM" | "VIP" | "DATING";

export type PlaceCategory =
  | "ROMANTIC_DATE"
  | "RESTAURANT"
  | "DAIRY_RESTAURANT"
  | "MEAT_RESTAURANT"
  | "SUSHI"
  | "SUNSET"
  | "ATTRACTION";

export type PriceRange = "FREE" | "BUDGET" | "MODERATE" | "EXPENSIVE";

export type Language = "he" | "en" | "ar";

export interface User {
  id: string;
  fullName: string;
  age: number;
  phone: string;
  email: string;
  subscriptionTier: SubscriptionTier;
  isAdmin?: boolean;
  phoneVerified?: boolean;
  onboardingDone?: boolean;
  ageVerifiedAt?: string | null;
  isVisibleNearby?: boolean;
}

export interface Place {
  id: string;
  name: string;
  description: string;
  category: PlaceCategory;
  distance?: number;
  priceRange: PriceRange;
  images: string[];
  openingHours: Record<string, string>;
  isLocked?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface PlaceDetail extends Place {
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
  website?: string;
  deliveryWoltUrl?: string | null;
  deliveryTenBisUrl?: string | null;
  deliveryMishlohaUrl?: string | null;
  isOpen: boolean;
  isSaved?: boolean;
  isFavorite?: boolean;
  viewCount?: number;
  averageRating?: number | null;
  reviewCount?: number;
}

export interface PlaceReview {
  id: string;
  rating: number;
  text?: string | null;
  userName: string;
  createdAt: string;
}

export interface PlaceReviewsResponse {
  reviews: PlaceReview[];
  averageRating: number | null;
  reviewCount: number;
}

export interface AuthLoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface AdminStats {
  totalUsers: number;
  weeklyActiveUsers: number;
  premiumUsers: number;
  vipUsers: number;
  totalPlaces: number;
  placesByCategory: Record<PlaceCategory, number>;
}

export interface AdminPlace {
  id: string;
  nameHe: string;
  nameEn: string;
  nameAr: string;
  descriptionHe: string;
  descriptionEn: string;
  descriptionAr: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  address: string;
  priceRange: PriceRange;
  images: string[];
  openingHours: Record<string, string>;
  phone?: string | null;
  website?: string | null;
  deliveryWoltUrl?: string | null;
  deliveryTenBisUrl?: string | null;
  deliveryMishlohaUrl?: string | null;
  isActive: boolean;
  displayOrder: number;
  viewCount?: number;
}

export interface AdminUserListItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  subscriptionTier: SubscriptionTier;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminUsersResponse {
  users: AdminUserListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export type AdminPlaceInput = Omit<AdminPlace, "id">;

export interface ApiError {
  error: string;
}

export interface NearbyStatus {
  ageVerified: boolean;
  ageVerifiedAt: string | null;
  isVisibleNearby: boolean;
  isOnline: boolean;
  datingSubscribed: boolean;
}

export interface NearbyUser {
  id: string;
  displayName: string;
  age: number;
  approxDistance: string;
  interestSent: boolean;
  interestReceived: boolean;
  matched: boolean;
}

export interface NearbyMatch {
  id: string;
  displayName: string;
  age: number;
  matchedAt: string;
}

export interface AiPlaceRecommendation {
  id: string;
  name: string;
  description: string;
  category: PlaceCategory;
  priceRange: PriceRange;
  distanceKm: number | null;
  isOpen: boolean;
}

export interface AiRecommendations {
  primary: AiPlaceRecommendation;
  alternatives: AiPlaceRecommendation[];
}

export interface AiChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  recommendations?: AiRecommendations | null;
  createdAt?: string;
}

export interface AiQuickReply {
  value: string;
  label: string;
}

export interface AiChatResponse {
  sessionId: string;
  message: AiChatMessage;
  step: string;
  quickReplies: AiQuickReply[];
  advanced?: boolean;
}

export interface AiQuota {
  unlimited: boolean;
  used: number;
  limit: number;
  remaining: number | null;
}

export interface AiSessionSummary {
  id: string;
  language: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
}
