/** Primary action button with loading state and variant styles. */
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type ButtonVariant = "primary" | "secondary" | "outline";

interface ButtonProps extends PressableProps {
  children: React.ReactNode;
  loading?: boolean;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  children,
  loading = false,
  variant = "primary",
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={[
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#E84393"} />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text` as keyof typeof styles]]}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: "#E84393" },
  secondary: { backgroundColor: "#e5e7eb" },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#E84393",
  },
  disabled: { opacity: 0.5 },
  text: { fontSize: 16, fontWeight: "600" },
  primaryText: { color: "#fff" },
  secondaryText: { color: "#1a1a1a" },
  outlineText: { color: "#E84393" },
});
