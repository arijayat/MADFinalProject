import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Wireframe } from '@/constants/wireframe-theme';
import { useAuth } from '@/contexts/AuthContext';

export default function SplashScreen() {
  const router = useRouter();
  const { user, isLoading, configError } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const delay = setTimeout(() => {
      if (configError) {
        router.replace('/sign-in');
        return;
      }
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/sign-in');
      }
    }, 1500);

    return () => clearTimeout(delay);
  }, [isLoading, user, configError, router]);

  function handleTap() {
    if (isLoading) return;
    if (configError) {
      router.replace('/sign-in');
      return;
    }
    router.replace(user ? '/(tabs)' : '/sign-in');
  }

  return (
    <Pressable style={styles.screen} onPress={handleTap}>
      <View style={styles.logo} />
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Wireframe.textMuted} />
      ) : (
        <Text style={styles.hint}>Tap to continue</Text>
      )}
      {configError ? (
        <Text style={styles.configWarning} numberOfLines={4}>
          Firebase not configured — add values to .env and restart Expo.
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Wireframe.panelBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 120,
    height: 120,
    backgroundColor: '#d0d0d0',
    borderWidth: 1,
    borderColor: Wireframe.border,
  },
  hint: {
    marginTop: 24,
    fontSize: 13,
    color: Wireframe.textMuted,
  },
  loader: {
    marginTop: 24,
  },
  configWarning: {
    marginTop: 16,
    fontSize: 12,
    color: '#b45309',
    textAlign: 'center',
    maxWidth: 320,
  },
});
