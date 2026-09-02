/** Google / Apple "continue with" buttons — shown when the corresponding provider is configured. */
// Apple Sign-In is temporarily disabled: the "Sign in with Apple" capability isn't yet
// enabled for co.il.datespot.app in the Apple Developer Portal, so any build that links
// expo-apple-authentication fails code signing. Re-enable once that's set up.
// import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { loginWithApple, loginWithGoogle } from "@datespot/api-client";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, Text, View } from "react-native";

import { useAuthSession } from "../auth/AuthSession";

WebBrowser.maybeCompleteAuthSession();

const extra = (Constants.expoConfig?.extra ?? {}) as {
  googleIosClientId?: string;
  googleAndroidClientId?: string;
  googleWebClientId?: string;
};

// expo-auth-session picks the client id by platform internally (iosClientId on iOS,
// androidClientId on Android, webClientId otherwise) and THROWS synchronously
// (invariantClientId) if that specific platform's id is missing — even if a different
// platform's id is set. Mirror that selection here so we only mount the hook when the
// id it will actually need is present, instead of letting it crash the login screen.
const REQUIRED_GOOGLE_CLIENT_ID = Platform.select({
  ios: extra.googleIosClientId,
  android: extra.googleAndroidClientId,
  default: extra.googleWebClientId,
});

const GOOGLE_CONFIGURED = Boolean(REQUIRED_GOOGLE_CLIENT_ID);

interface SocialLoginButtonsProps {
  onSuccess?: () => void;
}

function GoogleSignInButton({ onSuccess }: SocialLoginButtonsProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { activateSession } = useAuthSession();
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: extra.googleIosClientId || undefined,
    androidClientId: extra.googleAndroidClientId || undefined,
    webClientId: extra.googleWebClientId || undefined,
  });

  useEffect(() => {
    if (response?.type === "success" && response.params.id_token) {
      handleGoogleToken(response.params.id_token);
    }
  }, [response]);

  const afterLogin = () => {
    activateSession();
    onSuccess?.();
    router.replace("/(app)/(tabs)");
  };

  async function handleGoogleToken(idToken: string) {
    setError(null);
    try {
      await loginWithGoogle(idToken);
      afterLogin();
    } catch {
      setError(t("auth.socialLoginFailed"));
    }
  }

  return (
    <>
      <Pressable
        testID="social-login-google"
        disabled={!request}
        onPress={() => promptAsync()}
        className="flex-row items-center justify-center border border-gray-300 rounded-xl py-3 mb-3"
      >
        <Text className="text-text font-medium">{t("auth.continueWithGoogle")}</Text>
      </Pressable>

      {error ? <Text className="text-red-500 text-center mt-3">{error}</Text> : null}
    </>
  );
}

export function SocialLoginButtons({ onSuccess }: SocialLoginButtonsProps) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable] = useState(false);

  async function handleApplePress() {
    // Disabled along with the AppleAuthentication import above.
    setError(t("auth.socialLoginFailed"));
  }

  if (!GOOGLE_CONFIGURED && !appleAvailable) return null;

  return (
    <View className="mt-6">
      <View className="flex-row items-center mb-4">
        <View className="flex-1 h-px bg-gray-200" />
        <Text className="mx-3 text-gray-400 text-sm">{t("auth.orContinueWith")}</Text>
        <View className="flex-1 h-px bg-gray-200" />
      </View>

      {GOOGLE_CONFIGURED ? <GoogleSignInButton onSuccess={onSuccess} /> : null}

      {appleAvailable ? (
        <Pressable
          onPress={handleApplePress}
          className="flex-row items-center justify-center bg-black rounded-xl py-3"
          style={{ width: "100%", height: 48 }}
        >
          <Text className="text-white font-medium">{t("auth.continueWithApple")}</Text>
        </Pressable>
      ) : null}

      {error ? <Text className="text-red-500 text-center mt-3">{error}</Text> : null}
    </View>
  );
}
