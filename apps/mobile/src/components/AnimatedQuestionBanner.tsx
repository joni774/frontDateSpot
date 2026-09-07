import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AiTabIcon } from "./icons/AiTabIcon";
import { textAlignStart } from "../lib/rtl";
import { colors } from "../theme/colors";

const QUESTION_KEYS = [
  "letsGo",
  "howMany",
  "destination",
  "evening",
  "today",
  "romantic",
  "firstDate",
  "nearby",
  "budget",
  "vibe",
  "food",
  "sunset",
  "spontaneous",
] as const;

const TAB_BAR_HEIGHT = 64;
const HOLD_MS = 3000;
const TRANSITION_MS = 360;

type AnimatedQuestionBannerProps = {
  visible?: boolean;
};

export function AnimatedQuestionBanner({ visible = true }: AnimatedQuestionBannerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = Number.isFinite(insets.bottom) ? insets.bottom : 0;

  const questions = useMemo(
    () => QUESTION_KEYS.map((key) => t(`home.questionBanner.${key}`)),
    [t]
  );

  const [index, setIndex] = useState(0);

  const mountY = useRef(new Animated.Value(48)).current;
  const mountOpacity = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(1)).current;
  const textSlide = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(0)).current;

  const openAiWithQuestion = useCallback(() => {
    const question = questions[index]?.trim();
    if (!question) return;
    router.push({
      pathname: "/(app)/(tabs)/ai",
      params: { prompt: question, promptTs: String(Date.now()) },
    });
  }, [index, questions, router]);

  const runProgress = useCallback(() => {
    progress.stopAnimation();
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    if (!visible) return;

    mountY.setValue(48);
    mountOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(mountY, {
        toValue: 0,
        friction: 9,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.timing(mountOpacity, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    runProgress();
  }, [mountOpacity, mountY, runProgress, visible]);

  useEffect(() => {
    if (!visible) return;

    const floatAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -3,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 3,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    floatAnim.start();
    return () => floatAnim.stop();
  }, [floatY, visible]);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;

    const runTransition = () => {
      Animated.parallel([
        Animated.timing(textFade, {
          toValue: 0,
          duration: TRANSITION_MS * 0.45,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(textSlide, {
          toValue: -8,
          duration: TRANSITION_MS * 0.45,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished || cancelled) return;

        setIndex((current) => (current + 1) % questions.length);
        textSlide.setValue(10);
        runProgress();

        Animated.parallel([
          Animated.timing(textFade, {
            toValue: 1,
            duration: TRANSITION_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(textSlide, {
            toValue: 0,
            friction: 10,
            tension: 100,
            useNativeDriver: true,
          }),
        ]).start();

        timeout = setTimeout(runTransition, HOLD_MS);
      });
    };

    timeout = setTimeout(runTransition, HOLD_MS);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [questions.length, runProgress, textFade, textSlide, visible]);

  const onPressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.98,
      friction: 8,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      friction: 8,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const combinedY = Animated.add(mountY, floatY);
  const bottomOffset = TAB_BAR_HEIGHT + Math.max(bottomInset, Platform.OS === "web" ? 0 : 4);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.anchor,
          {
            bottom: bottomOffset,
            opacity: mountOpacity,
            transform: [{ translateY: combinedY }],
          },
        ]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={openAiWithQuestion}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityRole="button"
          accessibilityLabel={questions[index]}
          accessibilityHint={t("home.questionBanner.tapHint")}
        >
          <Animated.View
            style={{ transform: [{ scale: pressScale }] }}
            accessibilityLiveRegion="polite"
          >
            <View style={styles.card}>
              <View style={styles.contentRow}>
                <View style={styles.iconWrap}>
                  <AiTabIcon size={18} color={colors.primary} />
                </View>

                <View style={styles.textCol}>
                  <Text style={[styles.label, { textAlign: textAlignStart() }]}>
                    {t("home.questionBanner.badge")}
                  </Text>
                  <Animated.View
                    style={{
                      opacity: textFade,
                      transform: [{ translateY: textSlide }],
                    }}
                  >
                    <Text
                      style={[styles.question, { textAlign: textAlignStart() }]}
                      numberOfLines={1}
                    >
                      {questions[index]}
                    </Text>
                  </Animated.View>
                </View>

                <View style={styles.chevron}>
                  <Text style={styles.chevronText}>›</Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
              </View>

              <View style={styles.dots}>
                {questions.map((_, dotIndex) => (
                  <View
                    key={QUESTION_KEYS[dotIndex]}
                    style={[styles.dot, dotIndex === index && styles.dotActive]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.tail} pointerEvents="none" />
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  anchor: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#1A1918",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
      default: {
        shadowColor: "#1A1918",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
    }),
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${colors.primary}12`,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  question: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    color: colors.text,
  },
  chevron: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  chevronText: {
    fontSize: 22,
    fontWeight: "300",
    color: colors.outline,
    marginTop: -2,
  },
  progressTrack: {
    marginTop: 12,
    height: 2,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainer,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    marginTop: 10,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerHigh,
  },
  dotActive: {
    width: 14,
    backgroundColor: colors.primary,
  },
  tail: {
    alignSelf: "center",
    width: 14,
    height: 14,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    transform: [{ rotate: "45deg" }],
    marginTop: -8,
  },
});
