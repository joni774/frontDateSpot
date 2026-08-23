/** AI date planner — conversational place recommendations. */
import { fetchAiQuota, sendAiChat, startAiChat } from "@datespot/api-client";
import type { AiChatMessage, AiPlaceRecommendation, AiQuickReply } from "@datespot/shared-types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { getAiLanguage, type AppLanguage } from "../i18n/i18n";
import { DEFAULT_COORDS, resolveDeviceCoords } from "../lib/deviceLocation";
import { textAlignStart } from "../lib/rtl";
import { colors } from "../theme/colors";
import { ScreenHeader } from "./ScreenHeader";

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

function BotAvatar({ size = 32 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primaryLight,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: size * 0.42, color: colors.primaryDark }}>✦</Text>
    </View>
  );
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
  const align = textAlignStart();
  const meta = [
    t(`place.categories.${place.category}`),
    t(`place.priceRange.${place.priceRange}`),
    place.distanceKm != null ? `${place.distanceKm} ${t("home.km")}` : null,
    place.isOpen ? t("place.openNow") : null,
  ]
    .filter(Boolean)
    .join(" · ");

  if (primary) {
    return (
      <Pressable onPress={() => onPress(place.id)} style={recStyles.hero}>
        {place.imageUrl ? (
          <Image source={{ uri: place.imageUrl }} style={recStyles.heroImage} resizeMode="cover" />
        ) : (
          <View style={[recStyles.heroImage, recStyles.heroPlaceholder]} />
        )}
        <LinearGradient
          colors={["transparent", "rgba(26,25,24,0.18)", "rgba(26,25,24,0.86)"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={recStyles.heroBody}>
          <View style={recStyles.heroBadges}>
            <View style={recStyles.heroBadge}>
              <Text style={recStyles.heroBadgeText}>{t("ai.topPick")}</Text>
            </View>
            {place.isSponsored ? (
              <View style={recStyles.heroBadge}>
                <Text style={recStyles.heroBadgeText}>{t("place.sponsored")}</Text>
              </View>
            ) : null}
          </View>
          <Text style={recStyles.heroName} numberOfLines={2}>
            {place.name}
          </Text>
          <Text style={recStyles.heroMeta} numberOfLines={1}>
            {meta}
          </Text>
          {place.description ? (
            <Text style={recStyles.heroDesc} numberOfLines={2}>
              {place.description}
            </Text>
          ) : null}
          <View style={recStyles.heroCta}>
            <Text style={recStyles.heroCtaText}>{t("ai.viewPlace")}</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={() => onPress(place.id)} style={recStyles.row}>
      {place.imageUrl ? (
        <Image source={{ uri: place.imageUrl }} style={recStyles.thumb} resizeMode="cover" />
      ) : (
        <View style={[recStyles.thumb, recStyles.thumbPlaceholder]} />
      )}
      <View style={recStyles.rowBody}>
        <Text style={[recStyles.rowName, { textAlign: align }]} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={[recStyles.rowMeta, { textAlign: align }]} numberOfLines={1}>
          {meta}
        </Text>
        {place.description ? (
          <Text style={[recStyles.rowDesc, { textAlign: align }]} numberOfLines={2}>
            {place.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const recStyles = StyleSheet.create({
  hero: {
    height: 240,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.surfaceContainer,
    marginBottom: 12,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  heroBody: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
  },
  heroBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  heroName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  heroMeta: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  heroDesc: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    marginTop: 4,
  },
  heroCta: {
    alignSelf: "flex-start",
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  heroCtaText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.surface,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: "#1A1918",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerHigh,
  },
  thumbPlaceholder: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  rowName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  rowMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  rowDesc: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
  },
});

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
  const recs = msg.recommendations;
  const alternatives = recs?.alternatives ?? [];

  return (
    <View style={bubbleStyles.block}>
      <View style={[bubbleStyles.row, isUser && bubbleStyles.rowUser]}>
        {isUser ? null : <BotAvatar size={28} />}
        <View style={[bubbleStyles.bubble, isUser ? bubbleStyles.user : bubbleStyles.bot]}>
          <Text style={isUser ? bubbleStyles.userText : bubbleStyles.botText}>{msg.content}</Text>
        </View>
      </View>
      {recs ? (
        <View style={bubbleStyles.recs}>
          <PlaceRecCard place={recs.primary} primary onPress={onPlacePress} t={t} />
          {alternatives.length > 0 ? (
            <Text style={[bubbleStyles.moreLabel, { textAlign: textAlignStart() }]}>
              {t("ai.morePlaces")}
            </Text>
          ) : null}
          {alternatives.map((p) => (
            <PlaceRecCard key={p.id} place={p} onPress={onPlacePress} t={t} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  block: {
    width: "100%",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  rowUser: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bot: {
    backgroundColor: colors.surfaceContainer,
    borderBottomRightRadius: 6,
  },
  user: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 6,
  },
  botText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    textAlign: textAlignStart(),
  },
  userText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
    textAlign: textAlignStart(),
  },
  recs: {
    width: "100%",
    marginTop: 12,
  },
  moreLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 8,
  },
});

type AiChatViewProps = {
  showBack?: boolean;
};

export function AiChatView({ showBack = false }: AiChatViewProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const listRef = useRef<FlatList>(null);
  const [, setSessionId] = useState<string | null>(null);
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
    const result = await resolveDeviceCoords();
    return result.coords;
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
      const lang = await getAiLanguage(i18n.language);
      const c = await resolveCoords();
      if (cancelled) return;
      setCoords(c);
      try {
        const res = await startAiChat({
          lat: c.lat,
          lng: c.lng,
          language: lang,
          startMessage: lang === "he" ? "התחל" : lang === "ar" ? "ابدأ" : "start",
        });
        if (cancelled) return;
        sessionIdRef.current = res.sessionId;
        setSessionId(res.sessionId);
        setMessages([res.message]);
        setQuickReplies(res.quickReplies);
      } catch {
        if (!cancelled) {
          setMessages([{ role: "assistant", content: t("ai.loadError") }]);
        }
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resolveCoords, t, i18n.language]);

  const chatMutation = useMutation({
    mutationFn: async (payload: { message: string; displayText: string }) => {
      const appLang = await getAiLanguage(i18n.language);
      const lang = detectMessageLanguage(payload.message, appLang);
      return sendAiChat({
        sessionId: sessionIdRef.current ?? undefined,
        message: payload.message,
        lat: coords.lat,
        lng: coords.lng,
        language: lang,
      });
    },
    onSuccess: (res, payload) => {
      sessionIdRef.current = res.sessionId;
      setSessionId(res.sessionId);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: payload.displayText },
        res.message,
      ]);
      setQuickReplies(res.quotaExceeded ? [] : res.quickReplies);
      setInput("");
      void refetchQuota();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    },
    onError: () => {
      Alert.alert(t("common.error"), t("ai.loadError"));
    },
  });

  const quotaBlocked = !!quota && !quota.unlimited && (quota.remaining ?? 0) <= 0;

  const sendMessage = (text: string, displayText?: string) => {
    const trimmed = text.trim();
    if (!trimmed || chatMutation.isPending || quotaBlocked) return;
    chatMutation.mutate({
      message: trimmed,
      displayText: (displayText ?? trimmed).trim(),
    });
  };

  const sendShortcut = async (kind: "personal" | "hot") => {
    if (chatMutation.isPending || starting || quotaBlocked) return;
    const lang = await getAiLanguage(i18n.language);
    sendMessage(shortcutMessage(kind, lang));
  };

  const quotaLabel = quota?.unlimited
    ? t("ai.unlimited")
    : quotaBlocked
      ? t("ai.quotaExceeded")
      : t("ai.quotaRemaining", { count: quota?.remaining ?? 0, limit: quota?.limit ?? 1 });

  const shortcutsBusy = starting || chatMutation.isPending || quotaBlocked;

  return (
    <View testID="ai-chat-screen" style={styles.screen}>
      <ScreenHeader title={t("ai.headerTitle")} showBack={showBack} />

      <View style={styles.botBar}>
        <BotAvatar size={48} />
        <View style={{ flex: 1 }}>
          <Text style={styles.botName}>{t("ai.botName")}</Text>
          <Text style={styles.botSub}>{quotaLabel}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        {starting ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ padding: 20, paddingBottom: 8 }}
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

        <View style={styles.vibeWrap}>
          {quotaBlocked ? (
            <View style={styles.paywall}>
              <Text style={[styles.paywallTitle, { textAlign: textAlignStart() }]}>
                {t("ai.quotaExceeded")}
              </Text>
              <Text style={[styles.paywallBody, { textAlign: textAlignStart() }]}>
                {t("ai.quotaPaywallBody")}
              </Text>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(app)/checkout",
                    params: { tier: "VIP" },
                  })
                }
                style={styles.paywallButton}
                accessibilityRole="button"
              >
                <Text style={styles.paywallButtonText}>{t("ai.quotaSubscribe")}</Text>
              </Pressable>
            </View>
          ) : (
            <>
          <Text style={[styles.vibeHint, { textAlign: textAlignStart() }]}>{t("ai.vibeHint")}</Text>
              <View style={styles.vibeRow}>
                <Pressable
                  testID="ai-shortcut-personal"
                  disabled={shortcutsBusy}
                  onPress={() => void sendShortcut("personal")}
                  style={[styles.chip, shortcutsBusy && styles.chipDisabled]}
                >
                  <Text style={styles.chipText}>{t("ai.shortcutPersonal")}</Text>
                </Pressable>
                <Pressable
                  testID="ai-shortcut-hot"
                  disabled={shortcutsBusy}
                  onPress={() => void sendShortcut("hot")}
                  style={[styles.chip, shortcutsBusy && styles.chipDisabled]}
                >
                  <Text style={styles.chipText}>{t("ai.shortcutHot")}</Text>
                </Pressable>
                {quickReplies.map((qr) => (
                  <Pressable
                    key={qr.value}
                    onPress={() => sendMessage(qr.value, qr.label)}
                    style={styles.chip}
                  >
                    <Text style={styles.chipText}>{qr.label}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>

        {quotaBlocked ? null : (
        <View style={styles.inputBar}>
          <View style={styles.inputPill}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t("ai.inputPlaceholder")}
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { textAlign: textAlignStart() }]}
              onSubmitEditing={() => sendMessage(input)}
              editable={!chatMutation.isPending && !starting}
            />
          </View>
          <Pressable
            onPress={() => sendMessage(input)}
            disabled={chatMutation.isPending || !input.trim()}
            style={[styles.send, (!input.trim() || chatMutation.isPending) && styles.sendDisabled]}
            accessibilityRole="button"
            accessibilityLabel={t("ai.send")}
          >
            {chatMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.sendGlyph}>➤</Text>
            )}
          </Pressable>
        </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  botBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceContainerHigh,
  },
  botName: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  botSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  vibeWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: colors.surface,
  },
  vibeHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
  vibeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    paddingBottom: 8,
  },
  chip: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipDisabled: {
    opacity: 0.55,
  },
  chipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surfaceContainerHigh,
  },
  inputPill: {
    flex: 1,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 999,
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: "center",
  },
  input: {
    fontSize: 16,
    color: colors.text,
  },
  paywall: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  paywallTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  paywallBody: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 12,
  },
  paywallButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  paywallButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: {
    opacity: 0.45,
  },
  sendGlyph: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
