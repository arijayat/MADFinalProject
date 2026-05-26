import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Wireframe } from '@/constants/wireframe-theme';

type Props = {
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
};

export function WireScreen({ children, footer, scroll = true }: Props) {
  const body = scroll ? (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={styles.flex}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.inner}>
        {body}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
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
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
    gap: 12,
  },
  footer: {
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#444',
  },
});
