import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOutDown,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { WireScreen } from '@/components/wireframe/WireScreen';
import { ACTIVITIES, HUB_ACTIVITY_ORDER, type ActivityId } from '@/constants/activities';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useTeam } from '@/contexts/TeamContext';
import { fetchAllActivityLeaderboards, type LeaderboardRow } from '@/lib/firestore/results';
import { listTeamsForLeaderboard } from '@/lib/firestore/teams';

type ActivityRanking = {
  activityId: ActivityId;
  title: string;
  rows: LeaderboardRow[];
};

type OverallRow = {
  rank: number;
  team: string;
  id: string;
  teamDocId: string;
  score: number;
  completed: number;
};

type RankingRow = LeaderboardRow | OverallRow;

type SelectedRanking = {
  title: string;
  rows: RankingRow[];
  overall?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function RankingsListScreen() {
  const { colors } = useAppTheme();
  const { teamName, teamId, teamDocId } = useTeam();
  const [selectedRanking, setSelectedRanking] = useState<SelectedRanking | null>(
    null,
  );
  const displayTeamName = teamName.trim() || 'Your team';
  const [activityRankings, setActivityRankings] = useState<ActivityRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRankings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const teamMeta = await listTeamsForLeaderboard();
      const leaderboards = await fetchAllActivityLeaderboards(
        HUB_ACTIVITY_ORDER,
        teamMeta,
      );
      setActivityRankings(
        HUB_ACTIVITY_ORDER.map((activityId) => ({
          activityId,
          title: ACTIVITIES[activityId].title,
          rows: leaderboards[activityId] ?? [],
        })),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load rankings. Check Firestore rules and your connection.',
      );
      setActivityRankings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRankings();
    }, [loadRankings]),
  );

  const overallRows = useMemo(
    () => computeOverallRows(activityRankings),
    [activityRankings],
  );
  const yourOverall = teamDocId
    ? overallRows.find((row) => row.teamDocId === teamDocId)
    : undefined;

  return (
    <WireScreen>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text style={styles.eyebrow}>Team leaderboard</Text>
            <Text style={styles.title}>Rankings</Text>
          </View>
          <View style={[styles.teamBadge, { backgroundColor: colors.translucent }]}>
            <Text style={styles.teamBadgeLabel}>Team</Text>
            <Text style={styles.teamBadgeName} numberOfLines={1}>
              {displayTeamName}
            </Text>
            <Text style={styles.teamBadgeId}>{teamId}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="emoji-events" size={18} color={Wireframe.panelBg} />
          <Text style={styles.infoText}>
            {loading
              ? 'Loading rankings from cloud…'
              : error
                ? error
                : 'Rankings from saved team results. Overall ranking combines scores across every activity.'}
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={Wireframe.panelBg} style={styles.spinner} />
      ) : null}

      <RankingSection
        title="Overall ranking"
        subtitle={
          yourOverall
            ? `Your team is #${yourOverall.rank} with ${yourOverall.score} points.`
            : 'Teams are ranked by total activity score.'
        }
        rows={overallRows}
        teamDocId={teamDocId}
        emptyText="No ranking data yet."
        onSeeMore={() =>
          setSelectedRanking({
            title: 'Overall ranking',
            rows: overallRows,
            overall: true,
          })
        }
        overall
      />

      <View style={styles.sectionIntro}>
        <Text style={styles.sectionIntroTitle}>Activity rankings</Text>
        <Text style={styles.sectionIntroText}>Top teams for each activity.</Text>
      </View>

      <View style={styles.activityButtons}>
        {activityRankings.map((section) => (
          <ActivityRankingButton
            key={section.activityId}
            title={section.title}
            rows={section.rows}
            teamDocId={teamDocId}
            onPress={() =>
              setSelectedRanking({
                title: section.title,
                rows: section.rows,
              })
            }
          />
        ))}
      </View>

      <FullRankingModal
        ranking={selectedRanking}
        teamDocId={teamDocId}
        onClose={() => setSelectedRanking(null)}
      />
    </WireScreen>
  );
}

function computeOverallRows(activityRankings: ActivityRanking[]): OverallRow[] {
  const teams = new Map<string, Omit<OverallRow, 'rank'>>();

  for (const ranking of activityRankings) {
    for (const row of ranking.rows) {
      const existing = teams.get(row.teamDocId);
      if (existing) {
        existing.score += row.score;
        existing.completed += 1;
      } else {
        teams.set(row.teamDocId, {
          team: row.team,
          id: row.id,
          teamDocId: row.teamDocId,
          score: row.score,
          completed: 1,
        });
      }
    }
  }

  return [...teams.values()]
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.completed - a.completed ||
        a.team.localeCompare(b.team),
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function RankingSection({
  title,
  subtitle,
  rows,
  teamDocId,
  emptyText,
  onSeeMore,
  overall = false,
}: {
  title: string;
  subtitle?: string;
  rows: RankingRow[];
  teamDocId: string | null;
  emptyText: string;
  onSeeMore?: () => void;
  overall?: boolean;
}) {
  const { colors } = useAppTheme();
  const shownRows = rows.slice(0, 3);

  return (
    <Animated.View
      entering={FadeInUp.duration(220).springify().damping(18)}
      layout={LinearTransition.duration(180)}
      style={[
        styles.rankingCard,
        {
          backgroundColor: colors.panelBg,
          borderColor: colors.border,
          boxShadow: colors.shadow,
        },
        overall && { borderColor: colors.accentSoft },
      ]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: colors.accentSoft }]}>
          <MaterialIcons
            name={overall ? 'workspace-premium' : 'leaderboard'}
            size={20}
            color={Wireframe.accent}
          />
        </View>
        <View style={styles.cardTitleWrap}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {overall && shownRows.length > 0 ? (
        <Podium rows={shownRows} teamDocId={teamDocId} />
      ) : shownRows.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>{emptyText}</Text>
      ) : (
        <View style={styles.rows}>
          {shownRows.map((row) => (
            <RankingRowView key={`${title}-${row.teamDocId}`} row={row} teamDocId={teamDocId} />
          ))}
        </View>
      )}

      {onSeeMore ? (
        <Pressable
          accessibilityRole="button"
          onPress={onSeeMore}
          style={({ pressed }) => [
            styles.seeMoreButton,
            { backgroundColor: colors.surfaceAlt },
            pressed && styles.pressed,
          ]}>
          <Text style={styles.seeMoreText}>See more</Text>
          <MaterialIcons name="chevron-right" size={18} color={Wireframe.accent} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

function Podium({
  rows,
  teamDocId,
}: {
  rows: RankingRow[];
  teamDocId: string | null;
}) {
  const first = rows[0];
  const second = rows[1];
  const third = rows[2];

  return (
    <View style={styles.podiumWrap}>
      {second ? <PodiumPlace row={second} teamDocId={teamDocId} height={92} /> : null}
      {first ? <PodiumPlace row={first} teamDocId={teamDocId} height={118} first /> : null}
      {third ? <PodiumPlace row={third} teamDocId={teamDocId} height={78} /> : null}
    </View>
  );
}

function PodiumPlace({
  row,
  teamDocId,
  height,
  first,
}: {
  row: RankingRow;
  teamDocId: string | null;
  height: number;
  first?: boolean;
}) {
  const { colors } = useAppTheme();
  const isYourTeam = row.teamDocId === teamDocId;
  return (
    <Animated.View
      entering={FadeInUp.delay(row.rank * 35).duration(180).springify().damping(16)}
      layout={LinearTransition.duration(180)}
      style={[
        styles.podiumPlace,
        { minHeight: height, backgroundColor: colors.surfaceAlt },
        first && { backgroundColor: colors.accentSoft },
        isYourTeam && { borderWidth: 1, borderColor: Wireframe.accent },
      ]}>
      <Text style={styles.podiumRank}>#{row.rank}</Text>
      <Text style={[styles.podiumTeam, { color: colors.text }]} numberOfLines={2}>
        {row.team}
      </Text>
      <Text style={[styles.podiumScore, { color: colors.textMuted }]}>{row.score}</Text>
    </Animated.View>
  );
}

function ActivityRankingButton({
  title,
  rows,
  teamDocId,
  onPress,
}: {
  title: string;
  rows: LeaderboardRow[];
  teamDocId: string | null;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const yourRow = teamDocId
    ? rows.find((row) => row.teamDocId === teamDocId)
    : undefined;
  const leader = rows[0];

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => {
        // eslint-disable-next-line react-hooks/immutability
        scale.value = withTiming(0.985, { duration: 90 });
      }}
      onPressOut={() => {
        // eslint-disable-next-line react-hooks/immutability
        scale.value = withTiming(1, { duration: 120 });
      }}
      entering={FadeInUp.duration(200).springify().damping(18)}
      layout={LinearTransition.duration(180)}
      style={[
        styles.activityButton,
        {
          backgroundColor: colors.panelBg,
          borderColor: colors.border,
          boxShadow: colors.shadow,
        },
        animatedStyle,
      ]}>
      <View style={[styles.cardIcon, { backgroundColor: colors.accentSoft }]}>
        <MaterialIcons name="leaderboard" size={20} color={Wireframe.accent} />
      </View>
      <View style={styles.activityButtonText}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
          {yourRow
            ? `Your standing: #${yourRow.rank} · ${yourRow.score} pts`
            : leader
              ? `Leader: ${leader.team} · ${leader.score} pts`
              : 'No ranking data yet'}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
    </AnimatedPressable>
  );
}

function FullRankingModal({
  ranking,
  teamDocId,
  onClose,
}: {
  ranking: SelectedRanking | null;
  teamDocId: string | null;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const currentStanding =
    ranking && teamDocId
      ? ranking.rows.find((row) => row.teamDocId === teamDocId)
      : undefined;

  return (
    <Modal visible={ranking != null} transparent animationType="fade" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(160)} style={styles.modalBackdrop}>
        <Animated.View
          key={ranking?.title ?? 'ranking'}
          entering={FadeInUp.duration(220).springify().damping(18)}
          exiting={FadeOutDown.duration(160)}
          layout={LinearTransition.duration(180)}
          style={[styles.modalCard, { backgroundColor: colors.panelBg }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalEyebrow, { color: colors.textMuted }]}>
                {ranking?.overall ? 'Overall standing' : 'Activity standing'}
              </Text>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{ranking?.title}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close rankings"
              onPress={onClose}
              hitSlop={8}
              style={[styles.closeButton, { backgroundColor: colors.surfaceAlt }]}>
              <MaterialIcons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          {currentStanding ? (
            <View style={[styles.currentStanding, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.currentLabel, { color: colors.textMuted }]}>
                Your team standing
              </Text>
              <Text style={[styles.currentValue, { color: colors.text }]}>
                #{currentStanding.rank} · {currentStanding.score} pts
              </Text>
            </View>
          ) : null}

          <ScrollView contentContainerStyle={styles.modalRows}>
            {(ranking?.rows ?? []).map((row) => (
              <RankingRowView
                key={`modal-${ranking?.title}-${row.teamDocId}`}
                row={row}
                teamDocId={teamDocId}
              />
            ))}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function RankingRowView({
  row,
  teamDocId,
}: {
  row: RankingRow;
  teamDocId: string | null;
}) {
  const { colors } = useAppTheme();
  const isYourTeam = row.teamDocId === teamDocId;
  const completed = 'completed' in row ? ` · ${row.completed} activities` : '';
  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(row.rank, 8) * 25).duration(170)}
      layout={LinearTransition.duration(180)}
      style={[
        styles.rankRow,
        { backgroundColor: colors.surfaceAlt },
        isYourTeam && { backgroundColor: colors.accentSoft },
      ]}>
      <Text style={styles.rankNumber}>#{row.rank}</Text>
      <View style={styles.rankTeam}>
        <Text style={[styles.rankTeamName, { color: colors.text }]} numberOfLines={1}>
          {row.team}
        </Text>
        <Text style={[styles.rankMeta, { color: colors.textMuted }]}>
          {row.id}
          {completed}
        </Text>
      </View>
      <Text style={[styles.score, { color: colors.text }]}>{row.score}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 14,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleCopy: {
    flex: 1,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: Wireframe.panelBg,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 2,
  },
  teamBadge: {
    width: 128,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 8,
    padding: 10,
  },
  teamBadgeLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '800',
  },
  teamBadgeName: {
    color: Wireframe.panelBg,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  teamBadgeId: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    flex: 1,
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  spinner: {
    paddingVertical: 12,
  },
  sectionIntro: {
    marginTop: 6,
  },
  sectionIntroTitle: {
    color: Wireframe.panelBg,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionIntroText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    marginTop: 3,
  },
  rankingCard: {
    backgroundColor: Wireframe.panelBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Wireframe.border,
    padding: 14,
    gap: 12,
    boxShadow: Wireframe.shadow,
  },
  overallCard: {
    borderColor: Wireframe.accentSoft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Wireframe.accentSoft,
  },
  cardTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    color: Wireframe.text,
    fontSize: 16,
    fontWeight: '900',
  },
  cardSubtitle: {
    color: Wireframe.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  emptyText: {
    color: Wireframe.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  rows: {
    gap: 8,
  },
  podiumWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  podiumPlace: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: Wireframe.surfaceAlt,
    borderRadius: 8,
    padding: 10,
  },
  podiumFirst: {
    backgroundColor: Wireframe.accentSoft,
  },
  podiumYourTeam: {
    borderWidth: 1,
    borderColor: Wireframe.accent,
  },
  podiumRank: {
    color: Wireframe.accent,
    fontSize: 13,
    fontWeight: '900',
  },
  podiumTeam: {
    color: Wireframe.text,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 6,
  },
  podiumScore: {
    color: Wireframe.textMuted,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 4,
  },
  seeMoreButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 8,
    backgroundColor: Wireframe.surfaceAlt,
  },
  seeMoreText: {
    color: Wireframe.accent,
    fontSize: 13,
    fontWeight: '900',
  },
  activityButtons: {
    gap: 10,
  },
  activityButton: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Wireframe.panelBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Wireframe.border,
    padding: 14,
    boxShadow: Wireframe.shadow,
  },
  activityButtonText: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Wireframe.surfaceAlt,
    borderRadius: 8,
    padding: 10,
  },
  yourRow: {
    backgroundColor: Wireframe.accentSoft,
  },
  rankNumber: {
    width: 38,
    color: Wireframe.accent,
    fontSize: 14,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  rankTeam: {
    flex: 1,
    minWidth: 0,
  },
  rankTeamName: {
    color: Wireframe.text,
    fontSize: 14,
    fontWeight: '900',
  },
  rankMeta: {
    color: Wireframe.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  score: {
    color: Wireframe.text,
    fontSize: 16,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.44)',
  },
  modalCard: {
    maxHeight: '82%',
    backgroundColor: Wireframe.panelBg,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    padding: 16,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalEyebrow: {
    color: Wireframe.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  modalTitle: {
    color: Wireframe.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Wireframe.surfaceAlt,
  },
  currentStanding: {
    backgroundColor: Wireframe.accentSoft,
    borderRadius: 8,
    padding: 12,
  },
  currentLabel: {
    color: Wireframe.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  currentValue: {
    color: Wireframe.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  modalRows: {
    gap: 8,
    paddingBottom: 20,
  },
});
