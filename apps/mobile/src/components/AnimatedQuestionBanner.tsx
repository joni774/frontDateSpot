import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
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

function FrostedBubble({ children }: { children: React.ReactNode }) {
  if (Platform.OS === "web") {
    return (
      <View
        style={[
          styles.cardShell,
          {
            backgroundColor: "rgba(255, 255, 255, 0.78)",
            backdropFilter: "blur(18px)",
          } as View["props"]["style"],
        ]}
      >
        <LinearGradient
          colors={["rgba(255, 255, 255, 0.88)", "rgba(250, 249, 247, 0.78)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.glassSheen} pointerEvents="none" />
        {children}
      </View>
    );
  }

  return (
    <View style={styles.cardShell}>
      <BlurView intensity={78} tint="light" style={styles.blurFill}>
        <LinearGradient
          colors={["rgba(255, 255, 255, 0.52)", "rgba(255, 255, 255, 0.18)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.glassSheen} pointerEvents="none" />
        {children}
      </BlurView>
    </View>
  );
}

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
  const bottomOffset = TAB_BAR_HEIGHT + Math.max(bottomInset, Platform.OS === "web" ? 0 : 6);

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
            <FrostedBubble>
              <View style={styles.cardInner}>
                <View style={styles.headerRow}>
                  <View style={styles.iconWrap}>
                    <AiTabIcon size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.label, { textAlign: textAlignStart() }]}>
                    {t("home.questionBanner.badge")}
                  </Text>
                  <Text style={styles.chevronText}>›</Text>
                </View>

                <Animated.View
                  style={{
                    opacity: textFade,
                    transform: [{ translateY: textSlide }],
                  }}
                >
                  <Text
                    style={[styles.question, { textAlign: textAlignStart() }]}
                    numberOfLines={2}
                  >
                    {questions[index]}
                  </Text>
                </Animated.View>

                <View style={styles.progressTrack}>
                  <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                </View>
              </View>
            </FrostedBubble>

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
    paddingHorizontal: 12,
  },
  cardShell: {
    width: "100%",
    maxWidth: 390,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.72)",
    ...Platform.select({
      ios: {
        shadowColor: "#1A1918",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
      },
      android: { elevation: 10 },
      default: {
        shadowColor: "#1A1918",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
    }),
  },
  blurFill: {
    overflow: "hidden",
  },
  glassSheen: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.65)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  cardInner: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(164, 60, 18, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  question: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "700",
    color: colors.text,
    minHeight: 54,
  },
  chevronText: {
    fontSize: 24,
    fontWeight: "300",
    color: colors.outline,
    marginTop: -2,
  },
  progressTrack: {
    marginTop: 14,
    height: 3,
    borderRadius: 999,
    backgroundColor: "rgba(164, 60, 18, 0.12)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  tail: {
    alignSelf: "center",
    width: 16,
    height: 16,
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.72)",
    transform: [{ rotate: "45deg" }],
    marginTop: -9,
  },
});
