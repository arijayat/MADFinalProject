import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/wireframe/BackNav';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { Panel } from '@/components/wireframe/Panel';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { LEADERBOARD_SAMPLE, getActivity } from '@/constants/activities';
import { Wireframe } from '@/constants/wireframe-theme';

export default function ActivityLeaderboardScreen() {
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
      footer={<PrimaryButton label="RETURN TO HUB" onPress={() => router.replace('/(tabs)')} />}>
      <ScreenHeader
        backLabel="BACK"
        onBack={() => router.back()}
        title="Live Leaderboard"
        subtitle={cfg.leaderboardSubtitle}
      />
      <View style={styles.liveRow}>
        <MaterialIcons name="info-outline" size={18} color={Wireframe.textMuted} />
        <Text style={styles.liveText}>Real-time updates.</Text>
      </View>
      <Panel>
        <ScrollView horizontal>
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={[styles.cell, styles.h, styles.cRank]}>Rank</Text>
              <Text style={[styles.cell, styles.h, styles.cTeam]}>Team</Text>
              <Text style={[styles.cell, styles.h, styles.cId]}>ID</Text>
              <Text style={[styles.cell, styles.h, styles.cScore]}>Score</Text>
            </View>
            {LEADERBOARD_SAMPLE.map((r) => (
              <View key={r.rank} style={styles.row}>
                <Text style={[styles.cell, styles.cRank, styles.center]}>{r.rank}</Text>
                <Text style={[styles.cell, styles.cTeam]} numberOfLines={1}>
                  {r.team}
                </Text>
                <Text style={[styles.cell, styles.cId, styles.center]}>{r.id}</Text>
                <Text style={[styles.cell, styles.cScore, styles.center]}>{r.score}</Text>
              </View>
            ))}
            <View style={styles.row}>
              <Text style={[styles.cell, styles.cRank, styles.center]}>…</Text>
              <Text style={[styles.cell, styles.cTeam]}>…</Text>
              <Text style={[styles.cell, styles.cId, styles.center]}>…</Text>
              <Text style={[styles.cell, styles.cScore, styles.center]}>…</Text>
            </View>
          </View>
        </ScrollView>
      </Panel>
      <View style={styles.doneBox}>
        <MaterialIcons name="info-outline" size={18} color={Wireframe.textMuted} />
        <View style={{ flex: 1 }}>
          <Text style={styles.doneTitle}>Activity Complete!</Text>
          <Text style={styles.doneBody}>
            {`Great work! Your data has been saved and you're now on the leaderboard.`}
          </Text>
        </View>
      </View>
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  // Column widths keep header + rows perfectly aligned.
  cRank: { width: 56 },
  cTeam: { width: 180 },
  cId: { width: 86 },
  cScore: { width: 74 },
  center: { textAlign: 'center' },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  liveText: { color: '#cfcfcf', fontSize: 13 },
  table: {
    width: 56 + 180 + 86 + 74,
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
  doneBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Wireframe.panelBg,
    borderWidth: 1,
    borderColor: Wireframe.border,
    padding: 12,
    borderRadius: 4,
    marginTop: 8,
  },
  doneTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Wireframe.text,
  },
  doneBody: {
    fontSize: 12,
    color: Wireframe.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
});
