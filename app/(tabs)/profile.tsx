import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { EditableField } from '@/components/wireframe/EditableField';
import { EditableSection } from '@/components/wireframe/EditableSection';
import { TabScreenHeader } from '@/components/wireframe/TabScreenHeader';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';

export default function ProfileTabScreen() {
  const { user, profile, updateDisplayName } = useAuth();
  const {
    teamName,
    teamId,
    gradeLevel,
    members,
    isLoadingTeam,
    teamDocId,
    saveTeamDetails,
    saveTeamMembers,
  } = useTeam();

  const myMember = members.find((m) => m.uid === user?.uid);

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [rosterName, setRosterName] = useState(myMember?.name ?? '');
  const [draftTeamName, setDraftTeamName] = useState(teamName);
  const [draftGradeLevel, setDraftGradeLevel] = useState(gradeLevel);

  useEffect(() => {
    setDisplayName(profile?.displayName ?? '');
  }, [profile?.displayName]);

  useEffect(() => {
    setRosterName(myMember?.name ?? '');
  }, [myMember?.name]);

  useEffect(() => {
    setDraftTeamName(teamName);
    setDraftGradeLevel(gradeLevel);
  }, [teamName, gradeLevel]);

  function resetAccountDrafts() {
    setDisplayName(profile?.displayName ?? '');
    setRosterName(myMember?.name ?? '');
  }

  function resetTeamDrafts() {
    setDraftTeamName(teamName);
    setDraftGradeLevel(gradeLevel);
  }

  async function handleSaveAccount() {
    try {
      await updateDisplayName(displayName);

      if (myMember && rosterName.trim() !== myMember.name) {
        const nextMembers = members.map((member) =>
          member.id === myMember.id ? { ...member, name: rosterName.trim() } : member,
        );
        await saveTeamMembers(nextMembers);
      }

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
                value={rosterName}
                onChangeText={setRosterName}
                editable={editing}
                placeholder="Your name on the team roster"
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
        <EditableSection title="Team" onSave={handleSaveTeam} onCancel={resetTeamDrafts}>
          {(editing) => (
            <>
              <EditableField
                label="Team name"
                value={draftTeamName}
                onChangeText={setDraftTeamName}
                editable={editing}
                placeholder="Enter team name"
              />
              <EditableField label="Join code" value={teamId || '—'} editable={false} />
              <EditableField
                label="Grade level"
                value={draftGradeLevel}
                onChangeText={setDraftGradeLevel}
                editable={editing}
                placeholder="Enter grade level"
              />
            </>
          )}
        </EditableSection>
      ) : (
        <View style={styles.emptyPanel}>
          <Text style={styles.empty}>You have not joined a team yet.</Text>
        </View>
      )}
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
});
