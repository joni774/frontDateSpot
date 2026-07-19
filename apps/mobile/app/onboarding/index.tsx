/**
 * Onboarding flow:
 * 1 — Welcome | 2 — Discover app | 3 — Create account or login
 */
import { Button } from "@datespot/ui";
import { useRouter } from "expo-router";
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
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showLogin, setShowLogin] = useState(false);

  const continueNext = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  };

  const goToAuthStep = () => {
    setStep(2);
  };

  const isAuthStep = step === 2;

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
            <Text className="text-3xl font-semibold text-primary text-center mb-6 tracking-tight">
              DateSpot
            </Text>

            <View className="flex-row justify-center mb-8 gap-2">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <View
                  key={i}
                  className={`h-1.5 rounded-full ${i === step ? "w-6 bg-primary" : "w-1.5 bg-border"}`}
                />
              ))}
            </View>

            {isAuthStep ? (
              showLogin ? (
                <View>
                  <Text className="text-2xl font-semibold text-text text-center mb-2">
                    {t("auth.login")}
                  </Text>
                  <Text className="text-text-muted text-center mb-6 leading-7">
                    {t("auth.loginSubtitle")}
                  </Text>
                  <LoginForm showHeader={false} />
                  <Pressable
                    onPress={() => router.push("/auth/register")}
                    className="mt-4 py-3"
                  >
                    <Text className="text-center text-text-muted">
                      {t("auth.noAccount")}{" "}
                      <Text className="text-primary font-semibold">{t("auth.register")}</Text>
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View className="items-center px-2">
                  <Text className="text-2xl font-semibold text-text text-center mb-3 leading-8">
                    {t("onboarding.step3Title")}
                  </Text>
                  <Text className="text-text-muted text-center text-base leading-7 mb-8">
                    {t("onboarding.step3Body")}
                  </Text>
                  <Button
                    testID="onboarding-create-account"
                    onPress={() => router.push("/auth/register")}
                    style={{ alignSelf: "stretch" }}
                  >
                    {t("onboarding.createAccount")}
                  </Button>
                  <Pressable
                    onPress={() => setShowLogin(true)}
                    className="mt-5 py-3"
                    testID="onboarding-show-login"
                  >
                    <Text className="text-center text-primary font-semibold text-base">
                      {t("onboarding.haveAccountLogin")}
                    </Text>
                  </Pressable>
                </View>
              )
            ) : (
              <>
                <Text className="text-2xl font-semibold text-text text-center mb-4 leading-8">
                  {t(`onboarding.${WELCOME_SLIDES[step]}Title`)}
                </Text>
                <Text className="text-text-muted text-center text-base leading-7 px-2">
                  {t(`onboarding.${WELCOME_SLIDES[step]}Body`)}
                </Text>
              </>
            )}
          </View>
        </ScrollView>

        {!isAuthStep ? (
          <View className="flex-row gap-3 px-6 pb-6 pt-2 border-t border-border">
            <Pressable
              onPress={goToAuthStep}
              className="flex-1 py-4 rounded-[10px] border border-border items-center bg-surface"
              testID="onboarding-skip"
            >
              <Text className="text-text-muted font-semibold text-base">
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
