import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';

function captainDefaultName(
  displayName: string | null | undefined,
  email: string | null | undefined,
): string {
  return displayName?.trim() || email?.split('@')[0]?.trim() || '';
}

export default function TeamMembersScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { user, profile } = useAuth();
  const { teamName, members, addMember, registerTeam } = useTeam();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const suggestedCaptainName = captainDefaultName(profile?.displayName, user?.email);
  const captainSeeded = useRef(false);

  useEffect(() => {
    if (captainSeeded.current || !suggestedCaptainName || !user?.uid) return;

    const alreadyListed = members.some(
      (member) =>
        member.uid === user.uid ||
        member.name.trim().toLowerCase() === suggestedCaptainName.toLowerCase(),
    );

    if (!alreadyListed) {
      addMember(suggestedCaptainName);
    }

    captainSeeded.current = true;
  }, [suggestedCaptainName, user?.uid, members, addMember]);

  async function handleContinue() {
    setSubmitting(true);
    try {
      const { code } = await registerTeam();
      Alert.alert(
        'Team registered',
        `Share this join code with teammates: ${code}\n\nIt is also shown on the Team tab as #${code}.`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }],
      );
    } catch (error) {
      Alert.alert(
        'Could not save team',
        error instanceof Error ? error.message : 'Check Firestore rules and your connection.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <WireScreen
      footer={
        <PrimaryButton
          label={submitting ? 'SAVING…' : 'CONTINUE'}
          style={styles.primaryButton}
          onPress={handleContinue}
          disabled={submitting}
        />
      }>
      <View style={styles.content}>
        <Text style={[styles.heading, { color: colors.headerText }]}>TEAM MEMBERS</Text>
        <Text style={[styles.sub, { color: colors.headerSubtle }]}>
          Add all members of {teamName || 'your team'}, including your own name.
          {suggestedCaptainName
            ? ` We added "${suggestedCaptainName}" for you — edit the list if needed.`
            : ''}
        </Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.headerText }]}>Member name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.panelBg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Enter the team member name"
            placeholderTextColor={Wireframe.placeholder}
            value={name}
            onChangeText={setName}
            editable={!submitting}
          />
        </View>
        <PrimaryButton
          variant="light"
          label="ADD MEMBER"
          style={styles.secondaryButton}
          disabled={submitting}
          onPress={() => {
            if (name.trim()) {
              addMember(name.trim());
              setName('');
            }
          }}
        />

        {members.length > 0 ? (
          <View style={styles.added}>
            <Text style={[styles.addedTitle, { color: colors.headerSubtle }]}>Added ({members.length})</Text>
            {members.map((m) => (
              <Text key={m.id} style={[styles.addedRow, { color: colors.headerText }]}>
                • {m.name}
              </Text>
            ))}
          </View>
        ) : null}

        {submitting ? <ActivityIndicator color={colors.headerText} style={styles.spinner} /> : null}
      </View>
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingTop: 24,
  },
  heading: {
    color: Wireframe.panelBg,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sub: {
    color: '#cfcfcf',
    marginBottom: 24,
    marginTop: 4,
  },
  field: {
    marginBottom: 18,
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
  secondaryButton: {
    width: '100%',
    marginTop: 16,
  },
  added: {
    marginTop: 24,
  },
  addedTitle: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 10,
  },
  addedRow: {
    color: Wireframe.panelBg,
    fontSize: 14,
    marginBottom: 6,
  },
  primaryButton: {
    width: '100%',
  },
  spinner: {
    marginTop: 20,
  },
});
