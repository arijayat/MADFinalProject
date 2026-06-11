import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/wireframe/BackNav';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { Panel } from '@/components/wireframe/Panel';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { isIndividualActivity, type ActivityId } from '@/constants/activities';
import { useLocalizedActivity } from '@/constants/localized-activities';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';
import {
  fetchActivityLeaderboardBundle,
  type IndividualLeaderboardRow,
  type LeaderboardRow,
} from '@/lib/firestore/results';
import { listTeamsForLeaderboard } from '@/lib/firestore/teams';
import { isActivityId } from '@/lib/activity-snapshot';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useLocalization } from '@/contexts/LocalizationContext';

type LeaderboardMode = 'team' | 'individual';

export default function ActivityLeaderboardScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useLocalization();
  const { user } = useAuth();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const { teamDocId } = useTeam();
  const cfg = useLocalizedActivity(activityId ?? "");
  const supportsIndividualRanking =
    cfg != null && isIndividualActivity(cfg.id);

  const [mode, setMode] = useState<LeaderboardMode>('team');
  const [teamRows, setTeamRows] = useState<LeaderboardRow[]>([]);
  const [individualRows, setIndividualRows] = useState<IndividualLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    if (!activityId || !isActivityId(activityId)) {
      setTeamRows([]);
      setIndividualRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const teamMeta = await listTeamsForLeaderboard();
      const next = await fetchActivityLeaderboardBundle(activityId as ActivityId, teamMeta);
      setTeamRows(next.team);
      setIndividualRows(next.individual);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('rankingsLoadFailed'),
      );
      setTeamRows([]);
      setIndividualRows([]);
    } finally {
      setLoading(false);
    }
  }, [activityId, t]);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  if (!cfg) {
    return (
      <WireScreen>
        <Text style={{ color: colors.text }}>Activity not found.</Text>
      </WireScreen>
    );
  }

  const rows = mode === 'team' ? teamRows : individualRows;
  const yourTeamRow = teamDocId ? teamRows.find((r) => r.teamDocId === teamDocId) : undefined;
  const yourIndividualRow = user?.uid
    ? individualRows.find((r) => r.memberUid === user.uid)
    : undefined;
  const yourRow = mode === 'team' ? yourTeamRow : yourIndividualRow;

  return (
    <WireScreen
      footer={<PrimaryButton label={t('tabHub')} onPress={() => router.replace('/(tabs)')} />}>
      <ScreenHeader
        backLabel="BACK"
        onBack={() => router.back()}
        title="Live Leaderboard"
        subtitle={cfg.leaderboardSubtitle}
      />
      <View style={styles.modeToggle}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'team' }}
          onPress={() => setMode('team')}
          style={[
            styles.modeButton,
            { borderColor: colors.border, backgroundColor: colors.panelBg },
            mode === 'team' && { backgroundColor: colors.accentSoft, borderColor: Wireframe.accent },
          ]}>
          <MaterialIcons
            name="groups"
            size={16}
            color={mode === 'team' ? Wireframe.accent : colors.textMuted}
          />
          <Text
            style={[
              styles.modeButtonText,
              { color: colors.textMuted },
              mode === 'team' && { color: colors.text },
            ]}>
            {t('teams')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'individual' }}
          onPress={() => setMode('individual')}
          style={[
            styles.modeButton,
            { borderColor: colors.border, backgroundColor: colors.panelBg },
            mode === 'individual' && {
              backgroundColor: colors.accentSoft,
              borderColor: Wireframe.accent,
            },
          ]}>
          <MaterialIcons
            name="person"
            size={16}
            color={mode === 'individual' ? Wireframe.accent : colors.textMuted}
          />
          <Text
            style={[
              styles.modeButtonText,
              { color: colors.textMuted },
              mode === 'individual' && { color: colors.text },
            ]}>
            {t('individuals')}
          </Text>
        </Pressable>
      </View>
      <View style={styles.liveRow}>
        <MaterialIcons name="info-outline" size={18} color={colors.headerSubtle} />
        <Text style={[styles.liveText, { color: colors.headerSubtle }]}>
          {loading
            ? t('loadingRankings')
            : mode === 'team'
              ? 'Rankings from saved team results.'
              : supportsIndividualRanking
                ? 'Individual rankings use the selected performer saved with each result.'
                : 'This activity uses team rankings only.'}
        </Text>
      </View>
      <Panel>
        {loading ? (
          <ActivityIndicator color={colors.text} style={styles.spinner} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : rows.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            {mode === 'team'
              ? 'No teams have scored on this activity yet.'
              : supportsIndividualRanking
                ? 'No students have scored on this activity yet.'
                : 'This activity does not have individual rankings.'}
          </Text>
        ) : mode === 'team' ? (
          <ScrollView horizontal>
            <View style={[styles.table, { borderColor: colors.border }]}>
              <View style={[styles.row, { borderBottomColor: colors.border }]}>
                <Text style={[styles.cell, styles.h, styles.cRank, { color: colors.text, borderRightColor: colors.border, backgroundColor: colors.surfaceAlt }]}>Rank</Text>
                <Text style={[styles.cell, styles.h, styles.cTeam, { color: colors.text, borderRightColor: colors.border, backgroundColor: colors.surfaceAlt }]}>Team</Text>
                <Text style={[styles.cell, styles.h, styles.cId, { color: colors.text, borderRightColor: colors.border, backgroundColor: colors.surfaceAlt }]}>ID</Text>
                <Text style={[styles.cell, styles.h, styles.cScore, { color: colors.text, borderRightColor: colors.border, backgroundColor: colors.surfaceAlt }]}>Score</Text>
              </View>
              {teamRows.map((r) => (
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
        ) : (
          <ScrollView horizontal>
            <View style={[styles.table, styles.individualTable, { borderColor: colors.border }]}>
              <View style={[styles.row, { borderBottomColor: colors.border }]}>
                <Text style={[styles.cell, styles.h, styles.cRank, { color: colors.text, borderRightColor: colors.border, backgroundColor: colors.surfaceAlt }]}>Rank</Text>
                <Text style={[styles.cell, styles.h, styles.cStudent, { color: colors.text, borderRightColor: colors.border, backgroundColor: colors.surfaceAlt }]}>Student</Text>
                <Text style={[styles.cell, styles.h, styles.cId, { color: colors.text, borderRightColor: colors.border, backgroundColor: colors.surfaceAlt }]}>ID</Text>
                <Text style={[styles.cell, styles.h, styles.cScore, { color: colors.text, borderRightColor: colors.border, backgroundColor: colors.surfaceAlt }]}>Score</Text>
              </View>
              {individualRows.map((r) => (
                <View
                  key={`${r.teamDocId}-${r.memberId}-${r.rank}`}
                  style={[
                    styles.row,
                    { borderBottomColor: colors.border },
                    r.memberUid === user?.uid && { backgroundColor: colors.accentSoft },
                  ]}>
                  <Text style={[styles.cell, styles.cRank, styles.center, { color: colors.text, borderRightColor: colors.border }]}>{r.rank}</Text>
                  <Text style={[styles.cell, styles.cStudent, { color: colors.text, borderRightColor: colors.border }]} numberOfLines={2}>
                    {r.displayName}
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
              ? mode === 'team'
                ? `Your team is ranked #${yourRow.rank} with a score of ${yourRow.score}.`
                : `You are ranked #${yourRow.rank} with a score of ${yourRow.score}.`
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
  cStudent: { width: 240 },
  cId: { width: 86 },
  cScore: { width: 74 },
  center: { textAlign: 'center' },
  modeToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  modeButton: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
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
  individualTable: {
    width: 56 + 240 + 86 + 74,
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
