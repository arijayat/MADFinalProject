import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ScreenHeader } from '@/components/wireframe/BackNav';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { Panel } from '@/components/wireframe/Panel';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';
import { getTeamByJoinCode } from '@/lib/firestore/teams';
import { getUnclaimedTeamMembers } from '@/lib/team-members';
import type { FirestoreTeamMember } from '@/types/firestore';
import { Wireframe } from '@/constants/wireframe-theme';

export default function JoinTeamPickNameScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const { user } = useAuth();
  const { joinWithTeamCode } = useTeam();

  const [teamName, setTeamName] = useState('');
  const [unclaimed, setUnclaimed] = useState<FirestoreTeamMember[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadRoster = useCallback(async () => {
    if (!code?.trim()) {
      setLoadError('Missing team code. Go back and enter your code again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      const team = await getTeamByJoinCode(code);
      if (!team) {
        setLoadError('Team not found. Check the code and try again.');
        setUnclaimed([]);
        return;
      }

      if (user && team.memberUids.includes(user.uid)) {
        router.replace('/(tabs)');
        return;
      }

      setTeamName(team.name);
      const open = getUnclaimedTeamMembers(team.members ?? []);
      setUnclaimed(open);
      if (open.length === 1) {
        setSelectedId(open[0].id);
      }
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'Could not load team roster.',
      );
    } finally {
      setLoading(false);
    }
  }, [code, user, router]);

  useEffect(() => {
    void loadRoster();
  }, [loadRoster]);

  async function handleJoin() {
    if (!code?.trim() || !selectedId) return;

    setSubmitting(true);
    try {
      await joinWithTeamCode(code.trim(), selectedId);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(
        'Could not join team',
        error instanceof Error ? error.message : 'Check your connection and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <WireScreen
      footer={
        <PrimaryButton
          label={submitting ? 'JOINING…' : 'CONFIRM & JOIN TEAM'}
          style={styles.primaryButton}
          disabled={!selectedId || submitting || loading || unclaimed.length === 0}
          onPress={handleJoin}
        />
      }>
      <ScreenHeader
        backLabel="Back"
        onBack={() => router.back()}
        title="Pick your name"
        subtitle={
          teamName
            ? `Select the name your captain added for ${teamName}.`
            : 'Select the name your captain added to the roster.'
        }
      />

      {loading ? (
        <ActivityIndicator color={Wireframe.panelBg} style={styles.spinner} />
      ) : loadError ? (
        <Text style={styles.error}>{loadError}</Text>
      ) : unclaimed.length === 0 ? (
        <Panel>
          <Text style={styles.emptyTitle}>No names available</Text>
          <Text style={styles.emptyBody}>
            Every name on this team is already linked to an account. Ask your captain to add your
            name on the team registration screen, then try joining again.
          </Text>
        </Panel>
      ) : (
        <View style={styles.list}>
          {unclaimed.map((member) => {
            const selected = selectedId === member.id;
            return (
              <Pressable
                key={member.id}
                onPress={() => setSelectedId(member.id)}
                disabled={submitting}
                style={[styles.nameWrap, selected && styles.nameWrapSelected]}>
                <Panel>
                  <Text style={styles.memberName}>{member.name}</Text>
                  {selected ? (
                    <Text style={styles.selectedHint}>Selected — this will be your roster name</Text>
                  ) : null}
                </Panel>
              </Pressable>
            );
          })}
        </View>
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
  },
  nameWrap: {
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  nameWrapSelected: {
    borderColor: Wireframe.panelBg,
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
  primaryButton: {
    width: '100%',
  },
  spinner: {
    marginTop: 24,
  },
  error: {
    color: '#ffb4b4',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
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
