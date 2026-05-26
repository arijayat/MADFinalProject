import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/wireframe/BackNav';
import { FieldBlock } from '@/components/wireframe/FormFields';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { Panel } from '@/components/wireframe/Panel';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { getActivity } from '@/constants/activities';
import { Wireframe } from '@/constants/wireframe-theme';

export default function ActivityPredictionScreen() {
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const cfg = activityId ? getActivity(activityId) : undefined;
  const [values, setValues] = useState<Record<string, string>>({});

  const complete = useMemo(() => {
    if (!cfg) return false;
    return cfg.predictionFields.every((f) => (values[f.key] ?? '').trim().length > 0);
  }, [cfg, values]);

  if (!cfg) {
    return (
      <WireScreen>
        <Text style={styles.err}>Activity not found.</Text>
      </WireScreen>
    );
  }

  return (
    <WireScreen
      footer={
        <PrimaryButton
          label="UNLOCK SENSOR"
          disabled={!complete}
          onPress={() => router.push(`/activity/${cfg.id}/capture`)}
        />
      }>
      <ScreenHeader
        backLabel="BACK"
        onBack={() => router.back()}
        title="Prediction & Input"
        subtitle="Enter your hypothesis and experimental variables."
      />

      <View style={styles.callout}>
        <MaterialIcons name="notifications" size={18} color={Wireframe.text} />
        <Text style={styles.calloutText}>
          Scientific Method: Before collecting data, make a prediction based on your understanding of the
          science involved.
        </Text>
      </View>

      <Panel>
        {cfg.predictionFields.map((f) => (
          <FieldBlock
            key={f.key}
            field={f}
            value={values[f.key] ?? ''}
            onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
          />
        ))}
        <View style={styles.warnRow}>
          <MaterialIcons name="warning" size={18} color={Wireframe.accentYellow} />
          <Text style={styles.warn}>You must complete all predictions before the sensor unlocks.</Text>
        </View>
      </Panel>
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  err: { color: Wireframe.panelBg },
  callout: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Wireframe.panelBg,
    borderWidth: 1,
    borderColor: Wireframe.border,
    padding: 10,
    borderRadius: 4,
  },
  calloutText: { flex: 1, fontSize: 12, color: Wireframe.text, lineHeight: 17 },
  warnRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  warn: { flex: 1, fontSize: 12, color: Wireframe.textMuted },
});
