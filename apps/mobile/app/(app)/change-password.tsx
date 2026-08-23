/** Change password form posting to POST /api/auth/change-password. */
import { changePassword } from "@datespot/api-client";
import { Button, Input } from "@datespot/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

import { isRtl } from "../../src/lib/rtl";

type FormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function ChangePasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z
        .object({
          currentPassword: z.string().min(1, t("validation.required")),
          newPassword: z.string().min(8, t("validation.passwordMin")),
          confirmPassword: z.string().min(1, t("validation.required")),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: t("auth.passwordMismatch"),
          path: ["confirmPassword"],
        }),
    [t]
  );

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await changePassword(data.currentPassword, data.newPassword);
      Alert.alert(t("common.success"), t("changePassword.success"), [
        { text: t("common.ok"), onPress: () => router.back() },
      ]);
    } catch {
      setError(t("changePassword.failed"));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-lg">
            {isRtl() ? "→" : "←"} {t("common.back")}
          </Text>
        </Pressable>
        <Text className="text-xl font-bold text-text">
          {t("profile.changePassword")}
        </Text>
      </View>

      <ScrollView className="px-6 pt-6" keyboardShouldPersistTaps="handled">
        <Controller
          control={control}
          name="currentPassword"
          render={({ field: { onChange, onBlur, value }, fieldState: { error: fieldError } }) => (
            <Input
              label={t("changePassword.current")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              error={fieldError?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="newPassword"
          render={({ field: { onChange, onBlur, value }, fieldState: { error: fieldError } }) => (
            <Input
              label={t("changePassword.new")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              error={fieldError?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value }, fieldState: { error: fieldError } }) => (
            <Input
              label={t("changePassword.confirm")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              error={fieldError?.message}
            />
          )}
        />

        {error ? (
          <Text className="text-red-500 text-center mb-4">{error}</Text>
        ) : null}

        <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting}>
          {t("common.save")}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
