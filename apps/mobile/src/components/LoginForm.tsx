/** Shared login form — used in onboarding slide 3 and /auth/login. */
import { login } from "@datespot/api-client";
import { isAxiosError } from "axios";
import { Button, Input } from "@datespot/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { z } from "zod";

import { useAuthSession } from "../auth/AuthSession";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

interface LoginFormProps {
  onSuccess?: () => void;
  showHeader?: boolean;
}

export function LoginForm({ onSuccess, showHeader = true }: LoginFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { activateSession } = useAuthSession();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await login(data.email, data.password);
      activateSession();
      onSuccess?.();
      router.replace("/(app)/(tabs)");
    } catch (err) {
      if (isAxiosError(err) && !err.response) {
        setError(t("auth.networkError"));
      } else {
        setError(t("auth.invalidCredentials"));
      }
    }
  };

  return (
    <View>
      {showHeader ? (
        <>
          <Text className="text-3xl font-semibold text-primary text-center mb-2 tracking-tight">
            DateSpot
          </Text>
          <Text className="text-text-muted text-center mb-8">{t("auth.login")}</Text>
        </>
      ) : null}

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value }, fieldState: { error: fieldError } }) => (
          <Input
            label={t("auth.email")}
            testID="login-email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="email-address"
            autoCapitalize="none"
            error={fieldError?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value }, fieldState: { error: fieldError } }) => (
          <View>
            <Input
              label={t("auth.password")}
              testID="login-password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry={!showPassword}
              error={fieldError?.message}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} className="mb-2">
              <Text className="text-primary text-sm text-right">
                {showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              </Text>
            </Pressable>
          </View>
        )}
      />

      {error ? <Text className="text-red-500 text-center mb-4">{error}</Text> : null}

      <Button testID="login-submit" onPress={handleSubmit(onSubmit)} loading={isSubmitting}>
        {t("auth.loginButton")}
      </Button>

      <Pressable onPress={() => router.push("/auth/forgot-password")} className="mt-4">
        <Text className="text-center text-primary text-sm">{t("auth.forgotPassword")}</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/auth/register")} className="mt-6">
        <Text className="text-center text-gray-600">
          {t("auth.noAccount")}{" "}
          <Text className="text-primary font-semibold">{t("auth.register")}</Text>
        </Text>
      </Pressable>
    </View>
  );
}
