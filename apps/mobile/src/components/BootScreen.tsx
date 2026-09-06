/** Full-screen boot placeholder — StyleSheet so it still shows if NativeWind fails. */
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { colors } from "../theme/colors";

export function BootScreen() {
  return (
    <View style={styles.root} testID="boot-screen">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
