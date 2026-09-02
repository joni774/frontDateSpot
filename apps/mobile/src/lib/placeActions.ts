import { Alert, Linking, Platform } from "react-native";

export type NavPlace = {
  name: string;
  latitude: number;
  longitude: number;
};

export function toWhatsAppNumber(phone: string): string {
  return phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
}

/**
 * Opens a URL and surfaces a translated alert if the OS can't handle it
 * (e.g. no browser/app installed, malformed URL, offline). Never throws.
 */
export async function safeOpenUrl(url: string, errorMessage: string): Promise<boolean> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert(errorMessage);
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert(errorMessage);
    return false;
  }
}

export function openPlaceCall(phone: string): void {
  void Linking.openURL(`tel:${phone}`);
}

export function openPlaceWhatsApp(phone: string, text: string): void {
  void Linking.openURL(
    `https://wa.me/${toWhatsAppNumber(phone)}?text=${encodeURIComponent(text)}`
  );
}

export function openPlaceNavigation(
  place: NavPlace,
  labels: { title: string; waze: string; googleMaps: string; appleMaps: string; cancel: string },
  options?: { onNavigate?: () => void }
): void {
  const { latitude, longitude, name } = place;
  const encodedName = encodeURIComponent(name);
  const googleWeb = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=&travelmode=driving`;
  const apple = `maps://?daddr=${latitude},${longitude}&q=${encodedName}&dirflg=d`;
  const waze = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;

  const chooseNav = (url: string) => {
    options?.onNavigate?.();
    void Linking.openURL(url);
  };

  const buttons = [
    {
      text: labels.waze,
      onPress: () => chooseNav(waze),
    },
    {
      text: labels.googleMaps,
      onPress: () => chooseNav(googleWeb),
    },
    ...(Platform.OS === "ios"
      ? [
          {
            text: labels.appleMaps,
            onPress: () => chooseNav(apple),
          },
        ]
      : []),
    { text: labels.cancel, style: "cancel" as const },
  ];

  Alert.alert(labels.title, name, buttons);
}
