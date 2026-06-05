import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthRedirect } from '@/components/AuthRedirect';
import { ActivitySessionProvider } from '@/contexts/ActivitySessionContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { TeamProvider } from '@/contexts/TeamContext';
import { Wireframe } from '@/constants/wireframe-theme';

const AppTheme = {
  dark: false,
  colors: {
    primary: Wireframe.accent,
    background: Wireframe.screenBg,
    card: Wireframe.panelBg,
    text: Wireframe.text,
    border: Wireframe.border,
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

function RootNavigation() {
  return (
    <ThemeProvider value={AppTheme}>
      <AuthRedirect />
      <Stack screenOptions={{ headerShown: false }}>
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
    <AuthProvider>
      <TeamProvider>
        <ActivitySessionProvider>
          <RootNavigation />
        </ActivitySessionProvider>
      </TeamProvider>
    </AuthProvider>
  );
}
