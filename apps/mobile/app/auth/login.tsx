/** Login screen with email/password form and JWT storage. */
import { login } from "@datespot/api-client";
import { isAxiosError } from "axios";
import { Button, Input } from "@datespot/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
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
      router.replace("/(app)/home");
    } catch (err) {
      if (isAxiosError(err) && !err.response) {
        setError(t("auth.networkError"));
      } else {
        setError(t("auth.invalidCredentials"));
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-4xl font-bold text-primary text-center mb-2">
          DateSpot
        </Text>
        <Text className="text-gray-500 text-center mb-8">{t("auth.login")}</Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value }, fieldState: { error: fieldError } }) => (
            <Input
              label={t("auth.email")}
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

        {error ? (
          <Text className="text-red-500 text-center mb-4">{error}</Text>
        ) : null}

        <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting}>
          {t("auth.loginButton")}
        </Button>

        <Pressable onPress={() => router.push("/auth/register")} className="mt-6">
          <Text className="text-center text-gray-600">
            {t("auth.noAccount")}{" "}
            <Text className="text-primary font-semibold">{t("auth.register")}</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
