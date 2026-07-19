import type { NearbyMatch, NearbyStatus, NearbyUser } from "@datespot/shared-types";

import { apiClient } from "./http";

export async function fetchNearbyStatus(): Promise<NearbyStatus> {
  const { data } = await apiClient.get<NearbyStatus>("/api/nearby/status");
  return data;
}

export async function verifyNearbyAge(): Promise<{ ageVerifiedAt: string }> {
  const { data } = await apiClient.post<{ ageVerifiedAt: string }>(
    "/api/nearby/verify-age",
    { confirmed: true }
  );
  return data;
}

export async function updateNearbyPresence(payload: {
  visible: boolean;
  lat?: number;
  lng?: number;
}): Promise<{ isVisibleNearby: boolean; isOnline: boolean }> {
  const { data } = await apiClient.put<{ isVisibleNearby: boolean; isOnline: boolean }>(
    "/api/nearby/presence",
    payload
  );
  return data;
}

export async function fetchNearbyUsers(lat: number, lng: number): Promise<NearbyUser[]> {
  const { data } = await apiClient.get<{ users: NearbyUser[] }>("/api/nearby/users", {
    params: { lat, lng },
  });
  return data.users;
}

export async function sendNearbyInterest(userId: string): Promise<{ matched: boolean }> {
  const { data } = await apiClient.post<{ matched: boolean }>(
    `/api/nearby/interest/${userId}`
  );
  return data;
}

export async function fetchNearbyMatches(): Promise<NearbyMatch[]> {
  const { data } = await apiClient.get<{ matches: NearbyMatch[] }>("/api/nearby/matches");
  return data.matches;
}

export async function blockNearbyUser(userId: string): Promise<void> {
  await apiClient.post(`/api/nearby/block/${userId}`);
}

export async function reportNearbyUser(userId: string, reason?: string): Promise<void> {
  await apiClient.post(`/api/nearby/report/${userId}`, { reason });
}
