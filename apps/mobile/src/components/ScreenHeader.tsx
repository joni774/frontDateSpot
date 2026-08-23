import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../theme/colors";
import { isRtl } from "../lib/rtl";
import { HeartIcon } from "./icons/HeartIcon";
import { PersonIcon } from "./icons/PersonIcon";

type Props = {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
};

export function ScreenHeader({ title, showBack, onBack }: Props) {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.bar}>
        <View style={styles.leading}>
          {showBack ? (
            <Pressable
              onPress={onBack ?? (() => router.back())}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text style={styles.back}>{isRtl() ? "→" : "←"}</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.push("/(app)/(tabs)/favorites")}
              hitSlop={8}
              accessibilityRole="button"
            >
              <HeartIcon color={colors.primary} size={22} />
            </Pressable>
          )}
          <Text style={[styles.title, { writingDirection: isRtl() ? "rtl" : "ltr" }]}>
            {title}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/(app)/(tabs)/profile")}
          style={styles.avatar}
          accessibilityRole="button"
        >
          <PersonIcon color="#FFFFFF" size={16} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: "rgba(250, 249, 247, 0.92)",
  },
  bar: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  back: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "600",
    marginRight: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
