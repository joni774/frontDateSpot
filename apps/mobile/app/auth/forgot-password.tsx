/** Forgot password — sends reset link to email. */
import { forgotPassword } from "@datespot/api-client";
import { Button, Input } from "@datespot/ui";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      Alert.alert(t("common.success"), t("auth.resetEmailSent"));
      router.back();
    } catch {
      Alert.alert(t("common.error"), t("auth.resetEmailFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background px-6 justify-center">
      <Text className="text-2xl font-bold text-text mb-2">{t("auth.forgotPassword")}</Text>
      <Text className="text-gray-600 mb-6">{t("auth.forgotPasswordHint")}</Text>
      <Input label={t("auth.email")} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <Button onPress={() => void onSubmit()} loading={loading}>{t("auth.sendResetLink")}</Button>
      <Pressable onPress={() => router.back()} className="mt-4">
        <Text className="text-center text-primary">{t("common.back")}</Text>
      </Pressable>
    </SafeAreaView>
  );
}
