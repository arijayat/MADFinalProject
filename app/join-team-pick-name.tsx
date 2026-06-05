import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { getTeamByJoinCode } from '@/lib/firestore/teams';
import { findSuggestedMemberId, getUnclaimedTeamMembers } from '@/lib/team-members';
import type { FirestoreTeamMember } from '@/types/firestore';

function showErrorAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export default function JoinTeamPickNameScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const { user, profile } = useAuth();
  const { joinWithTeamCode } = useTeam();

  const [teamName, setTeamName] = useState('');
  const [unclaimed, setUnclaimed] = useState<FirestoreTeamMember[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadedForCode = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const normalizedCode = code?.trim() ?? '';

    async function loadRoster() {
      if (!normalizedCode) {
        if (!cancelled) {
          setLoadError('Missing team code. Go back and enter your code again.');
          setLoading(false);
        }
        return;
      }

      const isFirstLoadForCode = loadedForCode.current !== normalizedCode;
      if (isFirstLoadForCode) {
        loadedForCode.current = normalizedCode;
        if (!cancelled) {
          setLoading(true);
          setLoadError(null);
        }
      }

      try {
        const team = await getTeamByJoinCode(normalizedCode);
        if (!team) {
          if (!cancelled) {
            setLoadError('Team not found. Check the code and try again.');
            setUnclaimed([]);
            setSelectedId(null);
          }
          return;
        }

        if (user?.uid && team.memberUids.includes(user.uid)) {
          router.replace('/(tabs)');
          return;
        }

        const open = getUnclaimedTeamMembers(team.members ?? []);
        const suggestedId = findSuggestedMemberId(
          open,
          profile?.displayName ?? user?.displayName ?? null,
          user?.email ?? profile?.email ?? null,
        );

        if (!cancelled) {
          setTeamName(team.name);
          setUnclaimed(open);
          setSelectedId((current) => {
            if (current && open.some((member) => member.id === current)) {
              return current;
            }
            return suggestedId ?? (open.length === 1 ? open[0].id : null);
          });
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : 'Could not load team roster.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRoster();

    return () => {
      cancelled = true;
    };
  }, [
    code,
    user?.uid,
    user?.displayName,
    user?.email,
    profile?.displayName,
    profile?.email,
    router,
  ]);

  async function handleJoin() {
    if (!code?.trim() || !selectedId) return;

    setSubmitting(true);
    try {
      await joinWithTeamCode(code.trim(), selectedId);
      router.replace('/(tabs)');
    } catch (error) {
      showErrorAlert(
        'Could not join team',
        error instanceof Error ? error.message : 'Check your connection and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function selectMember(memberId: string) {
    if (submitting) return;
    setSelectedId(memberId);
  }

  const showSpinner = loading && unclaimed.length === 0 && !loadError;

  return (
    <WireScreen
      scroll={false}
      footer={
        <PrimaryButton
          label={submitting ? 'JOINING…' : 'CONFIRM & JOIN TEAM'}
          style={styles.primaryButton}
          disabled={!selectedId || submitting || showSpinner || unclaimed.length === 0}
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

      {showSpinner ? (
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
              <TouchableOpacity
                key={member.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                activeOpacity={0.85}
                onPress={() => selectMember(member.id)}
                disabled={submitting}
                style={[
                  styles.nameCard,
                  selected && styles.nameCardSelected,
                  Platform.OS === 'web' && styles.nameCardWeb,
                ]}>
                <Text style={styles.memberName}>{member.name}</Text>
                {selected ? (
                  <Text style={styles.selectedHint}>Selected — this will be your roster name</Text>
                ) : (
                  <Text style={styles.tapHint}>Tap to select</Text>
                )}
              </TouchableOpacity>
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
