/** Registration form — profile details only; password is emailed by the server. */
import { register } from "@datespot/api-client";
import { isAxiosError } from "axios";
import { Button, Input } from "@datespot/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Pressable, Text, TextInput, View } from "react-native";
import { z } from "zod";

const phoneRegex = /^(05\d-?\d{7}|\+9725\d-?\d{7})$/;

type FormData = {
  firstName: string;
  lastName: string;
  age: number;
  phone: string;
  email: string;
};

interface RegisterFormProps {
  onSuccess?: () => void;
  showHeader?: boolean;
}

export function RegisterForm({ onSuccess, showHeader = true }: RegisterFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [devPassword, setDevPassword] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [passwordCopied, setPasswordCopied] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        firstName: z.string().min(1, t("validation.required")),
        lastName: z.string().min(1, t("validation.required")),
        age: z.coerce
          .number({ invalid_type_error: t("validation.invalidAge") })
          .min(18, t("validation.mustBe18"))
          .max(120, t("validation.invalidAge")),
        phone: z.string().regex(phoneRegex, t("validation.invalidPhone")),
        email: z.string().email(t("validation.invalidEmail")),
      }),
    [t]
  );

  const copyDevPassword = async () => {
    if (!devPassword) return;
    await Clipboard.setStringAsync(devPassword);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  };

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
    },
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const result = await register({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        age: data.age,
        phone: data.phone.trim(),
        email: data.email.trim(),
      });
      setRegisteredEmail(data.email.trim());
      setDevPassword(result.devPassword ?? null);
      setCompleted(true);
      onSuccess?.();
    } catch (err) {
      if (isAxiosError(err) && !err.response) {
        setError(t("auth.networkError"));
      } else {
        setError(t("auth.registrationFailed"));
      }
    }
  };

  if (completed) {
    return (
      <View className="items-center px-2">
        <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-5">
          <Text className="text-3xl text-primary">✓</Text>
        </View>
        <Text className="text-2xl font-semibold text-text text-center mb-3">
          {t("auth.checkEmailTitle")}
        </Text>
        <Text className="text-text-muted text-center text-base leading-7 mb-4">
          {t("auth.checkEmailBody", { email: registeredEmail })}
        </Text>
        {devPassword ? (
          <View className="w-full rounded-[10px] border border-border bg-surface p-4 mb-5">
            <Text className="text-text-muted text-sm text-center mb-2">
              {t("auth.devPasswordHint")}
            </Text>
            <TextInput
              value={devPassword}
              editable={false}
              selectTextOnFocus
              showSoftInputOnFocus={false}
              contextMenuHidden={false}
              className="text-primary text-center text-lg font-semibold tracking-wide py-2"
              accessibilityLabel={t("auth.devPasswordHint")}
            />
            <Pressable
              testID="copy-dev-password"
              onPress={() => void copyDevPassword()}
              className="mt-3 py-2.5 rounded-[10px] border border-primary items-center"
            >
              <Text className="text-primary font-semibold">
                {passwordCopied ? t("auth.passwordCopied") : t("auth.copyPassword")}
              </Text>
            </Pressable>
          </View>
        ) : null}
        <Button onPress={() => router.replace("/auth/login")}>{t("auth.goToLogin")}</Button>
      </View>
    );
  }

  return (
    <View>
      {showHeader ? (
        <>
          <Text className="text-3xl font-semibold text-primary text-center mb-2 tracking-tight">
            DateSpot
          </Text>
          <Text className="text-text-muted text-center mb-2">{t("auth.register")}</Text>
          <Text className="text-text text-center text-base mb-6 leading-7">
            {t("auth.registerSubtitle")}
          </Text>
        </>
      ) : null}

      <View className="rounded-[14px] border border-border bg-surface p-4 mb-5">
        <Text className="text-text text-sm leading-6 text-center">{t("auth.passwordEmailHint")}</Text>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, onBlur, value }, fieldState: { error: fieldError } }) => (
              <Input
                label={t("auth.firstName")}
                testID="register-first-name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={fieldError?.message}
              />
            )}
          />
        </View>
        <View className="flex-1">
          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, onBlur, value }, fieldState: { error: fieldError } }) => (
              <Input
                label={t("auth.lastName")}
                testID="register-last-name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={fieldError?.message}
              />
            )}
          />
        </View>
      </View>

      <Controller
        control={control}
        name="age"
        render={({ field: { onChange, onBlur, value }, fieldState: { error: fieldError } }) => (
          <Input
            label={t("auth.age")}
            testID="register-age"
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
            testID="register-phone"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="phone-pad"
            placeholder={t("validation.phonePlaceholder")}
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
            testID="register-email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="email-address"
            autoCapitalize="none"
            error={fieldError?.message}
          />
        )}
      />

      {error ? <Text className="text-red-500 text-center mb-4">{error}</Text> : null}

      <Button testID="register-submit" onPress={handleSubmit(onSubmit)} loading={isSubmitting}>
        {t("auth.createAccount")}
      </Button>

      <Pressable onPress={() => router.replace("/auth/login")} className="mt-6">
        <Text className="text-center text-text-muted">
          {t("auth.haveAccount")}{" "}
          <Text className="text-primary font-semibold">{t("auth.login")}</Text>
        </Text>
      </Pressable>
    </View>
  );
}
