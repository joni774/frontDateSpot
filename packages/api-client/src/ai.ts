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

export async function sendAiChat(payload: {
  sessionId?: string;
  message: string;
  lat?: number;
  lng?: number;
  language?: string;
}): Promise<AiChatResponse> {
  const { data } = await apiClient.post<AiChatResponse>("/api/ai/chat", payload);
  return data;
}

export async function startAiChat(payload: {
  lat?: number;
  lng?: number;
  language?: string;
}): Promise<AiChatResponse> {
  return sendAiChat({ ...payload, message: "start" });
}
