import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Texto } from '@/components/ui/texto';
import type { Paleta } from '@/constants/theme';
import { useTema } from '@/hooks/use-tema';

type Tom = 'neutro' | 'brasil' | 'exterior' | 'aviso';

interface ChipProps {
  rotulo: string;
  tom?: Tom;
  aoTocar?: () => void;
  accessibilityLabel?: string;
}

const CORES: Record<Tom, { fundo: keyof Paleta; texto: keyof Paleta }> = {
  neutro: { fundo: 'card', texto: 'text' },
  brasil: { fundo: 'brasilSoft', texto: 'brasil' },
  exterior: { fundo: 'exteriorSoft', texto: 'exterior' },
  aviso: { fundo: 'warnSoft', texto: 'warn' },
};

// Pill de premissa ou de estado. Tocável, ganha área de toque de 44pt.
export function Chip({ rotulo, tom = 'neutro', aoTocar, accessibilityLabel }: ChipProps) {
  const { cores } = useTema();
  const { fundo, texto } = CORES[tom];
  const estilo = [
    styles.chip,
    { backgroundColor: cores[fundo], borderColor: tom === 'neutro' ? cores.border : cores[fundo] },
  ];
  const conteudo = (
    <Texto tamanho={12.5} peso={tom === 'neutro' ? 400 : 600} cor={texto} numberOfLines={1}>
      {rotulo}
    </Texto>
  );

  if (!aoTocar) {
    return (
      <View style={estilo} accessibilityLabel={accessibilityLabel}>
        {conteudo}
      </View>
    );
  }
  return (
    <Pressable
      style={({ pressed }) => [estilo, pressed && { opacity: 0.7 }]}
      onPress={aoTocar}
      hitSlop={{ top: 6, bottom: 6 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? rotulo}>
      {conteudo}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { paddingVertical: 7, paddingHorizontal: 11, borderRadius: 999, borderWidth: 1, minHeight: 32, justifyContent: 'center' },
});
