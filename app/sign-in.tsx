import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/AppLogo';
import { PrimaryButton } from '@/components/wireframe/PrimaryButton';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAuth } from '@/contexts/AuthContext';

export default function SignInScreen() {
  const router = useRouter();
  const { configError } = useAuth();
  const { width } = useWindowDimensions();
  const logoSize = Math.min(width - 32, 400);

  function showConfigHelp() {
    if (!configError) return;
    Alert.alert('Firebase setup', configError);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.centerContent}>
        <AppLogo size={logoSize} tight />
        <Text style={styles.subtitle}>Log in with email and password.</Text>
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
          />
          <PrimaryButton
            variant="light"
            label="CREATE ACCOUNT"
            style={styles.button}
            onPress={() => router.push('/create-account')}
          />
        </View>
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
  subtitle: {
    marginTop: 8,
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
});
