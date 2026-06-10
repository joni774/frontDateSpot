/** Admin API client — calls /api/admin/* with JWT from AsyncStorage. */

import type {
  AdminPlace,
  AdminPlaceInput,
  AdminStats,
  AdminUsersResponse,
  SubscriptionTier,
  User,
} from "@datespot/shared-types";

import { apiClient } from "./http";

export async function fetchAdminStats(): Promise<AdminStats> {
  const { data } = await apiClient.get<AdminStats>("/api/admin/stats");
  return data;
}

export async function fetchAdminPlaces(): Promise<AdminPlace[]> {
  const { data } = await apiClient.get<{ places: AdminPlace[] }>(
    "/api/admin/places"
  );
  return data.places;
}

export async function createAdminPlace(
  payload: AdminPlaceInput
): Promise<AdminPlace> {
  const { data } = await apiClient.post<AdminPlace>(
    "/api/admin/places",
    payload
  );
  return data;
}

export async function updateAdminPlace(
  id: string,
  payload: Partial<AdminPlaceInput>
): Promise<AdminPlace> {
  const { data } = await apiClient.put<AdminPlace>(
    `/api/admin/places/${id}`,
    payload
  );
  return data;
}

export async function deleteAdminPlace(id: string): Promise<AdminPlace> {
  const { data } = await apiClient.delete<AdminPlace>(
    `/api/admin/places/${id}`
  );
  return data;
}

export async function updateAdminPlaceOrder(
  id: string,
  displayOrder: number
): Promise<AdminPlace> {
  const { data } = await apiClient.put<AdminPlace>(
    `/api/admin/places/${id}/order`,
    { displayOrder }
  );
  return data;
}

export async function fetchAdminUsers(
  page = 1,
  limit = 20,
  tier?: SubscriptionTier
): Promise<AdminUsersResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (tier) params.set("tier", tier);
  const { data } = await apiClient.get<AdminUsersResponse>(
    `/api/admin/users?${params}`
  );
  return data;
}

export async function updateUserSubscription(
  id: string,
  tier: SubscriptionTier
): Promise<User> {
  const { data } = await apiClient.put<User>(
    `/api/admin/users/${id}/subscription`,
    { tier }
  );
  return data;
}
