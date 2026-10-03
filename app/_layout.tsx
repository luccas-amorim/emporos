import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-reanimated';

import { Onboarding, useOnboarding } from '@/components/onboarding';
import { TemaProvider, useTema } from '@/hooks/use-tema';

export const unstable_settings = {
  anchor: '(tabs)',
};

function ConteudoRaiz() {
  const { escuro } = useTema();
  const onboarding = useOnboarding();

  return (
    <ThemeProvider value={escuro ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <Onboarding visivel={onboarding.visivel} aoConcluir={onboarding.concluir} />
      </View>
      <StatusBar style={escuro ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <TemaProvider>
      <ConteudoRaiz />
    </TemaProvider>
  );
}
