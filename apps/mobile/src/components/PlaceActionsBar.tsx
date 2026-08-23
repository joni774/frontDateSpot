import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

type Props = {
  onNavigate: () => void;
  onCall?: () => void;
  onWhatsApp?: () => void;
  navigateLabel: string;
  callLabel: string;
  whatsappLabel: string;
};

export function PlaceActionsBar({
  onNavigate,
  onCall,
  onWhatsApp,
  navigateLabel,
  callLabel,
  whatsappLabel,
}: Props) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onNavigate} style={[styles.btn, styles.primary]} accessibilityRole="button">
        <Text style={styles.primaryText}>{navigateLabel}</Text>
      </Pressable>
      {onCall ? (
        <Pressable onPress={onCall} style={[styles.btn, styles.secondary]} accessibilityRole="button">
          <Text style={styles.secondaryText}>{callLabel}</Text>
        </Pressable>
      ) : null}
      {onWhatsApp ? (
        <Pressable onPress={onWhatsApp} style={[styles.btn, styles.secondary]} accessibilityRole="button">
          <Text style={styles.secondaryText}>{whatsappLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
  },
  btn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surfaceContainer,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
  },
  secondaryText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
  },
});
