/** Register Expo push token with the server (optional — skipped in local dev without EAS). */
import { registerPushToken } from "@datespot/api-client";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getEasProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId
  );
}

export async function setupPushNotifications(): Promise<void> {
  if (Platform.OS === "web") return;

  const projectId = getEasProjectId();
  if (!projectId) {
    // Expo Go / local dev without EAS — push is disabled, not an error
    return;
  }

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await registerPushToken(token);
  } catch {
    // Push is optional — never block login or app usage
  }
}
