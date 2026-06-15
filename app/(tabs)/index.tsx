import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ActivityCard } from '@/components/wireframe/ActivityCard';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { HUB_ACTIVITY_ORDER } from '@/constants/activities';
import { useLocalizedActivities } from '@/constants/localized-activities';
import { Wireframe } from '@/constants/wireframe-theme';
import { useActivitySession } from '@/contexts/ActivitySessionContext';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useLocalization } from '@/contexts/LocalizationContext';
import { useTeam } from '@/contexts/TeamContext';
import { hasActivityDraftProgress, nextActivityRoute } from '@/lib/activity-progress/steps';

export default function HubScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useLocalization();
  const { activities } = useLocalizedActivities();
  const { teamName, teamId, gradeLevel } = useTeam();
  const { getSession, isActivityCompleted } = useActivitySession();
  const displayTeamName = teamName.trim() || t('yourTeam');
  const displayGrade = gradeLevel.trim() || t('gradeNotSet');

  return (
    <WireScreen footer={undefined}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.eyebrow}>{t('activityHub')}</Text>
            <Text style={styles.title}>{t('home')}</Text>
          </View>
        </View>

        <View
          style={[
            styles.teamCard,
            {
              backgroundColor: colors.panelBg,
              borderColor: colors.border,
              boxShadow: colors.shadow,
            },
          ]}>
          <View style={[styles.teamIcon, { backgroundColor: colors.accentSoft }]}>
            <MaterialIcons name="groups" size={24} color={Wireframe.accent} />
          </View>
          <View style={styles.teamInfo}>
            <Text style={[styles.teamLabel, { color: colors.textMuted }]}>{t('currentTeam')}</Text>
            <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>
              {displayTeamName}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[styles.metaPill, { backgroundColor: colors.accentSoft }]}>
                {teamId}
              </Text>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                {displayGrade}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoValue}>{HUB_ACTIVITY_ORDER.length}</Text>
            <Text style={styles.infoLabel}>{t('activities')}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItemWide}>
            <Text style={styles.infoLabel}>{t('hubInstruction')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('activities')}</Text>
        <Text style={styles.sectionSubtitle}>{t('selectExperiment')}</Text>
      </View>

      {HUB_ACTIVITY_ORDER.map((id) => {
        const a = activities[id];
        const completed = isActivityCompleted(id);
        const session = getSession(id);
        const hasProgress = !completed && hasActivityDraftProgress(a, session);
        return (
          <ActivityCard
            key={id}
            title={a.title}
            description={a.hubDescription}
            requirements={a.requirements}
            completed={completed}
            progressLabel={hasProgress ? 'Continue' : undefined}
            onPress={() =>
              router.push(hasProgress ? nextActivityRoute(a, session) : `/activity/${id}/intro`)
            }
          />
        );
      })}
    </WireScreen>
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
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Wireframe.panelBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Wireframe.border,
    padding: 14,
    boxShadow: Wireframe.shadow,
  },
  teamIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Wireframe.accentSoft,
  },
  teamInfo: {
    flex: 1,
    minWidth: 0,
  },
  teamLabel: {
    color: Wireframe.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  teamName: {
    color: Wireframe.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  metaPill: {
    color: Wireframe.accent,
    backgroundColor: Wireframe.accentSoft,
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '900',
  },
  metaText: {
    color: Wireframe.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    padding: 12,
  },
  infoItem: {
    width: 78,
  },
  infoItemWide: {
    flex: 1,
  },
  infoValue: {
    color: Wireframe.panelBg,
    fontSize: 24,
    fontWeight: '900',
  },
  infoLabel: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  infoDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sectionHeader: {
    marginTop: 6,
    marginBottom: 2,
  },
  sectionTitle: {
    color: Wireframe.panelBg,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    marginTop: 3,
  },
});
