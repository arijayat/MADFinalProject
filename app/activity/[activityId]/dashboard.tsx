import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/wireframe/BackNav';
import { Panel } from '@/components/wireframe/Panel';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { getActivity } from '@/constants/activities';
import { Wireframe } from '@/constants/wireframe-theme';
import { useActivitySession } from '@/contexts/ActivitySessionContext';

const PL_PRED = '123';
const PL_ACT = '127';

type DashboardRow = {
  variable: string;
  predicted: string;
  actual: string;
};

export default function ActivityDashboardScreen() {
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const cfg = activityId ? getActivity(activityId) : undefined;
  const { getSession } = useActivitySession();

  const rows = useMemo((): DashboardRow[] => {
    if (!cfg) return [];
    const session = getSession(cfg.id);

    if (cfg.captureKind === 'decibel' && cfg.decibelActions) {
      const actionRows: DashboardRow[] = cfg.decibelActions.map((label, i) => ({
        variable: label,
        predicted: session.predictions[`action${i + 1}_pred`] ?? '—',
        actual:
          session.decibelReadings[i] != null ? `${session.decibelReadings[i].peakDb}` : '—',
      }));
      actionRows.push({
        variable: 'Location / zone',
        predicted: session.predictions.location ?? '—',
        actual: '—',
      });
      return actionRows;
    }

    return cfg.dashboardVariables.map((v) => ({
      variable: v,
      predicted: PL_PRED,
      actual: PL_ACT,
    }));
  }, [cfg, getSession]);

  const tableWidth = cfg?.captureKind === 'decibel' ? 260 + 88 + 72 : 220 + 80 + 80;

  if (!cfg) {
    return (
      <WireScreen>
        <Text style={{ color: Wireframe.panelBg }}>Activity not found.</Text>
      </WireScreen>
    );
  }

  const cVariable = cfg.captureKind === 'decibel' ? styles.cVariableWide : styles.cVariable;
  const cValue = cfg.captureKind === 'decibel' ? styles.cValueWide : styles.cValue;

  return (
    <WireScreen
      footer={
        <PrimaryButton label="CONTINUE TO REFLECTION" onPress={() => router.push(`/activity/${cfg.id}/reflection`)} />
      }>
      <ScreenHeader
        backLabel="BACK"
        onBack={() => router.back()}
        title="Analytical Dashboard"
        subtitle="Compare your predictions with actual results."
      />
      <Panel title="Prediction vs. Actual">
        <ScrollView horizontal>
          <View style={[styles.table, { width: tableWidth }]}>
            <View style={styles.row}>
              <Text style={[styles.cell, styles.h, cVariable]}>Variable</Text>
              <Text style={[styles.cell, styles.h, cValue, styles.center]}>Predicted</Text>
              <Text style={[styles.cell, styles.h, cValue, styles.center]}>Actual (dB)</Text>
            </View>
            {rows.map((row) => (
              <View key={row.variable} style={styles.row}>
                <Text style={[styles.cell, styles.var, cVariable]}>{row.variable}</Text>
                <Text style={[styles.cell, cValue, styles.center]}>{row.predicted}</Text>
                <Text style={[styles.cell, cValue, styles.center]}>{row.actual}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </Panel>
      {cfg.captureKind === 'decibel' ? (
        <Text style={styles.note}>
          Actual dB values come from your phone microphone. Compare which action was loudest and whether your
          louder/softer predictions were correct.
        </Text>
      ) : null}
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  cVariable: { width: 220 },
  cVariableWide: { width: 260 },
  cValue: { width: 80 },
  cValueWide: { width: 88 },
  center: { textAlign: 'center' },
  table: {
    borderWidth: 1,
    borderColor: Wireframe.border,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Wireframe.border,
  },
  cell: {
    padding: 8,
    fontSize: 12,
    color: Wireframe.text,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: Wireframe.border,
  },
  h: {
    fontWeight: '800',
    backgroundColor: '#f0f0f0',
  },
  var: { fontWeight: '600' },
  note: {
    marginTop: 10,
    fontSize: 12,
    color: '#aaa',
    lineHeight: 17,
  },
});
