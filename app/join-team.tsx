import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenHeader } from '@/components/wireframe/BackNav';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { useAuth } from '@/contexts/AuthContext';
import { getTeamByJoinCode } from '@/lib/firestore/teams';
import { getUnclaimedTeamMembers } from '@/lib/team-members';
import { normalizeTeamCode } from '@/lib/team-code';
import { Wireframe } from '@/constants/wireframe-theme';

export default function JoinTeamScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canContinue = code.trim().length > 0 && !submitting;

  async function handleContinue() {
    setSubmitting(true);
    try {
      const team = await getTeamByJoinCode(code.trim());
      if (!team) {
        Alert.alert('Team not found', 'Check the code from your captain and try again.');
        return;
      }

      if (user && team.memberUids.includes(user.uid)) {
        router.replace('/(tabs)');
        return;
      }

      const unclaimed = getUnclaimedTeamMembers(team.members ?? []);
      if (unclaimed.length === 0) {
        Alert.alert(
          'No names left to claim',
          'Every name on this team is already linked. Ask your captain to add your name, then try again.',
        );
        return;
      }

      const normalized = normalizeTeamCode(code.trim());
      router.push({
        pathname: '/join-team-pick-name',
        params: { code: normalized },
      });
    } catch (error) {
      Alert.alert(
        'Could not look up team',
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
          label={submitting ? 'CHECKING…' : 'CONTINUE'}
          style={styles.primaryButton}
          disabled={!canContinue}
          onPress={handleContinue}
        />
      }>
      <ScreenHeader
        backLabel="Back"
        onBack={() => router.back()}
        title="Join a team"
        subtitle="Enter the team code from your captain, then pick your name from the roster."
      />

      <View style={styles.field}>
        <Text style={styles.label}>Team code</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. ALPHA7"
          placeholderTextColor={Wireframe.placeholder}
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          editable={!submitting}
        />
      </View>

      {submitting ? <ActivityIndicator color={Wireframe.panelBg} style={styles.spinner} /> : null}
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  field: {
    marginTop: 8,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  label: {
    color: Wireframe.panelBg,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: Wireframe.panelBg,
    borderWidth: 1,
    borderColor: Wireframe.border,
    borderRadius: 4,
    padding: 14,
    fontSize: 15,
    color: Wireframe.text,
  },
  primaryButton: {
    width: '100%',
  },
  spinner: {
    marginTop: 16,
  },
});
