import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ActivitySessionProvider } from '@/contexts/ActivitySessionContext';
import { TeamProvider } from '@/contexts/TeamContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <TeamProvider>
      <ActivitySessionProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="log-in" />
          <Stack.Screen name="team-onboarding" />
          <Stack.Screen name="join-team" />
          <Stack.Screen name="team-registration" />
          <Stack.Screen name="team-members" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="activity/[activityId]" />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
      </ActivitySessionProvider>
    </TeamProvider>
  );
}
