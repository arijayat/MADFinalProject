import { StyleSheet, Text, View } from 'react-native';

import { LogOutNav } from '@/components/wireframe/LogOutNav';
import { Wireframe } from '@/constants/wireframe-theme';

type Props = {
  title: string;
  subtitle?: string;
};

export function TabScreenHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <LogOutNav />
      </View>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 10,
    paddingTop: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    color: Wireframe.panelBg,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0,
  },
  sub: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
});
