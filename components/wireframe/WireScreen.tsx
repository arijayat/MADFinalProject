import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp, LinearTransition } from 'react-native-reanimated';

import { Wireframe } from '@/constants/wireframe-theme';
import { useAppTheme } from '@/contexts/AppThemeContext';

type Props = {
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
};

export function WireScreen({ children, footer, scroll = true }: Props) {
  const { colors } = useAppTheme();
  const body = scroll ? (
    <Animated.ScrollView
      entering={FadeInUp.duration(220).springify().damping(18)}
      layout={LinearTransition.duration(180)}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
      showsVerticalScrollIndicator={false}>
      {children}
    </Animated.ScrollView>
  ) : (
    <Animated.View
      entering={FadeInUp.duration(220).springify().damping(18)}
      layout={LinearTransition.duration(180)}
      style={styles.flex}>
      {children}
    </Animated.View>
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.screenBg }]}
      edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 4 : 0}>
        <View style={styles.inner}>
          {body}
          {footer ? (
            <Animated.View
              entering={FadeInUp.duration(180)}
              layout={LinearTransition.duration(160)}
              style={styles.footer}>
              {footer}
            </Animated.View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Wireframe.screenBg,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 10,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 32,
    gap: 14,
  },
  footer: {
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
});
