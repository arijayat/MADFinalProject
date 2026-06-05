import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthRedirect } from '@/components/AuthRedirect';
import { ActivitySessionProvider } from '@/contexts/ActivitySessionContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { TeamProvider } from '@/contexts/TeamContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

function RootNavigation() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
