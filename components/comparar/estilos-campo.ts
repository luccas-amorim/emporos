import { StyleSheet, type TextStyle } from 'react-native';

import { familiaFonte, type Paleta } from '@/constants/theme';

// Campos de texto "embutidos" nos cards: sem caixa própria, a borda é a do card.
export function estiloCampo(cores: Paleta, mono: boolean, tamanho: number, peso: 400 | 600 = 400): TextStyle {
  return StyleSheet.flatten({
    fontFamily: familiaFonte(mono, peso),
    fontSize: tamanho,
    color: cores.text,
    padding: 0,
    margin: 0,
    fontVariant: mono ? ['tabular-nums'] : undefined,
  });
}
