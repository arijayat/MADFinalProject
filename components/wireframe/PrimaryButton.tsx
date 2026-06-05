import {
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    ViewStyle,
} from "react-native";

import { Wireframe } from "@/constants/wireframe-theme";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "dark" | "light";
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = "dark",
  style,
}: Props) {
  const dark = variant === "dark";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      android_ripple={{ color: "rgba(255,255,255,0.16)" }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={({ pressed }) => [
        styles.btn,
        dark ? styles.dark : styles.light,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, dark ? styles.labelLight : styles.labelDark]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 50,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  dark: {
    backgroundColor: Wireframe.primaryButton,
    boxShadow: "0 6px 16px rgba(15, 23, 42, 0.18)",
  },
  light: {
    backgroundColor: Wireframe.secondaryButton,
    borderColor: Wireframe.border,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0,
  },
  labelLight: { color: Wireframe.primaryButtonText },
  labelDark: { color: Wireframe.text },
});
