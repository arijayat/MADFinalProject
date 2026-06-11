import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { AppLogo } from '@/components/AppLogo';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalization } from '@/contexts/LocalizationContext';

function getPostAuthRoute(hasTeam: boolean): '/(tabs)' | '/team-onboarding' {
  return hasTeam ? '/(tabs)' : '/team-onboarding';
}

export default function SplashScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { user, profile, isLoading, configError } = useAuth();
  const { t } = useLocalization();

  useEffect(() => {
    if (isLoading) return;

    const delay = setTimeout(() => {
      if (configError) {
        router.replace('/sign-in');
        return;
      }
      if (user) {
        router.replace(getPostAuthRoute(Boolean(profile?.teamId)));
      } else {
        router.replace('/sign-in');
      }
    }, 1200);

    return () => clearTimeout(delay);
  }, [isLoading, user, profile?.teamId, configError, router]);

  function handleTap() {
    if (isLoading) return;
    if (configError) {
      router.replace('/sign-in');
      return;
    }
    if (user) {
      router.replace(getPostAuthRoute(Boolean(profile?.teamId)));
    } else {
      router.replace('/sign-in');
    }
  }

  return (
    <Pressable style={[styles.screen, { backgroundColor: colors.screenBg }]} onPress={handleTap}>
      <AppLogo size={220} />
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.headerSubtle} />
      ) : (
        <Text style={[styles.hint, { color: colors.headerSubtle }]}>{t('tapToContinue')}</Text>
      )}
      {configError ? (
        <Text style={styles.configWarning} numberOfLines={4}>
          {t('firebaseWarning')}
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
