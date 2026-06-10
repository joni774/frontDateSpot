/** Axios API client with JWT interceptors for DateSpot mobile app. */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  AuthLoginResponse,
  Place,
  PlaceDetail,
  User,
} from "@datespot/shared-types";

import { apiClient, TOKEN_KEY, USER_KEY } from "./http";

export {
  apiClient,
  configureApiBaseUrl,
  setUnauthorizedHandler,
  TOKEN_KEY,
  USER_KEY,
} from "./http";

export async function login(
  email: string,
  password: string
): Promise<AuthLoginResponse> {
  const { data } = await apiClient.post<AuthLoginResponse>("/api/auth/login", {
    email,
    password,
  });
  await AsyncStorage.setItem(TOKEN_KEY, data.token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

export async function register(payload: {
  fullName: string;
  age: number;
  phone: string;
  email: string;
}): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>(
    "/api/auth/register",
    payload
  );
  return data;
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
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

export async function fetchPlaces(params: {
  category?: string;
  lat: number;
  lng: number;
  language?: string;
}): Promise<Place[]> {
  const { data } = await apiClient.get<{ places: Place[] }>("/api/places", {
    params,
  });
  return data.places;
}

export async function fetchPlace(id: string): Promise<PlaceDetail> {
  const { data } = await apiClient.get<PlaceDetail>(`/api/places/${id}`);
  return data;
}

export async function fetchSavedPlaces(): Promise<Place[]> {
  const { data } = await apiClient.get<{ places: Place[] }>(
    "/api/places/saved"
  );
  return data.places;
}

export async function savePlace(placeId: string): Promise<void> {
  await apiClient.post("/api/places/save", { placeId });
}

export async function unsavePlace(placeId: string): Promise<void> {
  await apiClient.delete(`/api/places/save/${placeId}`);
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
