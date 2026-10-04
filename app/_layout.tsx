import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { Onboarding, useOnboarding } from '@/components/onboarding';
import { ARQUIVOS_FONTES, Colors } from '@/constants/theme';
import { TemaProvider, useTema } from '@/hooks/use-tema';
import { configurarNotificacoes } from '@/services/notificacoes';
// Define a tarefa de verificação de alertas no carregamento, antes de o sistema acordar o app.
import '@/services/tarefa-alertas';

configurarNotificacoes();
// Segura a splash até a Geist carregar, para a primeira tela não piscar com a fonte do sistema.
SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  anchor: '(tabs)',
};

// Tema do React Navigation com as cores do app (fundo das telas empilhadas, cabeçalhos).
function temaNavegacao(base: typeof DefaultTheme, cores: typeof Colors.light) {
  return {
    ...base,
    colors: {
      ...base.colors,
      background: cores.background,
      card: cores.card,
      border: cores.border,
      text: cores.text,
      primary: cores.text,
    },
  };
}

const TEMA_CLARO = temaNavegacao(DefaultTheme, Colors.light);
const TEMA_ESCURO = temaNavegacao(DarkTheme, Colors.dark);

function ConteudoRaiz() {
  const { escuro } = useTema();
  const onboarding = useOnboarding();

  return (
    <ThemeProvider value={escuro ? TEMA_ESCURO : TEMA_CLARO}>
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
  const [fontesCarregadas, erroFontes] = useFonts(ARQUIVOS_FONTES);
  const pronto = fontesCarregadas || !!erroFontes;

  useEffect(() => {
    if (pronto) SplashScreen.hideAsync().catch(() => {});
  }, [pronto]);

  // Se a fonte falhar, o app segue com a do sistema em vez de travar na splash.
  if (!pronto) return null;

  return (
    <TemaProvider>
      <ConteudoRaiz />
    </TemaProvider>
  );
}
