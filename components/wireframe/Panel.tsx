import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Wireframe, wireframeStyles } from '@/constants/wireframe-theme';

type Props = {
  title?: string;
  children: ReactNode;
};

export function Panel({ title, children }: Props) {
  return (
    <View style={wireframeStyles.panel}>
      {title ? <Text style={styles.panelTitle}>{title}</Text> : null}
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
