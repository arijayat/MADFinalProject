import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthRedirect } from '@/components/AuthRedirect';
import { AppThemeProvider, useAppTheme } from '@/contexts/AppThemeContext';
import { ActivitySessionProvider } from '@/contexts/ActivitySessionContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { TeamProvider } from '@/contexts/TeamContext';
import { Wireframe } from '@/constants/wireframe-theme';

function RootNavigation() {
  const { colors, isDark } = useAppTheme();
  const appTheme = {
    dark: isDark,
    colors: {
      primary: Wireframe.accent,
      background: colors.screenBg,
      card: colors.panelBg,
      text: colors.text,
      border: colors.border,
      notification: Wireframe.accentRed,
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400' as const,
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500' as const,
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700' as const,
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '800' as const,
      },
    },
  };

  return (
    <ThemeProvider value={appTheme}>
      <AuthRedirect />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 240,
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="log-in" />
        <Stack.Screen name="create-account" />
        <Stack.Screen name="team-onboarding" />
        <Stack.Screen name="join-team" />
        <Stack.Screen name="join-team-pick-name" />
        <Stack.Screen name="leave-team-captain" />
        <Stack.Screen name="team-registration" />
        <Stack.Screen name="team-members" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="activity/[activityId]" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <LocalizationProvider>
      <AppThemeProvider>
        <AuthProvider>
          <TeamProvider>
            <ActivitySessionProvider>
              <RootNavigation />
            </ActivitySessionProvider>
          </TeamProvider>
        </AuthProvider>
      </AppThemeProvider>
    </LocalizationProvider>
  );
}
