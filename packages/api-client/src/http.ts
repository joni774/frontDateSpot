/** Shared Axios instance with JWT interceptors. */

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError } from "axios";

export const TOKEN_KEY = "@datespot/token";
export const USER_KEY = "@datespot/user";

let baseURL = "http://localhost:3000";

export function configureApiBaseUrl(url: string): void {
  baseURL = url;
  apiClient.defaults.baseURL = url;
}

export const apiClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler;
}

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);
