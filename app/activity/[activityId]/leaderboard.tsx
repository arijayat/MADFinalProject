import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/wireframe/BackNav';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { Panel } from '@/components/wireframe/Panel';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { getActivity, type ActivityId } from '@/constants/activities';
import { useTeam } from '@/contexts/TeamContext';
import { fetchActivityLeaderboard, type LeaderboardRow } from '@/lib/firestore/results';
import { listTeamsForLeaderboard } from '@/lib/firestore/teams';
import { isActivityId } from '@/lib/activity-snapshot';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAppTheme } from '@/contexts/AppThemeContext';

export default function ActivityLeaderboardScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const { teamDocId } = useTeam();
  const cfg = activityId ? getActivity(activityId) : undefined;

  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    if (!activityId || !isActivityId(activityId)) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const teamMeta = await listTeamsForLeaderboard();
      const next = await fetchActivityLeaderboard(activityId as ActivityId, teamMeta);
      setRows(next);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load leaderboard. Check Firestore rules and your connection.',
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLeaderboard();
  }, [loadLeaderboard]);

  if (!cfg) {
    return (
      <WireScreen>
        <Text style={{ color: colors.text }}>Activity not found.</Text>
      </WireScreen>
    );
  }

  const yourRow = teamDocId ? rows.find((r) => r.teamDocId === teamDocId) : undefined;

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
        <MaterialIcons name="info-outline" size={18} color={colors.headerSubtle} />
        <Text style={[styles.liveText, { color: colors.headerSubtle }]}>
          {loading ? 'Loading rankings from cloud…' : 'Rankings from saved team results.'}
        </Text>
      </View>
      <Panel>
        {loading ? (
          <ActivityIndicator color={colors.text} style={styles.spinner} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : rows.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>No teams have scored on this activity yet.</Text>
        ) : (
          <ScrollView horizontal>
            <View style={[styles.table, { borderColor: colors.border }]}>
              <View style={[styles.row, { borderBottomColor: colors.border }]}>
                <Text style={[styles.cell, styles.h, styles.cRank, { color: colors.text, borderRightColor: colors.border, backgroundColor: colors.surfaceAlt }]}>Rank</Text>
                <Text style={[styles.cell, styles.h, styles.cTeam, { color: colors.text, borderRightColor: colors.border, backgroundColor: colors.surfaceAlt }]}>Team</Text>
                <Text style={[styles.cell, styles.h, styles.cId, { color: colors.text, borderRightColor: colors.border, backgroundColor: colors.surfaceAlt }]}>ID</Text>
                <Text style={[styles.cell, styles.h, styles.cScore, { color: colors.text, borderRightColor: colors.border, backgroundColor: colors.surfaceAlt }]}>Score</Text>
              </View>
              {rows.map((r) => (
                <View
                  key={`${r.teamDocId}-${r.rank}`}
                  style={[
                    styles.row,
                    { borderBottomColor: colors.border },
                    r.teamDocId === teamDocId && { backgroundColor: colors.accentSoft },
                  ]}>
                  <Text style={[styles.cell, styles.cRank, styles.center, { color: colors.text, borderRightColor: colors.border }]}>{r.rank}</Text>
                  <Text style={[styles.cell, styles.cTeam, { color: colors.text, borderRightColor: colors.border }]} numberOfLines={1}>
                    {r.team}
                  </Text>
                  <Text style={[styles.cell, styles.cId, styles.center, { color: colors.text, borderRightColor: colors.border }]}>{r.id}</Text>
                  <Text style={[styles.cell, styles.cScore, styles.center, { color: colors.text, borderRightColor: colors.border }]}>{r.score}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </Panel>
      <View
        style={[
          styles.doneBox,
          {
            backgroundColor: colors.panelBg,
            borderColor: colors.border,
            boxShadow: colors.shadow,
          },
        ]}>
        <MaterialIcons name="info-outline" size={18} color={colors.textMuted} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.doneTitle, { color: colors.text }]}>Activity Complete!</Text>
          <Text style={[styles.doneBody, { color: colors.textMuted }]}>
            {yourRow
              ? `Your team is ranked #${yourRow.rank} with a score of ${yourRow.score}.`
              : teamDocId
                ? 'Save your reflection to appear on this leaderboard.'
                : 'Register or join a team, then save your reflection to appear here.'}
          </Text>
        </View>
      </View>
    </WireScreen>
  );
}

const styles = StyleSheet.create({
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
  spinner: { paddingVertical: 24 },
  error: { color: '#ffb4b4', fontSize: 13, padding: 8 },
  empty: { color: Wireframe.textMuted, fontSize: 13, padding: 8 },
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
  youRow: {
    backgroundColor: '#f5f5e8',
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
