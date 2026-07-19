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
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DEFAULT_COORDS = { lat: 32.0853, lng: 34.7818 };

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

function ChatBubble({ msg, onPlacePress, t }: {
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

export default function AiChatScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const listRef = useRef<FlatList>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [quickReplies, setQuickReplies] = useState<AiQuickReply[]>([]);
  const [input, setInput] = useState("");
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [starting, setStarting] = useState(true);

  const { data: quota } = useQuery({
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
    (async () => {
      const c = await resolveCoords();
      setCoords(c);
      try {
        const res = await startAiChat({
          lat: c.lat,
          lng: c.lng,
          language: i18n.language,
        });
        setSessionId(res.sessionId);
        setMessages([res.message]);
        setQuickReplies(res.quickReplies);
      } catch {
        setMessages([
          {
            role: "assistant",
            content: t("ai.loadError"),
          },
        ]);
      } finally {
        setStarting(false);
      }
    })();
  }, [i18n.language, resolveCoords, t]);

  const chatMutation = useMutation({
    mutationFn: (text: string) =>
      sendAiChat({
        sessionId: sessionId ?? undefined,
        message: text,
        lat: coords.lat,
        lng: coords.lng,
        language: i18n.language,
      }),
    onSuccess: (res, text) => {
      setSessionId(res.sessionId);
      setMessages((prev) => [...prev, { role: "user", content: text }, res.message]);
      setQuickReplies(res.quickReplies);
      setInput("");
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    },
  });

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || chatMutation.isPending) return;
    chatMutation.mutate(trimmed);
  };

  const quotaLabel =
    quota?.unlimited
      ? t("ai.unlimited")
      : t("ai.quotaRemaining", { count: quota?.remaining ?? 0, limit: quota?.limit ?? 3 });

  return (
    <SafeAreaView testID="ai-chat-screen" className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-lg">← {t("common.back")}</Text>
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-bold text-text">{t("ai.title")}</Text>
          <Text className="text-gray-400 text-xs">{quotaLabel}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        {starting ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#B84A62" />
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
                onPress={() => sendMessage(qr.value)}
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
