/** Main app stack: tab navigator + modal/detail screens. */
import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="place/[id]" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="nearby" />
      <Stack.Screen name="ai-chat" />
      <Stack.Screen name="admin" />
    </Stack>
  );
}
