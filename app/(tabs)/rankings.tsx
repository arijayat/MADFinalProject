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
import { HUB_ACTIVITY_ORDER, type ActivityId } from '@/constants/activities';
import { useLocalizedActivities } from '@/constants/localized-activities';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalization } from '@/contexts/LocalizationContext';
import { useTeam } from '@/contexts/TeamContext';
import {
  fetchAllLeaderboardBundles,
  type IndividualLeaderboardRow,
  type LeaderboardRow,
} from '@/lib/firestore/results';
import { listTeamsForLeaderboard } from '@/lib/firestore/teams';

type RankingMode = 'team' | 'individual';

type ActivityRanking = {
  activityId: ActivityId;
  title: string;
  rows: LeaderboardRow[];
};

type IndividualActivityRanking = {
  activityId: ActivityId;
  title: string;
  rows: IndividualLeaderboardRow[];
};

type OverallRow = {
  rank: number;
  team: string;
  id: string;
  teamDocId: string;
  score: number;
  completed: number;
};

type IndividualOverallRow = {
  rank: number;
  studentName: string;
  teamName: string;
  displayName: string;
  id: string;
  teamDocId: string;
  memberId: string;
  memberUid?: string;
  score: number;
  completed: number;
};

type RankingRow = LeaderboardRow | OverallRow | IndividualLeaderboardRow | IndividualOverallRow;

type SelectedRanking = {
  title: string;
  rows: RankingRow[];
  overall?: boolean;
  mode: RankingMode;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function RankingsListScreen() {
  const { colors } = useAppTheme();
  const { t } = useLocalization();
  const { activities } = useLocalizedActivities();
  const { user } = useAuth();
  const { teamName, teamId, teamDocId, members } = useTeam();
  const [rankingMode, setRankingMode] = useState<RankingMode>('team');
  const [selectedRanking, setSelectedRanking] = useState<SelectedRanking | null>(
    null,
  );
  const displayTeamName = teamName.trim() || t('yourTeam');
  const linkedMember = user?.uid
    ? members.find((member) => member.uid === user.uid)
    : undefined;
  const displayStudentName = linkedMember?.name.trim() || t('you');
  const [activityRankings, setActivityRankings] = useState<ActivityRanking[]>([]);
  const [individualActivityRankings, setIndividualActivityRankings] = useState<
    IndividualActivityRanking[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRankings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const teamMeta = await listTeamsForLeaderboard();
      const { team, individual } = await fetchAllLeaderboardBundles(
        HUB_ACTIVITY_ORDER,
        teamMeta,
      );
      setActivityRankings(
        HUB_ACTIVITY_ORDER.map((activityId) => ({
          activityId,
          title: activities[activityId].title,
          rows: team[activityId] ?? [],
        })),
      );
      setIndividualActivityRankings(
        HUB_ACTIVITY_ORDER.map((activityId) => ({
          activityId,
          title: activities[activityId].title,
          rows: individual[activityId] ?? [],
        })),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('rankingsLoadFailed'),
      );
      setActivityRankings([]);
      setIndividualActivityRankings([]);
    } finally {
      setLoading(false);
    }
  }, [activities, t]);

  useFocusEffect(
    useCallback(() => {
      void loadRankings();
    }, [loadRankings]),
  );

  const overallRows = useMemo(
    () => computeOverallRows(activityRankings),
    [activityRankings],
  );
  const individualOverallRows = useMemo(
    () => computeIndividualOverallRows(individualActivityRankings),
    [individualActivityRankings],
  );
  const activeOverallRows =
    rankingMode === 'team' ? overallRows : individualOverallRows;
  const activeActivityRankings =
    rankingMode === 'team' ? activityRankings : individualActivityRankings;
  const yourOverall =
    rankingMode === 'team'
      ? teamDocId
        ? overallRows.find((row) => row.teamDocId === teamDocId)
        : undefined
      : user?.uid
        ? individualOverallRows.find((row) => row.memberUid === user.uid)
        : undefined;

  return (
    <WireScreen>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text style={styles.eyebrow}>
              {rankingMode === 'team' ? t('teamLeaderboard') : t('individualLeaderboard')}
            </Text>
            <Text style={styles.title}>{t('rankings')}</Text>
          </View>
          <View style={[styles.teamBadge, { backgroundColor: colors.translucent }]}>
            <Text style={styles.teamBadgeLabel}>
              {rankingMode === 'team' ? t('team') : t('studentLabel')}
            </Text>
            <Text style={styles.teamBadgeName} numberOfLines={1}>
              {rankingMode === 'team' ? displayTeamName : displayStudentName}
            </Text>
            {rankingMode === 'team' ? (
              <Text style={styles.teamBadgeId}>{teamId}</Text>
            ) : (
              <Text style={styles.teamBadgeId} numberOfLines={1}>
                {displayTeamName}
              </Text>
            )}
          </View>
        </View>
        <RankingModeToggle mode={rankingMode} onChange={setRankingMode} />
        <View style={styles.infoRow}>
          <MaterialIcons name="emoji-events" size={18} color={Wireframe.panelBg} />
          <Text style={styles.infoText}>
            {loading
              ? t('loadingRankings')
              : error
                ? error
                : rankingMode === 'team'
                  ? t('teamRankingsInfo')
                  : t('individualRankingsInfo')}
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={Wireframe.panelBg} style={styles.spinner} />
      ) : null}

      <RankingSection
        title={t('overallRanking')}
        subtitle={
          yourOverall
            ? rankingMode === 'team'
              ? t('teamStanding', { rank: yourOverall.rank, score: yourOverall.score })
              : t('individualStanding', { rank: yourOverall.rank, score: yourOverall.score })
            : rankingMode === 'team'
              ? t('teamsRanked')
              : t('studentsRanked')
        }
        rows={activeOverallRows}
        mode={rankingMode}
        teamDocId={teamDocId}
        userUid={user?.uid}
        emptyText={t('noRankingData')}
        onSeeMore={() =>
          setSelectedRanking({
            title: t('overallRanking'),
            rows: activeOverallRows,
            overall: true,
            mode: rankingMode,
          })
        }
        overall
      />

      <View style={styles.sectionIntro}>
        <Text style={styles.sectionIntroTitle}>{t('activityRankings')}</Text>
        <Text style={styles.sectionIntroText}>
          {rankingMode === 'team'
            ? t('topTeams')
            : t('topStudents')}
        </Text>
      </View>

      <View style={styles.activityButtons}>
        {activeActivityRankings.map((section) => (
          <ActivityRankingButton
            key={section.activityId}
            title={section.title}
            rows={section.rows}
            mode={rankingMode}
            teamDocId={teamDocId}
            userUid={user?.uid}
            onPress={() =>
              setSelectedRanking({
                title: section.title,
                rows: section.rows,
                mode: rankingMode,
              })
            }
          />
        ))}
      </View>

      <FullRankingModal
        ranking={selectedRanking}
        teamDocId={teamDocId}
        userUid={user?.uid}
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

function computeIndividualOverallRows(
  activityRankings: IndividualActivityRanking[],
): IndividualOverallRow[] {
  const students = new Map<string, Omit<IndividualOverallRow, 'rank'>>();

  for (const ranking of activityRankings) {
    for (const row of ranking.rows) {
      const key = `${row.teamDocId}-${row.memberId}`;
      const existing = students.get(key);
      if (existing) {
        existing.score += row.score;
        existing.completed += 1;
      } else {
        students.set(key, {
          studentName: row.studentName,
          teamName: row.teamName,
          displayName: row.displayName,
          id: row.id,
          teamDocId: row.teamDocId,
          memberId: row.memberId,
          memberUid: row.memberUid,
          score: row.score,
          completed: 1,
        });
      }
    }
  }

  return [...students.values()]
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.completed - a.completed ||
        a.displayName.localeCompare(b.displayName),
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function getRankingRowKey(row: RankingRow, mode: RankingMode): string {
  if (mode === 'individual' && 'memberId' in row) {
    return `${row.teamDocId}-${row.memberId}`;
  }
  return row.teamDocId;
}

function getRankingRowLabel(row: RankingRow, mode: RankingMode): string {
  if (mode === 'individual' && 'displayName' in row) {
    return row.displayName;
  }
  if ('team' in row) {
    return row.team;
  }
  return 'Unknown';
}

function isYourRankingRow(
  row: RankingRow,
  mode: RankingMode,
  teamDocId: string | null,
  userUid: string | null | undefined,
): boolean {
  if (mode === 'individual' && 'memberUid' in row) {
    return !!userUid && row.memberUid === userUid;
  }
  return !!teamDocId && row.teamDocId === teamDocId;
}

function RankingModeToggle({
  mode,
  onChange,
}: {
  mode: RankingMode;
  onChange: (mode: RankingMode) => void;
}) {
  const { colors } = useAppTheme();
  const { t } = useLocalization();

  return (
    <View style={[styles.modeToggle, { backgroundColor: colors.translucent }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: mode === 'team' }}
        onPress={() => onChange('team')}
        style={[
          styles.modeButton,
          mode === 'team' && [styles.modeButtonActive, { backgroundColor: colors.panelBg }],
        ]}>
        <MaterialIcons
          name="groups"
          size={16}
          color={mode === 'team' ? Wireframe.accent : 'rgba(255,255,255,0.78)'}
        />
        <Text
          style={[
            styles.modeButtonText,
            mode === 'team' && styles.modeButtonTextActive,
          ]}>
          {t('teams')}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: mode === 'individual' }}
        onPress={() => onChange('individual')}
        style={[
          styles.modeButton,
          mode === 'individual' && [
            styles.modeButtonActive,
            { backgroundColor: colors.panelBg },
          ],
        ]}>
        <MaterialIcons
          name="person"
          size={16}
          color={mode === 'individual' ? Wireframe.accent : 'rgba(255,255,255,0.78)'}
        />
        <Text
          style={[
            styles.modeButtonText,
            mode === 'individual' && styles.modeButtonTextActive,
          ]}>
          {t('individuals')}
        </Text>
      </Pressable>
    </View>
  );
}

function RankingSection({
  title,
  subtitle,
  rows,
  mode,
  teamDocId,
  userUid,
  emptyText,
  onSeeMore,
  overall = false,
}: {
  title: string;
  subtitle?: string;
  rows: RankingRow[];
  mode: RankingMode;
  teamDocId: string | null;
  userUid: string | null | undefined;
  emptyText: string;
  onSeeMore?: () => void;
  overall?: boolean;
}) {
  const { colors } = useAppTheme();
  const { t } = useLocalization();
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
        <Podium rows={shownRows} mode={mode} teamDocId={teamDocId} userUid={userUid} />
      ) : shownRows.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>{emptyText}</Text>
      ) : (
        <View style={styles.rows}>
          {shownRows.map((row) => (
            <RankingRowView
              key={`${title}-${getRankingRowKey(row, mode)}`}
              row={row}
              mode={mode}
              teamDocId={teamDocId}
              userUid={userUid}
            />
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
          <Text style={styles.seeMoreText}>{t('seeMore')}</Text>
          <MaterialIcons name="chevron-right" size={18} color={Wireframe.accent} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

function Podium({
  rows,
  mode,
  teamDocId,
  userUid,
}: {
  rows: RankingRow[];
  mode: RankingMode;
  teamDocId: string | null;
  userUid: string | null | undefined;
}) {
  const first = rows[0];
  const second = rows[1];
  const third = rows[2];

  return (
    <View style={styles.podiumWrap}>
      {second ? (
        <PodiumPlace row={second} mode={mode} teamDocId={teamDocId} userUid={userUid} height={92} />
      ) : null}
      {first ? (
        <PodiumPlace
          row={first}
          mode={mode}
          teamDocId={teamDocId}
          userUid={userUid}
          height={118}
          first
        />
      ) : null}
      {third ? (
        <PodiumPlace row={third} mode={mode} teamDocId={teamDocId} userUid={userUid} height={78} />
      ) : null}
    </View>
  );
}

function PodiumPlace({
  row,
  mode,
  teamDocId,
  userUid,
  height,
  first,
}: {
  row: RankingRow;
  mode: RankingMode;
  teamDocId: string | null;
  userUid: string | null | undefined;
  height: number;
  first?: boolean;
}) {
  const { colors } = useAppTheme();
  const isYou = isYourRankingRow(row, mode, teamDocId, userUid);
  return (
    <Animated.View
      entering={FadeInUp.delay(row.rank * 35).duration(180).springify().damping(16)}
      layout={LinearTransition.duration(180)}
      style={[
        styles.podiumPlace,
        { minHeight: height, backgroundColor: colors.surfaceAlt },
        first && { backgroundColor: colors.accentSoft },
        isYou && { borderWidth: 1, borderColor: Wireframe.accent },
      ]}>
      <Text style={styles.podiumRank}>#{row.rank}</Text>
      <Text style={[styles.podiumTeam, { color: colors.text }]} numberOfLines={2}>
        {getRankingRowLabel(row, mode)}
      </Text>
      <Text style={[styles.podiumScore, { color: colors.textMuted }]}>{row.score}</Text>
    </Animated.View>
  );
}

function ActivityRankingButton({
  title,
  rows,
  mode,
  teamDocId,
  userUid,
  onPress,
}: {
  title: string;
  rows: LeaderboardRow[] | IndividualLeaderboardRow[];
  mode: RankingMode;
  teamDocId: string | null;
  userUid: string | null | undefined;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const { t } = useLocalization();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const yourRow =
    mode === 'team'
      ? teamDocId
        ? (rows as LeaderboardRow[]).find((row) => row.teamDocId === teamDocId)
        : undefined
      : userUid
        ? (rows as IndividualLeaderboardRow[]).find((row) => row.memberUid === userUid)
        : undefined;
  const leader = rows[0];

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.985, { duration: 90 });
      }}
      onPressOut={() => {
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
            ? t('yourStanding', { rank: yourRow.rank, score: yourRow.score })
            : leader
              ? mode === 'team'
                ? t('leader', { name: (leader as LeaderboardRow).team, score: leader.score })
                : t('leader', {
                    name: (leader as IndividualLeaderboardRow).displayName,
                    score: leader.score,
                  })
              : t('noRankingData')}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
    </AnimatedPressable>
  );
}

function FullRankingModal({
  ranking,
  teamDocId,
  userUid,
  onClose,
}: {
  ranking: SelectedRanking | null;
  teamDocId: string | null;
  userUid: string | null | undefined;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const { t } = useLocalization();
  const mode = ranking?.mode ?? 'team';
  const currentStanding =
    ranking && (mode === 'team' ? teamDocId : userUid)
      ? ranking.rows.find((row) => isYourRankingRow(row, mode, teamDocId, userUid))
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
                {ranking?.overall ? t('overallStanding') : t('activityStanding')}
              </Text>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{ranking?.title}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('closeRankings')}
              onPress={onClose}
              hitSlop={8}
              style={[styles.closeButton, { backgroundColor: colors.surfaceAlt }]}>
              <MaterialIcons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          {currentStanding ? (
            <View style={[styles.currentStanding, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.currentLabel, { color: colors.textMuted }]}>
                {mode === 'team' ? t('yourTeamStanding') : t('yourStandingLabel')}
              </Text>
              <Text style={[styles.currentValue, { color: colors.text }]}>
                #{currentStanding.rank} · {currentStanding.score} pts
              </Text>
            </View>
          ) : null}

          <ScrollView contentContainerStyle={styles.modalRows}>
            {(ranking?.rows ?? []).map((row) => (
              <RankingRowView
                key={`modal-${ranking?.title}-${getRankingRowKey(row, mode)}`}
                row={row}
                mode={mode}
                teamDocId={teamDocId}
                userUid={userUid}
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
  mode,
  teamDocId,
  userUid,
}: {
  row: RankingRow;
  mode: RankingMode;
  teamDocId: string | null;
  userUid: string | null | undefined;
}) {
  const { colors } = useAppTheme();
  const { t } = useLocalization();
  const isYou = isYourRankingRow(row, mode, teamDocId, userUid);
  const completed = 'completed' in row ? ` - ${t('completedActivities', { count: row.completed })}` : '';
  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(row.rank, 8) * 25).duration(170)}
      layout={LinearTransition.duration(180)}
      style={[
        styles.rankRow,
        { backgroundColor: colors.surfaceAlt },
        isYou && { backgroundColor: colors.accentSoft },
      ]}>
      <Text style={styles.rankNumber}>#{row.rank}</Text>
      <View style={styles.rankTeam}>
        <Text style={[styles.rankTeamName, { color: colors.text }]} numberOfLines={1}>
          {getRankingRowLabel(row, mode)}
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
  modeToggle: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 6,
    paddingHorizontal: 10,
  },
  modeButtonActive: {
    backgroundColor: Wireframe.panelBg,
  },
  modeButtonText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontWeight: '800',
  },
  modeButtonTextActive: {
    color: Wireframe.text,
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
