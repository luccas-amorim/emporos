import React from 'react';
import { Pressable, type PressableProps, type StyleProp, View, type ViewProps, type ViewStyle } from 'react-native';

import type { Paleta } from '@/constants/theme';
import { useTema } from '@/hooks/use-tema';

type Tom = 'neutro' | 'brasil' | 'exterior' | 'aviso' | 'apoio';

interface CartaoProps extends ViewProps {
  /** Fundo: card com borda (neutro), um dos "Soft" ou surface2 (apoio), sem borda. */
  tom?: Tom;
  /** Raio 20 (padrão) ou 18, dos cards de lista. */
  raio?: 18 | 20;
  /** Borda de 1,5px numa cor de destaque (foco, veredito que mudou). */
  destaque?: keyof Paleta;
  /** Borda tracejada (campo vazio). */
  tracejado?: boolean;
  /** Sem padding interno, para listas agrupadas com divisores. */
  semPadding?: boolean;
  aoTocar?: PressableProps['onPress'];
}

const FUNDO: Record<Tom, keyof Paleta> = {
  neutro: 'card',
  brasil: 'brasilSoft',
  exterior: 'exteriorSoft',
  aviso: 'warnSoft',
  apoio: 'surface2',
};

export function estiloCartao(
  cores: Paleta,
  { tom = 'neutro', raio = 20, destaque, tracejado, semPadding }: Omit<CartaoProps, 'aoTocar'>
): StyleProp<ViewStyle> {
  return {
    backgroundColor: cores[FUNDO[tom]],
    borderRadius: raio,
    padding: semPadding ? 0 : 14,
    borderWidth: destaque ? 1.5 : tom === 'neutro' ? 1 : 0,
    borderColor: destaque ? cores[destaque] : cores.border,
    borderStyle: tracejado ? 'dashed' : 'solid',
    overflow: semPadding ? 'hidden' : undefined,
  };
}

// Card com borda de 1px no lugar de sombra.
export function Cartao({ tom, raio, destaque, tracejado, semPadding, aoTocar, style, children, ...props }: CartaoProps) {
  const { cores } = useTema();
  const base = estiloCartao(cores, { tom, raio, destaque, tracejado, semPadding });

  if (aoTocar) {
    return (
      <Pressable
        onPress={aoTocar}
        accessibilityRole="button"
        style={({ pressed }) => [base, pressed && { opacity: 0.7 }, style]}
        {...(props as PressableProps)}>
        {children}
      </Pressable>
    );
  }
  return (
    <View style={[base, style]} {...props}>
      {children}
    </View>
  );
}
