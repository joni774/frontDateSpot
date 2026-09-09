import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { layoutDirection } from "../lib/rtl";
import { colors } from "../theme/colors";

/** Root wrapper that applies layout direction from the active language. */
export function RtlShell({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const direction = layoutDirection(i18n.language);

  return <View style={[styles.root, { direction }]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
