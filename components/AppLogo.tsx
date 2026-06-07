import { Image } from 'expo-image';
import { StyleSheet, View, type ViewStyle } from 'react-native';

type AppLogoProps = {
  size?: number;
  style?: ViewStyle;
  /** Pulls content below closer when the asset has bottom padding. */
  tight?: boolean;
};

export function AppLogo({ size = 220, style, tight = false }: AppLogoProps) {
  return (
    <View style={[styles.container, { width: size }, style]}>
      <Image
        source={require('@/assets/images/stem-learning-lab-logo.png')}
        style={[
          styles.logo,
          { width: size, height: size },
          tight && { marginBottom: -(size * 0.2) },
        ]}
        contentFit="contain"
        accessibilityLabel="STEM Learning Lab"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logo: {
    width: '100%',
  },
});
