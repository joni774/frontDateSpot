/** Shared TypeScript types mirrored from datespot-server API responses. */

export type SubscriptionTier = "FREE" | "PREMIUM" | "VIP";

export type PlaceCategory =
  | "ROMANTIC_DATE"
  | "RESTAURANT"
  | "DAIRY_RESTAURANT"
  | "MEAT_RESTAURANT"
  | "SUSHI"
  | "SUNSET"
  | "ATTRACTION";

export type PriceRange = "FREE" | "BUDGET" | "MODERATE" | "EXPENSIVE";

export interface User {
  id: string;
  fullName: string;
  age: number;
  phone: string;
  email: string;
  subscriptionTier: SubscriptionTier;
  isAdmin?: boolean;
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
}

export interface PlaceDetail extends Place {
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
  website?: string;
  isOpen: boolean;
  isSaved?: boolean;
}

export interface AuthLoginResponse {
  token: string;
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
  isActive: boolean;
  displayOrder: number;
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
