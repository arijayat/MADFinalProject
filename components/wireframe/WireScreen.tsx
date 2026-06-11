import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { Wireframe } from '@/constants/wireframe-theme';
import { useAppTheme } from '@/contexts/AppThemeContext';

type Props = {
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  /** Disable Reanimated layout transitions (use on camera capture screens). */
  animateLayout?: boolean;
};

export function WireScreen({
  children,
  footer,
  scroll = true,
  animateLayout = true,
}: Props) {
  const { colors } = useAppTheme();
  const body = scroll ? (
    <Animated.ScrollView
      entering={animateLayout ? FadeIn.duration(180) : undefined}
      layout={animateLayout ? LinearTransition.duration(180) : undefined}
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        footer ? styles.scrollContentWithFooter : null,
      ]}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="none"
      automaticallyAdjustKeyboardInsets
      showsVerticalScrollIndicator={false}>
      {children}
    </Animated.ScrollView>
  ) : animateLayout ? (
    <Animated.View
      entering={FadeIn.duration(180)}
      layout={LinearTransition.duration(180)}
      style={styles.flex}>
      {children}
    </Animated.View>
  ) : (
    <View style={styles.flex}>{children}</View>
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.screenBg }]}
      edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 4 : 0}>
        <View style={styles.inner}>
          {body}
          {footer ? (
            animateLayout ? (
              <Animated.View
                entering={FadeIn.duration(140)}
                layout={LinearTransition.duration(160)}
                style={styles.footer}>
                {footer}
              </Animated.View>
            ) : (
              <View style={styles.footer}>{footer}</View>
            )
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
    flexGrow: 1,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 14,
  },
  scrollContentWithFooter: {
    paddingBottom: 96,
  },
  footer: {
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
});
