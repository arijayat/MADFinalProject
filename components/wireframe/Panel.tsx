import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Wireframe, wireframeStyles } from '@/constants/wireframe-theme';
import { useAppTheme } from '@/contexts/AppThemeContext';

type Props = {
  title?: string;
  children: ReactNode;
};

export function Panel({ title, children }: Props) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        wireframeStyles.panel,
        {
          backgroundColor: colors.panelBg,
          borderColor: colors.border,
          boxShadow: colors.shadow,
        },
      ]}>
      {title ? <Text style={[styles.panelTitle, { color: colors.text }]}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panelTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Wireframe.text,
    marginBottom: 10,
  },
});
