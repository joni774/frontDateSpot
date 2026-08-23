/** Phone OTP verification screen. */
import { getStoredUser, sendOtp, verifyOtp } from "@datespot/api-client";
import { Button, Input } from "@datespot/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { isRtl } from "../../src/lib/rtl";

export default function VerifyOtpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user"],
    queryFn: getStoredUser,
  });
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  useEffect(() => {
    if (!phoneTouched && user?.phone) {
      setPhone(user.phone);
    }
  }, [user?.phone, phoneTouched]);

  const onSend = async () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      Alert.alert(t("common.error"), t("auth.phoneRequired"));
      return;
    }
    setSending(true);
    try {
      const res = await sendOtp(trimmed);
      if (res.devCode) {
        Alert.alert(t("auth.otpDevTitle"), t("auth.otpDevBody", { code: res.devCode }));
      } else {
        Alert.alert(t("common.success"), t("auth.otpSent"));
      }
    } catch {
      Alert.alert(t("common.error"), t("auth.otpSendFailed"));
    } finally {
      setSending(false);
    }
  };

  const onVerify = async () => {
    const trimmedPhone = phone.trim();
    const trimmedCode = code.trim();
    if (!trimmedPhone) {
      Alert.alert(t("common.error"), t("auth.phoneRequired"));
      return;
    }
    if (trimmedCode.length !== 6) {
      Alert.alert(t("common.error"), t("auth.otpCodeInvalid"));
      return;
    }
    setVerifying(true);
    try {
      await verifyOtp(trimmedPhone, trimmedCode);
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      Alert.alert(t("common.success"), t("auth.otpVerified"));
      router.back();
    } catch {
      Alert.alert(t("common.error"), t("auth.otpVerifyFailed"));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-3 border-b border-border bg-surface">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-lg">
            {isRtl() ? "→" : "←"} {t("common.back")}
          </Text>
        </Pressable>
        <Text className="text-xl font-bold text-text">{t("auth.verifyPhone")}</Text>
      </View>
      <View className="p-4">
        {user?.phoneVerified ? (
          <Text className="text-secondary mb-4">{t("auth.phoneAlreadyVerified")}</Text>
        ) : null}
        <Input
          label={t("auth.phone")}
          value={phone}
          onChangeText={(value) => {
            setPhoneTouched(true);
            setPhone(value);
          }}
          keyboardType="phone-pad"
          editable={!userLoading}
        />
        <Button onPress={() => void onSend()} loading={sending} variant="outline">
          {t("auth.sendOtp")}
        </Button>
        <Input
          label={t("auth.otpCode")}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
        />
        <Button onPress={() => void onVerify()} loading={verifying}>
          {t("auth.verifyOtp")}
        </Button>
      </View>
    </SafeAreaView>
  );
}
