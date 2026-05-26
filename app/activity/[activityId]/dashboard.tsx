import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/wireframe/BackNav';
import { Panel } from '@/components/wireframe/Panel';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { getActivity } from '@/constants/activities';
import { Wireframe } from '@/constants/wireframe-theme';

const PL_PRED = '123';
const PL_ACT = '127';

export default function ActivityDashboardScreen() {
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const cfg = activityId ? getActivity(activityId) : undefined;

  if (!cfg) {
    return (
      <WireScreen>
        <Text style={{ color: Wireframe.panelBg }}>Activity not found.</Text>
      </WireScreen>
    );
  }

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
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={[styles.cell, styles.h, styles.cVariable]}>Variable</Text>
              <Text style={[styles.cell, styles.h, styles.cValue, styles.center]}>Predicted</Text>
              <Text style={[styles.cell, styles.h, styles.cValue, styles.center]}>Actual</Text>
            </View>
            {cfg.dashboardVariables.map((v) => (
              <View key={v} style={styles.row}>
                <Text style={[styles.cell, styles.var, styles.cVariable]}>{v}</Text>
                <Text style={[styles.cell, styles.cValue, styles.center]}>{PL_PRED}</Text>
                <Text style={[styles.cell, styles.cValue, styles.center]}>{PL_ACT}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </Panel>
    </WireScreen>
  );
}

const TABLE_WIDTH = 220 + 80 + 80;

const styles = StyleSheet.create({
  cVariable: { width: 220 },
  cValue: { width: 80 },
  center: { textAlign: 'center' },
  table: {
    width: TABLE_WIDTH,
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
});
