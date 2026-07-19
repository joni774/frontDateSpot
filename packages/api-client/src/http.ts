/** Shared Axios instance with JWT interceptors and refresh token flow. */

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

export const TOKEN_KEY = "@datespot/token";
export const REFRESH_TOKEN_KEY = "@datespot/refreshToken";
export const USER_KEY = "@datespot/user";

let baseURL = "http://localhost:3000";
let refreshPromise: Promise<string | null> | null = null;

export function configureApiBaseUrl(url: string): void {
  baseURL = url;
  apiClient.defaults.baseURL = url;
}

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    "bypass-tunnel-reminder": "1",
  },
});

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post<{
      token: string;
      refreshToken: string;
      user: unknown;
    }>(`${baseURL}/api/auth/refresh`, { refreshToken });
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    if (data.user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    return data.token;
  } catch {
    return null;
  }
}

apiClient.interceptors.request.use(async (config) => {
  if (config.method?.toLowerCase() === "get") {
    config.headers.set("Cache-Control", "no-cache");
    config.headers.set("Pragma", "no-cache");
  }
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes("/api/auth/refresh") &&
      !original.url?.includes("/api/auth/login")
    ) {
      original._retry = true;
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
    }

    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export async function persistAuth(data: {
  token: string;
  refreshToken?: string;
  user: unknown;
}): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, data.token);
  if (data.refreshToken) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  }
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export async function clearAuthStorage(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
}
