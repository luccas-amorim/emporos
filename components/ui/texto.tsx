import React from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { familiaFonte, type Paleta, type PesoFonte } from '@/constants/theme';
import { useTema } from '@/hooks/use-tema';

// Escala tipográfica do app (ver docs/design_handoff_revamp_vale_importar/README.md).
export type VarianteTexto =
  | 'veredito'
  | 'tituloAba'
  | 'tituloSheet'
  | 'valor'
  | 'corpo'
  | 'secundario'
  | 'rotulo'
  | 'overline';

interface Estilo {
  tamanho: number;
  peso: PesoFonte;
  mono?: boolean;
  alturaLinha?: number;
  espacamento?: number;
  cor: keyof Paleta;
  caixaAlta?: boolean;
}

const VARIANTES: Record<VarianteTexto, Estilo> = {
  veredito: { tamanho: 38, peso: 600, alturaLinha: 40, espacamento: -1.5, cor: 'text' },
  tituloAba: { tamanho: 30, peso: 600, alturaLinha: 36, espacamento: -0.9, cor: 'text' },
  tituloSheet: { tamanho: 22, peso: 600, alturaLinha: 28, espacamento: -0.44, cor: 'text' },
  valor: { tamanho: 21, peso: 600, mono: true, alturaLinha: 27, espacamento: -0.42, cor: 'text' },
  corpo: { tamanho: 15, peso: 400, alturaLinha: 21, cor: 'text' },
  secundario: { tamanho: 13, peso: 400, alturaLinha: 18, cor: 'textMuted' },
  rotulo: { tamanho: 12, peso: 400, alturaLinha: 16, cor: 'textSubtle' },
  overline: { tamanho: 11, peso: 600, alturaLinha: 15, espacamento: 0.88, cor: 'textSubtle', caixaAlta: true },
};

/** Fonte dinâmica do sistema até 130%, sem cortar valores. */
export const LIMITE_ESCALA_FONTE = 1.3;

export interface TextoProps extends TextProps {
  variante?: VarianteTexto;
  /** Sobrepõe o peso da variante. */
  peso?: PesoFonte;
  /** Geist Mono com números tabulares (valores, cotações, datas). */
  mono?: boolean;
  /** Token da paleta; para uma cor fora dela, use `style`. */
  cor?: keyof Paleta;
  tamanho?: number;
}

export function Texto({ variante = 'corpo', peso, mono, cor, tamanho, style, ...props }: TextoProps) {
  const { cores } = useTema();
  const base = VARIANTES[variante];
  const usarMono = mono ?? base.mono ?? false;
  const tamanhoFinal = tamanho ?? base.tamanho;

  const estilo: TextStyle = {
    fontFamily: familiaFonte(usarMono, peso ?? base.peso),
    fontSize: tamanhoFinal,
    lineHeight: tamanho ? Math.round(tamanho * 1.35) : base.alturaLinha,
    letterSpacing: base.espacamento,
    color: cores[cor ?? base.cor],
    textTransform: base.caixaAlta ? 'uppercase' : undefined,
    fontVariant: usarMono ? ['tabular-nums'] : undefined,
  };

  return (
    <Text maxFontSizeMultiplier={LIMITE_ESCALA_FONTE} style={StyleSheet.compose(estilo, style)} {...props} />
  );
}
