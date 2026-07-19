import type {
  AiChatMessage,
  AiChatResponse,
  AiQuota,
  AiSessionSummary,
} from "@datespot/shared-types";

import { apiClient } from "./http";

export async function fetchAiQuota(): Promise<AiQuota> {
  const { data } = await apiClient.get<AiQuota>("/api/ai/quota");
  return data;
}

export async function fetchAiSessions(): Promise<AiSessionSummary[]> {
  const { data } = await apiClient.get<{ sessions: AiSessionSummary[] }>("/api/ai/sessions");
  return data.sessions;
}

export async function fetchAiSession(sessionId: string): Promise<{
  id: string;
  language: string;
  messages: AiChatMessage[];
}> {
  const { data } = await apiClient.get<{
    session: { id: string; language: string; messages: AiChatMessage[] };
  }>(`/api/ai/sessions/${sessionId}`);
  return data.session;
}

/** Normalize app language codes for AI endpoints ("he-IL" → "he"). Hebrew is default. */
export function resolveAiLanguage(raw?: string | null): "he" | "en" | "ar" {
  if (!raw) return "he";
  const base = raw.toLowerCase().split(/[-_]/)[0]?.trim();
  if (base === "en" || base === "ar" || base === "he") return base;
  return "he";
}

/** Pick best language code from i18n (resolvedLanguage first). */
export function resolveAiLanguageFromI18n(i18nLike: {
  resolvedLanguage?: string;
  language?: string;
}): "he" | "en" | "ar" {
  return resolveAiLanguage(i18nLike.resolvedLanguage || i18nLike.language || "he");
}

export async function sendAiChat(payload: {
  sessionId?: string;
  message: string;
  lat?: number;
  lng?: number;
  language?: string;
}): Promise<AiChatResponse> {
  const { data } = await apiClient.post<AiChatResponse>("/api/ai/chat", {
    ...payload,
    language: resolveAiLanguage(payload.language),
  });
  return data;
}

export async function startAiChat(payload: {
  lat?: number;
  lng?: number;
  language?: string;
  /** Override start token; use Hebrew/Arabic script to lock reply language. */
  startMessage?: string;
}): Promise<AiChatResponse> {
  const { startMessage, ...rest } = payload;
  return sendAiChat({
    ...rest,
    language: resolveAiLanguage(payload.language),
    message: startMessage ?? "start",
  });
}
