import { Pressable, StyleSheet, Text } from 'react-native';

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
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
      <Text style={styles.reqLabel}>Requirements:</Text>
      <Text style={styles.reqList}>*{requirements.join(', ')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Wireframe.panelBg,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Wireframe.border,
    padding: 12,
    marginBottom: 10,
  },
  pressed: { opacity: 0.92 },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Wireframe.text,
    marginBottom: 4,
  },
  desc: {
    fontSize: 13,
    color: Wireframe.textMuted,
    marginBottom: 6,
  },
  reqLabel: {
    fontSize: 13,
    color: Wireframe.text,
    marginTop: 4,
  },
  reqList: {
    fontSize: 12,
    color: Wireframe.requirements,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
