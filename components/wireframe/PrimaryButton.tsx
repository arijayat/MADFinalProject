import {
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Wireframe } from "@/constants/wireframe-theme";
import { useAppTheme } from "@/contexts/AppThemeContext";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "dark" | "light";
  style?: StyleProp<ViewStyle>;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = "dark",
  style,
}: Props) {
  const { colors } = useAppTheme();
  const scale = useSharedValue(1);
  const dark = variant === "dark";
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => {
        // eslint-disable-next-line react-hooks/immutability
        if (!disabled) scale.value = withTiming(0.975, { duration: 90 });
      }}
      onPressOut={() => {
        // eslint-disable-next-line react-hooks/immutability
        scale.value = withTiming(1, { duration: 120 });
      }}
      disabled={disabled}
      android_ripple={{ color: "rgba(255,255,255,0.16)" }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={[
        styles.btn,
        dark
          ? styles.dark
          : [
              styles.light,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.border,
              },
            ],
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      <Text style={[styles.label, dark ? styles.labelLight : { color: colors.text }]}>
        {label}
      </Text>
    </AnimatedPressable>
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
  label: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0,
  },
  labelLight: { color: Wireframe.primaryButtonText },
  labelDark: { color: Wireframe.text },
});
