import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AdMobBanner } from '@/components/ads/AdMobBanner';
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
    <View style={styles.root}>
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
        animation: 'fade',
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
    <View style={styles.bannerSlot}>
      <AdMobBanner />
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bannerSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 64,
    alignItems: 'center',
  },
});
