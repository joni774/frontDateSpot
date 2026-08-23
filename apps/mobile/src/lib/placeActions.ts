import { Alert, Linking, Platform } from "react-native";

export type NavPlace = {
  name: string;
  latitude: number;
  longitude: number;
};

export function toWhatsAppNumber(phone: string): string {
  return phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
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
  labels: { title: string; waze: string; googleMaps: string; appleMaps: string; cancel: string }
): void {
  const { latitude, longitude, name } = place;
  const encodedName = encodeURIComponent(name);
  const googleWeb = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=&travelmode=driving`;
  const apple = `maps://?daddr=${latitude},${longitude}&q=${encodedName}&dirflg=d`;
  const waze = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;

  const buttons = [
    {
      text: labels.waze,
      onPress: () => void Linking.openURL(waze),
    },
    {
      text: labels.googleMaps,
      onPress: () => void Linking.openURL(googleWeb),
    },
    ...(Platform.OS === "ios"
      ? [
          {
            text: labels.appleMaps,
            onPress: () => void Linking.openURL(apple),
          },
        ]
      : []),
    { text: labels.cancel, style: "cancel" as const },
  ];

  Alert.alert(labels.title, name, buttons);
}
