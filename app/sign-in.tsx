import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleSignIn } from '@/hooks/use-google-sign-in';

function getPostAuthRoute(hasTeam: boolean): '/(tabs)' | '/team-onboarding' {
  return hasTeam ? '/(tabs)' : '/team-onboarding';
}

export default function SignInScreen() {
  const router = useRouter();
  const { configError, refreshProfile } = useAuth();
  const { signInWithGoogle, isGoogleConfigured, isReady } = useGoogleSignIn();
  const [googleLoading, setGoogleLoading] = useState(false);

  function showConfigHelp() {
    if (!configError) return;
    Alert.alert('Firebase setup', configError);
  }

  async function handleGoogleSignIn() {
    if (!isGoogleConfigured) {
      Alert.alert(
        'Google Sign-In',
        'Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your .env file. See docs/FIREBASE_SETUP.md.',
      );
      return;
    }

    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      const updated = await refreshProfile();
      router.replace(getPostAuthRoute(Boolean(updated?.teamId)));
    } catch (error) {
      Alert.alert(
        'Google sign-in failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.centerContent}>
        <View style={styles.logo} />
        <Text style={styles.title}>GLOBAL APP</Text>
        <Text style={styles.subtitle}>
          Log in with email and password, or sign in with Google.
        </Text>
        {configError ? (
          <Text style={styles.configError} onPress={showConfigHelp}>
            Tap here: Firebase .env is missing or incomplete.
          </Text>
        ) : null}
        <View style={styles.actions}>
          <PrimaryButton
            label="LOG IN"
            style={styles.button}
            onPress={() => router.push('/log-in')}
            disabled={googleLoading}
          />
          <PrimaryButton
            variant="light"
            label="CREATE ACCOUNT"
            style={styles.button}
            onPress={() => router.push('/create-account')}
            disabled={googleLoading}
          />
          <PrimaryButton
            variant="light"
            label={googleLoading ? 'SIGNING IN…' : 'SIGN IN WITH GOOGLE'}
            style={styles.button}
            onPress={handleGoogleSignIn}
            disabled={googleLoading || !isReady}
          />
        </View>
        {googleLoading ? <ActivityIndicator style={styles.spinner} color={Wireframe.textMuted} /> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Wireframe.panelBg,
    paddingHorizontal: 24,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    backgroundColor: '#d0d0d0',
    borderWidth: 1,
    borderColor: Wireframe.border,
    borderRadius: 8,
  },
  title: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: Wireframe.text,
  },
  subtitle: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 14,
    color: Wireframe.textMuted,
    maxWidth: 320,
    lineHeight: 20,
  },
  configError: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 12,
    color: '#b45309',
    maxWidth: 320,
    textDecorationLine: 'underline',
  },
  actions: {
    width: '100%',
    maxWidth: 320,
    marginTop: 28,
    gap: 14,
  },
  button: {
    width: '100%',
  },
  spinner: {
    marginTop: 16,
  },
});
