import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTema } from '@/hooks/use-tema';

export default function TabLayout() {
  const { cores } = useTema();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: cores.tabIconSelected,
        tabBarInactiveTintColor: cores.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 72,
          paddingBottom: Platform.OS === 'ios' ? 28 : 14,
          paddingTop: 8,
          backgroundColor: cores.card,
          borderTopColor: cores.borderSoft,
        },
        tabBarLabelStyle: { fontSize: 11, marginBottom: 0 },
        tabBarIconStyle: { marginBottom: 2 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="clock.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
