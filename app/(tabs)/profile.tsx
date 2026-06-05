import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { EditableField } from '@/components/wireframe/EditableField';
import { EditableSection } from '@/components/wireframe/EditableSection';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { TabScreenHeader } from '@/components/wireframe/TabScreenHeader';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';

export default function ProfileTabScreen() {
  const router = useRouter();
  const { user, profile, updateDisplayName } = useAuth();
  const {
    teamName,
    teamId,
    gradeLevel,
    members,
    isLoadingTeam,
    teamDocId,
    saveTeamDetails,
    leaveTeam,
    isTeamOwner,
  } = useTeam();

  const [leaving, setLeaving] = useState(false);

  const myMember = members.find((m) => m.uid === user?.uid);

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [draftTeamName, setDraftTeamName] = useState(teamName);
  const [draftGradeLevel, setDraftGradeLevel] = useState(gradeLevel);

  useEffect(() => {
    setDisplayName(profile?.displayName ?? '');
  }, [profile?.displayName]);

  useEffect(() => {
    setDraftTeamName(teamName);
    setDraftGradeLevel(gradeLevel);
  }, [teamName, gradeLevel]);

  function resetAccountDrafts() {
    setDisplayName(profile?.displayName ?? '');
  }

  function resetTeamDrafts() {
    setDraftTeamName(teamName);
    setDraftGradeLevel(gradeLevel);
  }

  async function handleSaveAccount() {
    try {
      await updateDisplayName(displayName);
      Alert.alert('Saved', 'Your account details were updated.');
    } catch (error) {
      Alert.alert(
        'Could not save account',
        error instanceof Error ? error.message : 'Try again.',
      );
      throw error;
    }
  }

  async function handleSaveTeam() {
    try {
      await saveTeamDetails(draftTeamName, draftGradeLevel);
      Alert.alert('Saved', 'Team details were updated.');
    } catch (error) {
      Alert.alert(
        'Could not save team',
        error instanceof Error ? error.message : 'Try again.',
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
      'Leave team?',
      'You will be removed from the roster. You can rejoin later with the team code.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave team',
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
        'Could not leave team',
        error instanceof Error ? error.message : 'Try again.',
      );
    } finally {
      setLeaving(false);
    }
  }

  return (
    <WireScreen>
      <TabScreenHeader title="Profile" subtitle="Your account and team details" />

      <EditableSection
        title="Account"
        onSave={handleSaveAccount}
        onCancel={resetAccountDrafts}>
        {(editing) => (
          <>
            <EditableField
              label="Email"
              value={user?.email ?? profile?.email ?? ''}
              editable={false}
            />
            <EditableField
              label="Display name"
              value={displayName}
              onChangeText={setDisplayName}
              editable={editing}
              placeholder="Enter your display name"
            />
            {myMember ? (
              <EditableField
                label="Team member name"
                value={myMember.name}
                editable={false}
              />
            ) : null}
          </>
        )}
      </EditableSection>

      {isLoadingTeam ? (
        <View style={styles.loadingPanel}>
          <ActivityIndicator color={Wireframe.textMuted} size="small" />
          <Text style={styles.loadingText}>Loading team…</Text>
        </View>
      ) : profile?.teamId && teamDocId ? (
        <EditableSection
          title="Team"
          editable={isTeamOwner}
          onSave={handleSaveTeam}
          onCancel={resetTeamDrafts}>
          {(editing) => (
            <>
              <EditableField
                label="Team name"
                value={isTeamOwner && editing ? draftTeamName : teamName}
                onChangeText={setDraftTeamName}
                editable={isTeamOwner && editing}
                placeholder="Enter team name"
              />
              <EditableField label="Join code" value={teamId || '—'} editable={false} />
              <EditableField
                label="Grade level"
                value={isTeamOwner && editing ? draftGradeLevel : gradeLevel}
                onChangeText={setDraftGradeLevel}
                editable={isTeamOwner && editing}
                placeholder="Enter grade level"
              />
              {!isTeamOwner ? (
                <Text style={styles.ownerHint}>Only the team captain can edit team details.</Text>
              ) : null}
            </>
          )}
        </EditableSection>
      ) : (
        <View style={styles.emptyPanel}>
          <Text style={styles.empty}>You have not joined a team yet.</Text>
        </View>
      )}

      {profile?.teamId && teamDocId ? (
        <PrimaryButton
          label={leaving ? 'LEAVING…' : 'LEAVE TEAM'}
          variant="light"
          disabled={leaving || isLoadingTeam}
          style={styles.leaveButton}
          onPress={handleLeaveTeam}
        />
      ) : null}
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  loadingPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Wireframe.panelBg,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Wireframe.border,
    padding: 12,
  },
  loadingText: {
    fontSize: 13,
    color: Wireframe.textMuted,
  },
  emptyPanel: {
    backgroundColor: Wireframe.panelBg,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Wireframe.border,
    padding: 12,
  },
  empty: {
    fontSize: 14,
    color: Wireframe.textMuted,
  },
  leaveButton: {
    marginTop: 8,
  },
  ownerHint: {
    marginTop: 8,
    fontSize: 12,
    color: Wireframe.textMuted,
  },
});
