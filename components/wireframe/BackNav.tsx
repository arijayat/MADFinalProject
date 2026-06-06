import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Wireframe } from '@/constants/wireframe-theme';

type Props = {
  label: string;
  onPress: () => void;
};

export function BackNav({ label, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.row} hitSlop={8}>
      <MaterialIcons name="chevron-left" size={22} color={Wireframe.panelBg} />
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

export function ScreenHeader({
  backLabel,
  onBack,
  title,
  subtitle,
}: {
  backLabel: string;
  onBack: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.headerBlock}>
      <BackNav label={backLabel} onPress={onBack} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 10,
    paddingVertical: 4,
  },
  text: {
    color: Wireframe.panelBg,
    fontSize: 13,
    fontWeight: '700',
  },
  headerBlock: {
    marginBottom: 14,
  },
  title: {
    color: Wireframe.panelBg,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
});
