import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenHeader } from '@/components/wireframe/BackNav';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { Wireframe } from '@/constants/wireframe-theme';
import { useTeam } from '@/contexts/TeamContext';

export default function JoinTeamScreen() {
  const router = useRouter();
  const { joinWithTeamCode } = useTeam();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canContinue = code.trim().length > 0 && !submitting;

  async function handleJoin() {
    setSubmitting(true);
    try {
      await joinWithTeamCode(code.trim());
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(
        'Could not join team',
        error instanceof Error ? error.message : 'Check the code and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <WireScreen
      footer={
        <PrimaryButton
          label={submitting ? 'JOINING…' : 'JOIN TEAM'}
          style={styles.primaryButton}
          disabled={!canContinue}
          onPress={handleJoin}
        />
      }>
      <ScreenHeader
        backLabel="Back"
        onBack={() => router.back()}
        title="Join a team"
        subtitle="Enter the team code from your captain (letters and numbers)."
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
