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
import { TabScreenHeader } from '@/components/wireframe/TabScreenHeader';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();
  const { teamName, teamId, members, isLoadingTeam, teamDocId, saveTeamMembers } = useTeam();

  const [draftMembers, setDraftMembers] = useState<TeamMember[]>(members);
  const [newMemberName, setNewMemberName] = useState('');

  useEffect(() => {
    setDraftMembers(members);
  }, [members]);

  function resetDrafts() {
    setDraftMembers(members);
    setNewMemberName('');
  }

  function updateMemberName(memberId: string, name: string) {
    setDraftMembers((prev) =>
      prev.map((member) => (member.id === memberId ? { ...member, name } : member)),
    );
  }

  function handleAddMember() {
    const trimmed = newMemberName.trim();
    if (!trimmed) {
      Alert.alert('Missing name', 'Enter a team member name first.');
      return;
    }

    setDraftMembers((prev) => [...prev, { id: `m-${Date.now()}`, name: trimmed }]);
    setNewMemberName('');
  }

  async function handleSaveMembers() {
    try {
      await saveTeamMembers(draftMembers);
      setNewMemberName('');
      Alert.alert('Saved', 'Team members were updated.');
    } catch (error) {
      Alert.alert(
        'Could not save members',
        error instanceof Error ? error.message : 'Try again.',
      );
      throw error;
    }
  }

  if (isLoadingTeam) {
    return (
      <WireScreen>
        <TabScreenHeader title="Team" subtitle="Loading team from cloud…" />
        <ActivityIndicator color={Wireframe.panelBg} size="large" />
        <Text style={styles.loading}>Loading team from cloud…</Text>
      </WireScreen>
    );
  }

  if (!teamDocId) {
    return (
      <WireScreen>
        <TabScreenHeader
          title="No team yet"
          subtitle="Register or join a team from the onboarding flow."
        />
      </WireScreen>
    );
  }

  return (
    <WireScreen>
      <TabScreenHeader title={`${teamName} ${teamId}`} subtitle="Team members" />
      <EditableSection
        title="Team members"
        onSave={handleSaveMembers}
        onCancel={resetDrafts}>
        {(editing) => (
          <>
            {draftMembers.length === 0 ? (
              <Text style={styles.empty}>
                {editing ? 'No members yet. Add one below.' : 'No members listed yet.'}
              </Text>
            ) : (
              draftMembers.map((m) => {
                const email = memberDisplayEmail(m, user?.uid, user?.email);
                return (
                  <View key={m.id} style={styles.memberBlock}>
                    {editing ? (
                      <>
                        <Text style={styles.label}>Member name</Text>
                        <TextInput
                          style={styles.input}
                          value={m.name}
                          onChangeText={(value) => updateMemberName(m.id, value)}
                          placeholder="Enter member name"
                          placeholderTextColor={Wireframe.placeholder}
                        />
                      </>
                    ) : (
                      <Text style={styles.memberName}>{m.name}</Text>
                    )}
                    {email ? <Text style={styles.email}>{email}</Text> : null}
                    {m.uid ? <Text style={styles.linked}>Linked to an account</Text> : null}
                  </View>
                );
              })
            )}

            {editing ? (
              <View style={styles.addBlock}>
                <Text style={styles.label}>New member name</Text>
                <TextInput
                  style={styles.input}
                  value={newMemberName}
                  onChangeText={setNewMemberName}
                  placeholder="Enter the team member name"
                  placeholderTextColor={Wireframe.placeholder}
                />
                <PrimaryButton
                  label="ADD MEMBER"
                  onPress={handleAddMember}
                  variant="light"
                  style={styles.addButton}
                />
              </View>
            ) : null}
          </>
        )}
      </EditableSection>
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  loading: {
    marginTop: 12,
    color: '#cfcfcf',
    textAlign: 'center',
  },
  memberBlock: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Wireframe.border,
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
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    color: Wireframe.text,
    backgroundColor: '#fafafa',
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
});
