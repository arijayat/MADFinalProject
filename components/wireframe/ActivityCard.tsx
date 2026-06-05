import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Wireframe } from '@/constants/wireframe-theme';

type Props = {
  title: string;
  description: string;
  requirements: string[];
  onPress: () => void;
};

export function ActivityCard({ title, description, requirements, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.topRow}>
        <View style={styles.iconBubble}>
          <MaterialIcons name="science" size={20} color={Wireframe.accent} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <MaterialIcons name="chevron-right" size={22} color={Wireframe.textMuted} />
      </View>
      <Text style={styles.desc}>{description}</Text>
      <Text style={styles.reqLabel}>Requirements</Text>
      <Text style={styles.reqList}>{requirements.slice(0, 3).join(' · ')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Wireframe.panelBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Wireframe.border,
    padding: 16,
    marginBottom: 2,
    boxShadow: Wireframe.shadow,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Wireframe.accentSoft,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: Wireframe.text,
  },
  desc: {
    fontSize: 13,
    color: Wireframe.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  reqLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Wireframe.text,
    textTransform: 'uppercase',
  },
  reqList: {
    fontSize: 12,
    color: Wireframe.requirements,
    marginTop: 4,
    lineHeight: 17,
  },
});
