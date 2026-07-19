/** Axios API client with JWT interceptors for DateSpot mobile app. */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  AuthLoginResponse,
  Place,
  PlaceDetail,
  PlaceReview,
  PlaceReviewsResponse,
  SubscriptionTier,
  User,
} from "@datespot/shared-types";
import { isAxiosError } from "axios";

import {
  apiClient,
  clearAuthStorage,
  configureApiBaseUrl,
  persistAuth,
  REFRESH_TOKEN_KEY,
  setUnauthorizedHandler,
  TOKEN_KEY,
  USER_KEY,
} from "./http";

export {
  apiClient,
  configureApiBaseUrl,
  setUnauthorizedHandler,
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
} from "./http";

export async function login(
  email: string,
  password: string
): Promise<AuthLoginResponse> {
  const response = await apiClient.post<AuthLoginResponse>("/api/auth/login", {
    email,
    password,
  });
  await persistAuth(response.data);
  return response.data;
}

export async function register(payload: {
  firstName: string;
  lastName: string;
  age: number;
  phone: string;
  email: string;
  password: string;
}): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>(
    "/api/auth/register",
    payload
  );
  return data;
}

export async function logout(refreshToken?: string): Promise<void> {
  try {
    await apiClient.post("/api/auth/logout", { refreshToken });
  } catch {
    // ignore — clear local auth regardless
  }
  await clearAuthStorage();
}

export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get<{ user: User }>("/api/auth/me");
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export async function updateProfile(payload: {
  fullName?: string;
  age?: number;
  phone?: string;
  onboardingDone?: boolean;
}): Promise<User> {
  const { data } = await apiClient.put<{ user: User }>("/api/auth/profile", payload);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>(
    "/api/auth/forgot-password",
    { email }
  );
  return data;
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>(
    "/api/auth/reset-password",
    { token, newPassword }
  );
  return data;
}

export async function sendOtp(phone: string): Promise<{ message: string; devCode?: string }> {
  const { data } = await apiClient.post<{ message: string; devCode?: string }>(
    "/api/auth/otp/send",
    { phone }
  );
  return data;
}

export async function verifyOtp(phone: string, code: string): Promise<{ user: User }> {
  const { data } = await apiClient.post<{ user: User }>("/api/auth/otp/verify", {
    phone,
    code,
  });
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

export async function loginWithGoogle(idToken: string): Promise<AuthLoginResponse> {
  const response = await apiClient.post<AuthLoginResponse>("/api/auth/social/google", {
    idToken,
  });
  await persistAuth(response.data);
  return response.data;
}

export async function loginWithApple(payload: {
  idToken: string;
  email?: string;
  fullName?: string;
}): Promise<AuthLoginResponse> {
  const response = await apiClient.post<AuthLoginResponse>(
    "/api/auth/social/apple",
    payload
  );
  await persistAuth(response.data);
  return response.data;
}

export async function registerPushToken(expoPushToken: string): Promise<void> {
  await apiClient.put("/api/auth/push-token", { expoPushToken });
}

export async function purchaseSubscription(
  tier: SubscriptionTier,
  options?: {
    receipt?: string;
    cardNumber?: string;
    cardExpiry?: string;
    cardCvv?: string;
    cardHolder?: string;
  }
): Promise<User> {
  const { data } = await apiClient.post<{ user: User }>(
    "/api/auth/subscriptions/purchase",
    {
      tier,
      receipt: options?.receipt,
      cardNumber: options?.cardNumber,
      cardExpiry: options?.cardExpiry,
      cardCvv: options?.cardCvv,
      cardHolder: options?.cardHolder,
    }
  );
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>(
    "/api/auth/change-password",
    { currentPassword, newPassword }
  );
  return data;
}

export async function getStoredUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as User;
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearAuth(): Promise<void> {
  const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  await logout(refreshToken ?? undefined);
}

export async function fetchPlaces(params: {
  category?: string;
  lat: number;
  lng: number;
  language?: string;
  radius?: number;
  q?: string;
}): Promise<Place[]> {
  const { data } = await apiClient.get<{ places: Place[] }>("/api/places", {
    params: { ...params, _t: Date.now() },
  });
  return data?.places ?? [];
}

export async function fetchPlace(id: string, language?: string): Promise<PlaceDetail> {
  const { data } = await apiClient.get<PlaceDetail>(`/api/places/${id}`, {
    params: language ? { language } : undefined,
  });
  return data;
}

export async function fetchSavedPlaces(language?: string): Promise<Place[]> {
  const { data } = await apiClient.get<{ places: Place[] }>("/api/places/saved", {
    params: language ? { language } : undefined,
  });
  return data.places;
}

export async function fetchFavoritePlaces(language?: string): Promise<Place[]> {
  const { data } = await apiClient.get<{ places: Place[] }>("/api/places/favorites", {
    params: language ? { language } : undefined,
  });
  return data.places;
}

export async function savePlace(placeId: string): Promise<void> {
  await apiClient.post("/api/places/save", { placeId });
}

export async function unsavePlace(placeId: string): Promise<void> {
  await apiClient.delete(`/api/places/save/${placeId}`);
}

export async function addFavorite(placeId: string): Promise<void> {
  await apiClient.post("/api/places/favorites", { placeId });
}

export async function removeFavorite(placeId: string): Promise<void> {
  await apiClient.delete(`/api/places/favorites/${placeId}`);
}

export async function fetchPlaceReviews(placeId: string): Promise<PlaceReviewsResponse> {
  const { data } = await apiClient.get<PlaceReviewsResponse>(
    `/api/places/${placeId}/reviews`
  );
  return data;
}

export async function submitPlaceReview(
  placeId: string,
  payload: { rating: number; text?: string }
): Promise<{ review: PlaceReview }> {
  const { data } = await apiClient.post<{ review: PlaceReview }>(
    `/api/places/${placeId}/reviews`,
    payload
  );
  return data;
}

export {
  fetchAdminStats,
  fetchAdminPlaces,
  createAdminPlace,
  updateAdminPlace,
  deleteAdminPlace,
  updateAdminPlaceOrder,
  fetchAdminUsers,
  updateUserSubscription,
} from "./admin";

export {
  fetchNearbyStatus,
  verifyNearbyAge,
  updateNearbyPresence,
  fetchNearbyUsers,
  sendNearbyInterest,
  fetchNearbyMatches,
  blockNearbyUser,
  reportNearbyUser,
} from "./nearby";

export {
  fetchAiQuota,
  fetchAiSessions,
  fetchAiSession,
  sendAiChat,
  startAiChat,
} from "./ai";
