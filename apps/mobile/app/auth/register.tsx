/** Registration screen with validation and success modal flow. */
import { register } from "@datespot/api-client";
import { Button, Input } from "@datespot/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { z } from "zod";

const phoneRegex = /^(05\d-?\d{7}|\+9725\d-?\d{7})$/;

const schema = z
  .object({
    firstName: z.string().min(1, "Required"),
    lastName: z.string().min(1, "Required"),
    age: z.coerce.number().min(18, "Must be 18+").max(120, "Invalid age"),
    phone: z.string().regex(phoneRegex, "Invalid Israeli phone number"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      age: 18,
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await register({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        age: data.age,
        phone: data.phone,
        email: data.email.trim(),
        password: data.password,
      });
      Alert.alert(t("auth.registrationSuccess"), "", [
        { text: t("common.ok"), onPress: () => router.replace("/auth/login") },
      ]);
    } catch {
      setError(t("auth.registrationFailed"));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-semibold text-primary text-center mb-2 tracking-tight">
          DateSpot
        </Text>
        <Text className="text-gray-500 text-center mb-8">{t("auth.register")}</Text>

        <Controller
          control={control}
          name="firstName"
          render={({ field: { onChange, onBlur, value }, fieldState: { error: fieldError } }) => (
            <Input
              label={t("auth.firstName")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={fieldError?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="lastName"
          render={({ field: { onChange, onBlur, value }, fieldState: { error: fieldError } }) => (
            <Input
              label={t("auth.lastName")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={fieldError?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="age"
          render={({ field: { onChange, onBlur, value }, fieldState: { error: fieldError } }) => (
            <Input
              label={t("auth.age")}
              value={String(value)}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="number-pad"
              error={fieldError?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value }, fieldState: { error: fieldError } }) => (
            <Input
              label={t("auth.phone")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="phone-pad"
              error={fieldError?.message}
            />
          )}
        />

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
            <Input
              label={t("auth.password")}
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
              label={t("auth.confirmPassword")}
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
          {t("auth.registerButton")}
        </Button>

        <Pressable onPress={() => router.back()} className="mt-6">
          <Text className="text-center text-gray-600">
            {t("auth.haveAccount")}{" "}
            <Text className="text-primary font-semibold">{t("auth.login")}</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
