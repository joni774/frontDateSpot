/** Forgot password — sends reset link to email. */
import { forgotPassword } from "@datespot/api-client";
import { isAxiosError } from "axios";
import { Button, Input } from "@datespot/ui";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed || !EMAIL_RE.test(trimmed)) {
      Alert.alert(t("common.error"), t("validation.invalidEmail"));
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(trimmed);
      Alert.alert(t("common.success"), t("auth.resetEmailSent"));
      router.back();
    } catch (err) {
      if (isAxiosError(err) && !err.response) {
        Alert.alert(t("common.error"), t("auth.networkError"));
      } else if (isAxiosError(err) && err.response?.status === 400) {
        Alert.alert(t("common.error"), t("validation.invalidEmail"));
      } else {
        Alert.alert(t("common.error"), t("auth.resetEmailFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-2xl font-bold text-text mb-2">{t("auth.forgotPassword")}</Text>
          <Text className="text-gray-600 mb-6">{t("auth.forgotPasswordHint")}</Text>
          <Input
            label={t("auth.email")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Button onPress={() => void onSubmit()} loading={loading}>
            {t("auth.sendResetLink")}
          </Button>
          <Pressable onPress={() => router.back()} className="mt-4">
            <Text className="text-center text-primary">{t("common.back")}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
