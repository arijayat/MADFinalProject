import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { ScreenHeader } from '@/components/wireframe/BackNav';
import { Panel } from '@/components/wireframe/Panel';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { getActivity } from '@/constants/activities';
import { Wireframe } from '@/constants/wireframe-theme';

export default function ActivityIntroScreen() {
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const cfg = activityId ? getActivity(activityId) : undefined;
  const [gear, setGear] = useState<Record<string, boolean>>({});

  if (!cfg) {
    return (
      <WireScreen>
        <Text style={styles.err}>Activity not found.</Text>
        <PrimaryButton label="BACK TO HUB" onPress={() => router.replace('/(tabs)')} />
      </WireScreen>
    );
  }

  const gearState = cfg.gear.map((g) => ({
    label: g,
    checked: gear[g] ?? true,
  }));

  return (
    <WireScreen
      footer={
        <PrimaryButton label="START ACTIVITY" onPress={() => router.push(`/activity/${cfg.id}/prediction`)} />
      }>
      <ScreenHeader
        backLabel="BACK TO HUB"
        onBack={() => router.replace('/(tabs)')}
        title={cfg.title}
        subtitle={cfg.subtitle}
      />

      <Panel title="Gear Check">
        <Text style={styles.panelHint}>Make sure you have all the equipment before starting.</Text>
        {gearState.map((item) => (
          <Pressable
            key={item.label}
            style={styles.checkRow}
            onPress={() => setGear((s) => ({ ...s, [item.label]: !item.checked }))}>
            <MaterialIcons
              name={item.checked ? 'check-box' : 'check-box-outline-blank'}
              size={22}
              color={Wireframe.text}
            />
            <Text style={styles.checkLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </Panel>

      <Panel title="Safety Instructions">
        {cfg.safety.map((line, i) => (
          <View key={i} style={styles.safeRow}>
            <MaterialIcons name="notifications-active" size={18} color={Wireframe.textMuted} />
            <Text style={styles.safeText}>{line}</Text>
          </View>
        ))}
      </Panel>
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  err: { color: Wireframe.panelBg, marginBottom: 16 },
  panelHint: {
    fontSize: 13,
    color: Wireframe.textMuted,
    marginBottom: 8,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  checkLabel: { fontSize: 14, color: Wireframe.text },
  safeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  safeText: { flex: 1, fontSize: 13, color: Wireframe.text, lineHeight: 18 },
});
