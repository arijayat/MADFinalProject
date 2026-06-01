import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/wireframe/BackNav';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';

export default function TeamOnboardingScreen() {
  const router = useRouter();
  const { profile, logOut } = useAuth();
  const { resetForNewTeam, isLoadingTeam } = useTeam();

  useEffect(() => {
    if (!isLoadingTeam && profile?.teamId) {
      router.replace('/(tabs)');
    }
  }, [isLoadingTeam, profile?.teamId, router]);

  if (isLoadingTeam) {
    return (
      <WireScreen scroll={false}>
        <ActivityIndicator size="large" color="#fff" style={styles.loader} />
        <Text style={styles.loadingText}>Loading your team…</Text>
      </WireScreen>
    );
  }

  return (
    <WireScreen scroll={false}>
      <ScreenHeader
        backLabel="Sign out"
        onBack={() => void logOut().then(() => router.replace('/sign-in'))}
        title="Your team"
        subtitle="Register a new team for this season, or join one that already exists."
      />

      <View style={styles.stack}>
        <PrimaryButton
          label="REGISTER NEW TEAM"
          style={styles.btn}
          onPress={() => {
            resetForNewTeam();
            router.push('/team-registration');
          }}
        />
        <PrimaryButton
          variant="light"
          label="JOIN EXISTING TEAM"
          style={styles.btn}
          onPress={() => router.push('/join-team')}
        />
      </View>

      <Text style={styles.hint}>
        New teams get a join code to share. Joining only needs that code from your captain or
        teacher. Data is saved to Firebase Firestore.
      </Text>
    </WireScreen>
  );
}

const styles = StyleSheet.create({
  stack: {
    marginTop: 24,
    gap: 14,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  btn: {
    width: '100%',
  },
  hint: {
    marginTop: 28,
    fontSize: 13,
    color: '#aaa',
    lineHeight: 19,
    maxWidth: 420,
    alignSelf: 'center',
  },
  loader: {
    marginTop: 48,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#ccc',
    fontSize: 14,
  },
});
