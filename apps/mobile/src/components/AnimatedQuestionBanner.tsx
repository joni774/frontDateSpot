import AsyncStorage from "@react-native-async-storage/async-storage";
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
  ScrollView,
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

const DISMISS_STORAGE_KEY = "@datespot/question-banner-dismissed";
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
            backgroundColor: "rgba(255, 255, 255, 0.82)",
            backdropFilter: "blur(18px)",
          } as View["props"]["style"],
        ]}
      >
        <LinearGradient
          colors={["rgba(255, 236, 228, 0.55)", "rgba(255, 255, 255, 0.78)"]}
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
      <BlurView intensity={82} tint="light" style={styles.blurFill}>
        <LinearGradient
          colors={["rgba(255, 236, 228, 0.45)", "rgba(255, 255, 255, 0.22)"]}
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
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  const mountY = useRef(new Animated.Value(48)).current;
  const mountOpacity = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(1)).current;
  const textSlide = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const dismissAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(DISMISS_STORAGE_KEY);
        if (mounted) setDismissed(stored === "1");
      } catch {
        if (mounted) setDismissed(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const openAiWithQuestion = useCallback(() => {
    const question = questions[index]?.trim();
    if (!question) return;
    router.push({
      pathname: "/(app)/(tabs)/ai",
      params: { prompt: question, promptTs: String(Date.now()) },
    });
  }, [index, questions, router]);

  const dismissBanner = useCallback(() => {
    Animated.parallel([
      Animated.timing(dismissAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(mountY, {
        toValue: 32,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(async ({ finished }) => {
      if (!finished) return;
      setDismissed(true);
      try {
        await AsyncStorage.setItem(DISMISS_STORAGE_KEY, "1");
      } catch {
        // Still hide locally even if persistence fails.
      }
    });
  }, [dismissAnim, mountY]);

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
    if (!visible || dismissed !== false) return;

    mountY.setValue(48);
    mountOpacity.setValue(0);
    dismissAnim.setValue(1);

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
  }, [dismissAnim, dismissed, mountOpacity, mountY, runProgress, visible]);

  useEffect(() => {
    if (!visible || dismissed !== false) return;

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
  }, [dismissed, floatY, visible]);

  useEffect(() => {
    if (!visible || dismissed !== false) return;

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
          toValue: -6,
          duration: TRANSITION_MS * 0.45,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished || cancelled) return;

        setIndex((current) => (current + 1) % questions.length);
        textSlide.setValue(6);
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
  }, [dismissed, questions.length, runProgress, textFade, textSlide, visible]);

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

  if (!visible || dismissed !== false) return null;

  const questionText = questions[index];

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.anchor,
          {
            bottom: bottomOffset,
            opacity: Animated.multiply(mountOpacity, dismissAnim),
            transform: [{ translateY: combinedY }, { scale: dismissAnim }],
          },
        ]}
        pointerEvents="box-none"
      >
        <FrostedBubble>
          <View style={styles.cardInner}>
            <View style={styles.mainRow}>
              <Pressable
                onPress={openAiWithQuestion}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                accessibilityRole="button"
                accessibilityLabel={questionText}
                accessibilityHint={t("home.questionBanner.tapHint")}
                style={styles.tapArea}
              >
                <Animated.View
                  style={[styles.tapInner, { transform: [{ scale: pressScale }] }]}
                  accessibilityLiveRegion="polite"
                >
                  <View style={styles.iconWrap}>
                    <AiTabIcon size={22} color={colors.primary} />
                  </View>

                  <Animated.View
                    style={[
                      styles.questionWrap,
                      {
                        opacity: textFade,
                        transform: [{ translateY: textSlide }],
                      },
                    ]}
                  >
                    {Platform.OS === "android" ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        bounces={false}
                        style={styles.questionScroll}
                        contentContainerStyle={styles.questionScrollContent}
                      >
                        <Text style={[styles.question, { textAlign: textAlignStart() }]}>
                          {questionText}
                        </Text>
                      </ScrollView>
                    ) : (
                      <Text
                        style={[styles.question, { textAlign: textAlignStart() }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.82}
                      >
                        {questionText}
                      </Text>
                    )}
                  </Animated.View>

                  <Text style={styles.chevronText}>›</Text>
                </Animated.View>
              </Pressable>

              <Pressable
                onPress={dismissBanner}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={t("home.questionBanner.dismiss")}
                style={styles.closeBtn}
              >
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
          </View>
        </FrostedBubble>

        <View style={styles.tail} pointerEvents="none" />
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
    paddingHorizontal: 10,
  },
  cardShell: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(164, 60, 18, 0.28)",
    ...Platform.select({
      ios: {
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 22,
      },
      android: { elevation: 12 },
      default: {
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 18,
      },
    }),
  },
  blurFill: {
    overflow: "hidden",
  },
  glassSheen: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.72)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  cardInner: {
    paddingLeft: 14,
    paddingRight: 10,
    paddingTop: 12,
    paddingBottom: 12,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tapArea: {
    flex: 1,
    minWidth: 0,
  },
  tapInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(164, 60, 18, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(164, 60, 18, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  questionWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  questionScroll: {
    flexGrow: 0,
  },
  questionScrollContent: {
    alignItems: "center",
  },
  question: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "800",
    color: colors.primaryDark,
    letterSpacing: 0.15,
  },
  chevronText: {
    fontSize: 26,
    fontWeight: "400",
    color: colors.primary,
    marginTop: -1,
    paddingLeft: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(26, 28, 27, 0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "500",
    color: colors.textMuted,
    marginTop: -1,
  },
  progressTrack: {
    marginTop: 10,
    marginRight: 4,
    height: 3,
    borderRadius: 999,
    backgroundColor: "rgba(164, 60, 18, 0.14)",
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
    backgroundColor: "rgba(255, 248, 245, 0.9)",
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: "rgba(164, 60, 18, 0.28)",
    transform: [{ rotate: "45deg" }],
    marginTop: -9,
  },
});
