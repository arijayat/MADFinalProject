import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#888888',
        tabBarStyle: {
          backgroundColor: '#1e1e1e',
          borderTopColor: '#333',
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'HUB',
          tabBarIcon: ({ color }) => <MaterialIcons name="home" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rankings"
        options={{
          title: 'RANKINGS',
          tabBarIcon: ({ color }) => <MaterialIcons name="emoji-events" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: 'TEAM',
          tabBarIcon: ({ color }) => <MaterialIcons name="group" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}
