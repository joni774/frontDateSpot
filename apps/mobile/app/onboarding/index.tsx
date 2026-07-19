/**
 * Onboarding flow:
 * 1 — Welcome | 2 — Discover app | 3 — Login form
 * Slides 1–2: דלג / המשך at bottom
 */
import { Button } from "@datespot/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LoginForm } from "../../src/components/LoginForm";

const WELCOME_SLIDES = ["slide1", "slide2"] as const;
const TOTAL_STEPS = 3;

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  const goToLoginSlide = () => {
    setStep(2);
  };

  const continueNext = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  };

  const isLoginSlide = step === 2;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center min-h-[420px]">
            <Text className="text-4xl font-bold text-primary text-center mb-6">
              DateSpot
            </Text>

            <View className="flex-row justify-center mb-8 gap-2">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <View
                  key={i}
                  className={`h-2 rounded-full ${i === step ? "w-6 bg-primary" : "w-2 bg-gray-300"}`}
                />
              ))}
            </View>

            {isLoginSlide ? (
              <LoginForm showHeader={false} />
            ) : (
              <>
                <Text className="text-2xl font-bold text-text text-center mb-4 leading-8">
                  {t(`onboarding.${WELCOME_SLIDES[step]}Title`)}
                </Text>
                <Text className="text-gray-600 text-center text-base leading-7 px-2">
                  {t(`onboarding.${WELCOME_SLIDES[step]}Body`)}
                </Text>
              </>
            )}
          </View>
        </ScrollView>

        {!isLoginSlide ? (
          <View className="flex-row gap-3 px-6 pb-6 pt-2 border-t border-gray-100">
            <Pressable
              onPress={goToLoginSlide}
              className="flex-1 py-4 rounded-xl border border-gray-200 items-center"
              testID="onboarding-skip"
            >
              <Text className="text-gray-600 font-semibold text-base">
                {t("onboarding.skip")}
              </Text>
            </Pressable>
            <View className="flex-1">
              <Button onPress={continueNext} testID="onboarding-continue">
                {t("onboarding.continue")}
              </Button>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
