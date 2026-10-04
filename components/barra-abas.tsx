import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Texto } from '@/components/ui/texto';
import type { Paleta } from '@/constants/theme';
import { useTema } from '@/hooks/use-tema';

// Tab bar só com texto: a aba ativa é uma pill surface2; as outras, texto discreto.
export function BarraAbas({ state, descriptors, navigation }: BottomTabBarProps) {
  const { cores } = useTema();
  const styles = useMemo(() => criarStyles(cores), [cores]);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.barra, { paddingBottom: Math.max(insets.bottom, 10) }]} accessibilityRole="tablist">
      {state.routes.map((rota, indice) => {
        const { options } = descriptors[rota.key];
        const rotulo = options.title ?? rota.name;
        const ativa = state.index === indice;

        const aoTocar = () => {
          const evento = navigation.emit({ type: 'tabPress', target: rota.key, canPreventDefault: true });
          if (!ativa && !evento.defaultPrevented) navigation.navigate(rota.name, rota.params);
        };

        return (
          <Pressable
            key={rota.key}
            style={[styles.aba, ativa && styles.abaAtiva]}
            onPress={aoTocar}
            onPressIn={() => {
              if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativa }}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? rotulo}>
            <Texto tamanho={12.5} peso={ativa ? 600 : 400} cor={ativa ? 'text' : 'textSubtle'} numberOfLines={1}>
              {rotulo}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

function criarStyles(cores: Paleta) {
  return StyleSheet.create({
    barra: {
      flexDirection: 'row',
      gap: 6,
      paddingTop: 10,
      paddingHorizontal: 16,
      backgroundColor: cores.card,
      borderTopWidth: 1,
      borderTopColor: cores.border,
    },
    aba: { flex: 1, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    abaAtiva: { backgroundColor: cores.surface2 },
  });
}
