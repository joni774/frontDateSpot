/** Reset password with token from email deep link. */
import { resetPassword } from "@datespot/api-client";
import { Button, Input } from "@datespot/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (password.length < 8) {
      Alert.alert(t("common.error"), t("auth.passwordMinLength"));
      return;
    }
    if (password !== confirm) {
      Alert.alert(t("common.error"), t("changePassword.confirm"));
      return;
    }
    if (!token) {
      Alert.alert(t("common.error"), t("auth.invalidResetToken"));
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      Alert.alert(t("common.success"), t("auth.passwordResetSuccess"));
      router.replace("/auth/login");
    } catch {
      Alert.alert(t("common.error"), t("auth.passwordResetFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background px-6 justify-center">
      <Text className="text-2xl font-bold text-text mb-6">{t("auth.resetPassword")}</Text>
      <Input label={t("changePassword.new")} value={password} onChangeText={setPassword} secureTextEntry />
      <Input label={t("changePassword.confirm")} value={confirm} onChangeText={setConfirm} secureTextEntry />
      <Button onPress={() => void onSubmit()} loading={loading}>{t("auth.resetPassword")}</Button>
    </SafeAreaView>
  );
}
