import { Tabs } from 'expo-router';
import React from 'react';

import { BarraAbas } from '@/components/barra-abas';

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <BarraAbas {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Comparar' }} />
      <Tabs.Screen name="historico" options={{ title: 'Histórico' }} />
    </Tabs>
  );
}
