import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { EditableSection } from '@/components/wireframe/EditableSection';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalization } from '@/contexts/LocalizationContext';
import { useTeam, type TeamMember } from '@/contexts/TeamContext';
import { Wireframe } from '@/constants/wireframe-theme';

/** Hide legacy placeholder emails generated before accounts were linked. */
function memberDisplayEmail(member: TeamMember, authUid?: string, authEmail?: string | null): string | null {
  if (member.uid && authUid && member.uid === authUid && authEmail?.trim()) {
    return authEmail.trim();
  }

  const email = member.email?.trim();
  if (!email) return null;
  if (!member.uid && email.endsWith('@mail.edu')) return null;
  return email;
}

export default function TeamTabScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useLocalization();
  const { user } = useAuth();
  const {
    teamName,
    teamId,
    gradeLevel,
    members,
    isLoadingTeam,
    teamDocId,
    saveTeamDetails,
    saveTeamMembers,
    leaveTeam,
    isTeamOwner,
  } = useTeam();

  const [draftMembers, setDraftMembers] = useState<TeamMember[]>(members);
  const [draftTeamName, setDraftTeamName] = useState(teamName);
  const [draftGradeLevel, setDraftGradeLevel] = useState(gradeLevel);
  const [newMemberName, setNewMemberName] = useState('');
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    setDraftMembers(members);
  }, [members]);

  useEffect(() => {
    setDraftTeamName(teamName);
    setDraftGradeLevel(gradeLevel);
  }, [teamName, gradeLevel]);

  function resetMemberDrafts() {
    setDraftMembers(members);
    setNewMemberName('');
  }

  function resetTeamDrafts() {
    setDraftTeamName(teamName);
    setDraftGradeLevel(gradeLevel);
  }

  function updateMemberName(memberId: string, name: string) {
    setDraftMembers((prev) =>
      prev.map((member) => (member.id === memberId ? { ...member, name } : member)),
    );
  }

  function handleAddMember() {
    const trimmed = newMemberName.trim();
    if (!trimmed) {
      Alert.alert(t('missingName'), t('missingNameMessage'));
      return;
    }

    setDraftMembers((prev) => [...prev, { id: `m-${Date.now()}`, name: trimmed }]);
    setNewMemberName('');
  }

  async function handleSaveMembers() {
    try {
      await saveTeamMembers(draftMembers);
      setNewMemberName('');
      Alert.alert(t('saved'), t('membersSaved'));
    } catch (error) {
      Alert.alert(
        t('membersSaveFailed'),
        error instanceof Error ? error.message : t('tryAgain'),
      );
      throw error;
    }
  }

  if (isLoadingTeam) {
    return (
      <WireScreen>
        <TeamHeader title={t('team')} subtitle={t('loadingTeam')} />
        <ActivityIndicator color={Wireframe.panelBg} size="large" />
        <Text style={styles.loading}>{t('loadingTeam')}</Text>
      </WireScreen>
    );
  }

  async function handleSaveTeam() {
    try {
      await saveTeamDetails(draftTeamName, draftGradeLevel);
      Alert.alert(t('saved'), t('teamSaved'));
    } catch (error) {
      Alert.alert(
        t('teamSaveFailed'),
        error instanceof Error ? error.message : t('tryAgain'),
      );
      throw error;
    }
  }

  function handleLeaveTeam() {
    if (isTeamOwner) {
      router.push('/leave-team-captain');
      return;
    }

    Alert.alert(
      t('leaveTeamTitle'),
      t('leaveTeamMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('leaveTeamConfirm'),
          style: 'destructive',
          onPress: () => {
            void confirmLeaveTeam();
          },
        },
      ],
    );
  }

  async function confirmLeaveTeam() {
    setLeaving(true);
    try {
      await leaveTeam();
      router.replace('/team-onboarding');
    } catch (error) {
      Alert.alert(
        t('leaveTeamFailed'),
        error instanceof Error ? error.message : t('tryAgain'),
      );
    } finally {
      setLeaving(false);
    }
  }

  if (!teamDocId) {
    return (
      <WireScreen>
        <TeamHeader title={t('team')} subtitle={t('teamOnboardingHint')} />
      </WireScreen>
    );
  }

  return (
    <WireScreen>
      <TeamHeader
        title={t('team')}
        subtitle={isTeamOwner ? t('manageRoster') : t('viewRoster')}
      />

      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: colors.panelBg,
            borderColor: colors.border,
            boxShadow: colors.shadow,
          },
        ]}>
        <View style={[styles.summaryIcon, { backgroundColor: colors.accentSoft }]}>
          <MaterialIcons name="groups" size={24} color={Wireframe.accent} />
        </View>
        <View style={styles.summaryText}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{t('currentTeam')}</Text>
          <Text style={[styles.summaryName, { color: colors.text }]} numberOfLines={1}>
            {teamName}
          </Text>
          <View style={styles.summaryMeta}>
            <Text style={[styles.codePill, { backgroundColor: colors.accentSoft }]}>
              {teamId}
            </Text>
            {gradeLevel ? (
              <Text style={[styles.memberCount, { color: colors.textMuted }]}>
                {gradeLevel}
              </Text>
            ) : null}
            <Text style={[styles.memberCount, { color: colors.textMuted }]}>
              {t('members', { count: members.length })}
            </Text>
          </View>
        </View>
      </View>

      <EditableSection
        title={t('teamDetails')}
        editable={isTeamOwner}
        onSave={handleSaveTeam}
        onCancel={resetTeamDrafts}>
        {(editing) => (
          <>
            <Text style={[styles.label, { color: colors.textMuted }]}>{t('teamName')}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.border,
                },
              ]}
              value={isTeamOwner && editing ? draftTeamName : teamName}
              onChangeText={setDraftTeamName}
              editable={isTeamOwner && editing}
              placeholder={t('enterTeamName')}
              placeholderTextColor={Wireframe.placeholder}
            />
            <View style={styles.detailSpacer} />
            <Text style={[styles.label, { color: colors.textMuted }]}>{t('joinCode')}</Text>
            <Text
              style={[
                styles.readonlyValue,
                { color: colors.text, backgroundColor: colors.surfaceAlt },
              ]}>
              {teamId || '—'}
            </Text>
            <View style={styles.detailSpacer} />
            <Text style={[styles.label, { color: colors.textMuted }]}>{t('gradeLevel')}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.border,
                },
              ]}
              value={isTeamOwner && editing ? draftGradeLevel : gradeLevel}
              onChangeText={setDraftGradeLevel}
              editable={isTeamOwner && editing}
              placeholder={t('enterGradeLevel')}
              placeholderTextColor={Wireframe.placeholder}
            />
            {!isTeamOwner ? (
              <Text style={[styles.ownerHint, { color: colors.textMuted }]}>
                {t('ownerOnly')}
              </Text>
            ) : null}
          </>
        )}
      </EditableSection>

      <EditableSection
        title={t('teamMembers')}
        editable={isTeamOwner}
        onSave={handleSaveMembers}
        onCancel={resetMemberDrafts}>
        {(editing) => (
          <>
            {draftMembers.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textMuted }]}>
                {editing ? t('noMembersAdd') : t('noMembersListed')}
              </Text>
            ) : (
              draftMembers.map((m) => {
                const email = memberDisplayEmail(m, user?.uid, user?.email);
                return (
                  <View
                    key={m.id}
                    style={[styles.memberBlock, { borderBottomColor: colors.border }]}>
                    {editing ? (
                      <>
                        <Text style={[styles.label, { color: colors.textMuted }]}>
                          {t('memberName')}
                        </Text>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              color: colors.text,
                              backgroundColor: colors.surfaceAlt,
                              borderColor: colors.border,
                            },
                          ]}
                          value={m.name}
                          onChangeText={(value) => updateMemberName(m.id, value)}
                          placeholder={t('enterMemberName')}
                          placeholderTextColor={Wireframe.placeholder}
                        />
                      </>
                    ) : (
                      <View style={styles.memberRow}>
                        <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
                          <Text style={styles.avatarText}>
                            {(m.name.trim()[0] ?? '?').toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.memberText}>
                          <Text style={[styles.memberName, { color: colors.text }]}>
                            {m.name}
                          </Text>
                          {email ? (
                            <Text style={[styles.email, { color: colors.textMuted }]}>
                              {email}
                            </Text>
                          ) : null}
                          {m.uid ? (
                            <Text style={[styles.linked, { color: colors.textMuted }]}>
                              {t('linkedAccount')}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}

            {editing ? (
              <View style={styles.addBlock}>
                <Text style={[styles.label, { color: colors.textMuted }]}>{t('newMemberName')}</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      backgroundColor: colors.surfaceAlt,
                      borderColor: colors.border,
                    },
                  ]}
                  value={newMemberName}
                  onChangeText={setNewMemberName}
                  placeholder={t('enterTeamMemberName')}
                  placeholderTextColor={Wireframe.placeholder}
                />
                <PrimaryButton
                  label={t('addMember')}
                  onPress={handleAddMember}
                  variant="light"
                  style={styles.addButton}
                />
              </View>
            ) : null}
          </>
        )}
      </EditableSection>

      <PrimaryButton
        label={leaving ? t('leaving') : t('leaveTeam')}
        variant="light"
        disabled={leaving || isLoadingTeam}
        style={styles.leaveButton}
        onPress={handleLeaveTeam}
      />
    </WireScreen>
  );
}

function TeamHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const { t } = useLocalization();

  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>{t('teamWorkspace')}</Text>
      <Text style={styles.headerTitle}>{title}</Text>
      <Text style={styles.headerSubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 4,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: Wireframe.panelBg,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 2,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  loading: {
    marginTop: 12,
    color: 'rgba(255,255,255,0.76)',
    textAlign: 'center',
  },
  summaryCard: {
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
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Wireframe.accentSoft,
  },
  summaryText: {
    flex: 1,
    minWidth: 0,
  },
  summaryLabel: {
    color: Wireframe.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryName: {
    color: Wireframe.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  summaryMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  codePill: {
    color: Wireframe.accent,
    backgroundColor: Wireframe.accentSoft,
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '900',
  },
  memberCount: {
    color: Wireframe.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  memberBlock: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Wireframe.border,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Wireframe.accentSoft,
  },
  avatarText: {
    color: Wireframe.accent,
    fontSize: 15,
    fontWeight: '900',
  },
  memberText: {
    flex: 1,
    minWidth: 0,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: Wireframe.text,
  },
  label: {
    fontSize: 12,
    color: Wireframe.textMuted,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: Wireframe.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 14,
    color: Wireframe.text,
    backgroundColor: Wireframe.surfaceAlt,
  },
  readonlyValue: {
    color: Wireframe.text,
    fontSize: 15,
    fontWeight: '800',
    backgroundColor: Wireframe.surfaceAlt,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  detailSpacer: {
    height: 10,
  },
  ownerHint: {
    marginTop: 8,
    fontSize: 12,
    color: Wireframe.textMuted,
  },
  email: {
    fontSize: 13,
    color: Wireframe.textMuted,
    marginTop: 6,
  },
  linked: {
    fontSize: 12,
    color: Wireframe.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  empty: {
    fontSize: 14,
    color: Wireframe.textMuted,
  },
  addBlock: {
    marginTop: 4,
  },
  addButton: {
    marginTop: 8,
  },
  leaveButton: {
    marginTop: 4,
  },
});
