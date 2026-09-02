/** Reset password with token from email deep link. */
import { resetPassword } from "@datespot/api-client";
import { isAxiosError } from "axios";
import { Button, Input } from "@datespot/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
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

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const resetToken = typeof token === "string" ? token.trim() : "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (password.length < 8) {
      Alert.alert(t("common.error"), t("auth.passwordMinLength"));
      return;
    }
    if (password !== confirm) {
      Alert.alert(t("common.error"), t("auth.passwordMismatch"));
      return;
    }
    if (!resetToken) {
      Alert.alert(t("common.error"), t("auth.invalidResetToken"));
      return;
    }
    setLoading(true);
    try {
      await resetPassword(resetToken, password);
      Alert.alert(t("common.success"), t("auth.passwordResetSuccess"));
      router.replace("/auth/login");
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 400) {
        Alert.alert(t("common.error"), t("auth.invalidResetToken"));
      } else if (isAxiosError(err) && !err.response) {
        Alert.alert(t("common.error"), t("auth.networkError"));
      } else {
        Alert.alert(t("common.error"), t("auth.passwordResetFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <SafeAreaView className="flex-1 bg-background px-6 justify-center">
        <Text className="text-2xl font-bold text-text mb-3">{t("auth.resetPassword")}</Text>
        <Text className="text-text-muted text-base leading-7 mb-6">
          {t("auth.invalidResetToken")}
        </Text>
        <Button onPress={() => router.replace("/auth/login")}>{t("auth.login")}</Button>
        <Pressable onPress={() => router.replace("/auth/forgot-password")} className="mt-4 py-3">
          <Text className="text-center text-primary font-semibold">
            {t("auth.forgotPassword")}
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

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
          <Text className="text-2xl font-bold text-text mb-6">{t("auth.resetPassword")}</Text>
          <Input
            label={t("changePassword.new")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Input
            label={t("changePassword.confirm")}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />
          <Button onPress={() => void onSubmit()} loading={loading}>
            {t("auth.resetPassword")}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
