import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Wireframe } from '@/constants/wireframe-theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalization } from '@/contexts/LocalizationContext';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const { colors, isDark } = useAppTheme();
  const { t } = useLocalization();

  if (!isLoading && !user) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? '#7dd3fc' : Wireframe.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.panelBg,
          borderTopColor: colors.border,
          height: 64,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        headerShown: false,
        tabBarButton: HapticTab,
        animation: 'shift',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabHub'),
          tabBarIcon: ({ color }) => <MaterialIcons name="home" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rankings"
        options={{
          title: t('tabRankings'),
          tabBarIcon: ({ color }) => <MaterialIcons name="emoji-events" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: t('tabTeam'),
          tabBarIcon: ({ color }) => <MaterialIcons name="group" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabProfile'),
          tabBarIcon: ({ color }) => <MaterialIcons name="account-circle" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}
