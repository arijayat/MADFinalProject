import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ScreenHeader } from '@/components/wireframe/BackNav';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { Panel } from '@/components/wireframe/Panel';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';
import { getLinkedTeamMembersExcept } from '@/lib/team-members';

function showErrorAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export default function LeaveTeamCaptainScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { teamName, members, leaveTeam, isTeamOwner } = useTeam();

  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const successorOptions = useMemo(
    () => (user?.uid ? getLinkedTeamMembersExcept(members, user.uid) : []),
    [members, user?.uid],
  );

  const mustPickSuccessor = successorOptions.length > 0;

  useEffect(() => {
    if (!isTeamOwner) {
      router.replace('/(tabs)/profile');
    }
  }, [isTeamOwner, router]);

  useEffect(() => {
    if (successorOptions.length === 1) {
      setSelectedUid(successorOptions[0].uid ?? null);
    }
  }, [successorOptions]);

  async function handleLeave() {
    if (mustPickSuccessor && !selectedUid) return;

    setSubmitting(true);
    try {
      await leaveTeam(selectedUid ?? undefined);
      router.replace('/team-onboarding');
    } catch (error) {
      showErrorAlert(
        'Could not leave team',
        error instanceof Error ? error.message : 'Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!isTeamOwner) {
    return null;
  }

  return (
    <WireScreen
      scroll={false}
      footer={
        <PrimaryButton
          label={submitting ? 'LEAVING…' : mustPickSuccessor ? 'CONFIRM & LEAVE TEAM' : 'LEAVE TEAM'}
          style={styles.primaryButton}
          disabled={submitting || (mustPickSuccessor && !selectedUid)}
          onPress={handleLeave}
        />
      }>
      <ScreenHeader
        backLabel="Back"
        onBack={() => router.back()}
        title="Leave as captain"
        subtitle={
          mustPickSuccessor
            ? `Choose who will captain ${teamName || 'your team'} after you leave.`
            : 'No other members have joined yet. The team will stay, but no accounts will be linked.'
        }
      />

      {mustPickSuccessor ? (
        <View style={styles.list}>
          {successorOptions.map((member) => {
            const selected = selectedUid === member.uid;
            return (
              <TouchableOpacity
                key={member.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                activeOpacity={0.85}
                onPress={() => member.uid && setSelectedUid(member.uid)}
                disabled={submitting}
                style={[
                  styles.nameCard,
                  selected && styles.nameCardSelected,
                  Platform.OS === 'web' && styles.nameCardWeb,
                ]}>
                <Text style={styles.memberName}>{member.name}</Text>
                {selected ? (
                  <Text style={styles.selectedHint}>Selected — they will become captain</Text>
                ) : (
                  <Text style={styles.tapHint}>Tap to select as new captain</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <Panel>
          <Text style={styles.emptyTitle}>Team will have no members</Text>
          <Text style={styles.emptyBody}>
            The team and its join code will remain in Firestore. Roster names stay, but no accounts
            will be linked until someone joins again.
          </Text>
        </Panel>
      )}
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    flex: 1,
  },
  nameCard: {
    backgroundColor: Wireframe.panelBg,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Wireframe.border,
    padding: 12,
  },
  nameCardSelected: {
    borderColor: '#ffffff',
  },
  nameCardWeb: {
    cursor: 'pointer',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: Wireframe.text,
  },
  selectedHint: {
    marginTop: 6,
    fontSize: 12,
    color: Wireframe.textMuted,
  },
  tapHint: {
    marginTop: 6,
    fontSize: 12,
    color: Wireframe.placeholder,
  },
  primaryButton: {
    width: '100%',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Wireframe.text,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 13,
    color: Wireframe.textMuted,
    lineHeight: 19,
  },
});
