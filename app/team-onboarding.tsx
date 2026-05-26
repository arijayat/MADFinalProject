import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/wireframe/BackNav';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { WireScreen } from '@/components/wireframe/WireScreen';
import { Wireframe } from '@/constants/wireframe-theme';
import { useTeam } from '@/contexts/TeamContext';

export default function TeamOnboardingScreen() {
  const router = useRouter();
  const { resetForNewTeam } = useTeam();

  return (
    <WireScreen scroll={false}>
      <ScreenHeader
        backLabel="Back"
        onBack={() => router.replace('/sign-in')}
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
        New teams set up a name, grade level, and roster. Joining only needs a team code from your
        captain or teacher.
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
});
