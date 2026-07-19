/** AI date planner — conversational place recommendations. */
import { fetchAiQuota, sendAiChat, startAiChat } from "@datespot/api-client";
import type { AiChatMessage, AiPlaceRecommendation, AiQuickReply } from "@datespot/shared-types";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getAiLanguage, type AppLanguage } from "../i18n/i18n";
import { colors } from "../theme/colors";

const DEFAULT_COORDS = { lat: 32.0853, lng: 34.7818 };

/** Send localized phrases so the server detects script + intent. */
function shortcutMessage(kind: "personal" | "hot", lang: AppLanguage): string {
  if (kind === "personal") {
    if (lang === "ar") return "توصيتي";
    if (lang === "en") return "my pick";
    return "המלצה שלי";
  }
  if (lang === "ar") return "توصية ساخنة";
  if (lang === "en") return "hot pick";
  return "המלצה חמה";
}

function detectMessageLanguage(text: string, fallback: AppLanguage): AppLanguage {
  if (/[\u0590-\u05FF]/.test(text)) return "he";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  return fallback;
}

function PlaceRecCard({
  place,
  primary,
  onPress,
  t,
}: {
  place: AiPlaceRecommendation;
  primary?: boolean;
  onPress: (id: string) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <Pressable
      onPress={() => onPress(place.id)}
      className={`rounded-xl border p-3 mb-2 ${primary ? "bg-primary/10 border-primary" : "bg-white border-gray-200"}`}
    >
      <Text className="font-bold text-text">{place.name}</Text>
      <Text className="text-gray-500 text-xs mt-1">
        {t(`place.categories.${place.category}`)} · {place.priceRange}
        {place.distanceKm != null ? ` · ${place.distanceKm} ${t("home.km")}` : ""}
        {place.isOpen ? ` · ${t("place.openNow")}` : ""}
      </Text>
      <Text className="text-gray-600 text-sm mt-1" numberOfLines={2}>
        {place.description}
      </Text>
      <Text className="text-primary text-sm mt-2 font-medium">{t("ai.viewPlace")} →</Text>
    </Pressable>
  );
}

function ChatBubble({
  msg,
  onPlacePress,
  t,
}: {
  msg: AiChatMessage;
  onPlacePress: (id: string) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const isUser = msg.role === "user";
  return (
    <View className={`mb-3 ${isUser ? "items-end" : "items-start"}`}>
      <View
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser ? "bg-primary rounded-br-sm" : "bg-white border border-gray-100 rounded-bl-sm"
        }`}
      >
        <Text className={isUser ? "text-white" : "text-text"}>{msg.content}</Text>
      </View>
      {msg.recommendations ? (
        <View className="w-full mt-2 px-1">
          <PlaceRecCard
            place={msg.recommendations.primary}
            primary
            onPress={onPlacePress}
            t={t}
          />
          {msg.recommendations.alternatives.map((p) => (
            <PlaceRecCard key={p.id} place={p} onPress={onPlacePress} t={t} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

type AiChatViewProps = {
  showBack?: boolean;
};

export function AiChatView({ showBack = false }: AiChatViewProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const listRef = useRef<FlatList>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [quickReplies, setQuickReplies] = useState<AiQuickReply[]>([]);
  const [input, setInput] = useState("");
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [starting, setStarting] = useState(true);
  const sessionIdRef = useRef<string | null>(null);

  const { data: quota, refetch: refetchQuota } = useQuery({
    queryKey: ["ai-quota"],
    queryFn: fetchAiQuota,
  });

  const resolveCoords = useCallback(async () => {
    if (Platform.OS === "web") return DEFAULT_COORDS;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return DEFAULT_COORDS;
    const loc = await Location.getCurrentPositionAsync({});
    return { lat: loc.coords.latitude, lng: loc.coords.longitude };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStarting(true);
    setSessionId(null);
    sessionIdRef.current = null;
    setMessages([]);
    setQuickReplies([]);
    setInput("");

    (async () => {
      // Match on-screen UI language (not a stale browser/storage "en").
      const lang = await getAiLanguage(i18n.language);
      const c = await resolveCoords();
      if (cancelled) return;
      setCoords(c);
      try {
        const res = await startAiChat({
          lat: c.lat,
          lng: c.lng,
          language: lang,
          // Hebrew "התחל" forces Hebrew reply even if language header is wrong.
          startMessage:
            lang === "he" ? "התחל" : lang === "ar" ? "ابدأ" : "start",
        });
        if (cancelled) return;
        sessionIdRef.current = res.sessionId;
        setSessionId(res.sessionId);
        setMessages([res.message]);
        setQuickReplies(res.quickReplies);
      } catch {
        if (cancelled) return;
        setMessages([
          {
            role: "assistant",
            content: t("ai.loadError"),
          },
        ]);
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resolveCoords, t, i18n.language]);

  const chatMutation = useMutation({
    mutationFn: async (text: string) => {
      const appLang = await getAiLanguage(i18n.language);
      const lang = detectMessageLanguage(text, appLang);
      return sendAiChat({
        sessionId: sessionIdRef.current ?? undefined,
        message: text,
        lat: coords.lat,
        lng: coords.lng,
        language: lang,
      });
    },
    onSuccess: (res, text) => {
      sessionIdRef.current = res.sessionId;
      setSessionId(res.sessionId);
      setMessages((prev) => [...prev, { role: "user", content: text }, res.message]);
      setQuickReplies(res.quickReplies);
      setInput("");
      void refetchQuota();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    },
  });

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || chatMutation.isPending) return;
    chatMutation.mutate(trimmed);
  };

  const sendShortcut = async (kind: "personal" | "hot") => {
    if (chatMutation.isPending || starting) return;
    const lang = await getAiLanguage(i18n.language);
    sendMessage(shortcutMessage(kind, lang));
  };

  const quotaLabel =
    quota?.unlimited
      ? t("ai.unlimited")
      : t("ai.quotaRemaining", { count: quota?.remaining ?? 0, limit: quota?.limit ?? 3 });

  const shortcutsBusy = starting || chatMutation.isPending;

  return (
    <SafeAreaView testID="ai-chat-screen" className="flex-1 bg-gray-50" edges={["top"]}>
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        {showBack ? (
          <Pressable onPress={() => router.back()} className="mr-3">
            <Text className="text-primary text-lg">← {t("common.back")}</Text>
          </Pressable>
        ) : null}
        <View className="flex-1">
          <Text className="text-xl font-bold text-text">{t("ai.title")}</Text>
          <Text className="text-gray-400 text-xs">{quotaLabel}</Text>
        </View>
      </View>

      <View style={styles.shortcutsRow}>
        <Pressable
          testID="ai-shortcut-personal"
          disabled={shortcutsBusy}
          onPress={() => void sendShortcut("personal")}
          style={[styles.shortcutCard, styles.shortcutPersonal, shortcutsBusy && styles.shortcutDisabled]}
        >
          <Text style={styles.shortcutTitle}>{t("ai.shortcutPersonal")}</Text>
          <Text style={styles.shortcutSubtitle}>{t("ai.shortcutPersonalHint")}</Text>
        </Pressable>
        <Pressable
          testID="ai-shortcut-hot"
          disabled={shortcutsBusy}
          onPress={() => void sendShortcut("hot")}
          style={[styles.shortcutCard, styles.shortcutHot, shortcutsBusy && styles.shortcutDisabled]}
        >
          <Text style={styles.shortcutTitle}>{t("ai.shortcutHot")}</Text>
          <Text style={styles.shortcutSubtitle}>{t("ai.shortcutHotHint")}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        {starting ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => (
              <ChatBubble
                msg={item}
                t={t}
                onPlacePress={(id) => router.push(`/(app)/place/${id}`)}
              />
            )}
          />
        )}

        {quickReplies.length > 0 ? (
          <View className="flex-row flex-wrap gap-2 px-4 py-2 bg-gray-50">
            {quickReplies.map((qr) => (
              <Pressable
                key={qr.value}
                onPress={() => sendMessage(qr.label)}
                className="bg-white border border-gray-200 rounded-full px-3 py-2"
              >
                <Text className="text-sm text-text">{qr.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View className="flex-row items-center gap-2 px-4 py-3 bg-white border-t border-gray-100">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t("ai.inputPlaceholder")}
            className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-text"
            onSubmitEditing={() => sendMessage(input)}
            editable={!chatMutation.isPending && !starting}
          />
          <Pressable
            onPress={() => sendMessage(input)}
            disabled={chatMutation.isPending || !input.trim()}
            className="bg-primary rounded-full px-4 py-3"
          >
            {chatMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white font-semibold">{t("ai.send")}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shortcutsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: "#F9FAFB",
  },
  shortcutCard: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  shortcutPersonal: {
    backgroundColor: "#F5E9ED",
    borderColor: "#D8B0BD",
  },
  shortcutHot: {
    backgroundColor: "#F3EEE8",
    borderColor: "#D4C2B0",
  },
  shortcutDisabled: {
    opacity: 0.55,
  },
  shortcutTitle: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: "700",
  },
  shortcutSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "500",
  },
});
