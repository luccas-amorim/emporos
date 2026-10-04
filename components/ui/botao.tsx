import React from 'react';
import { ActivityIndicator, Pressable, type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Texto } from '@/components/ui/texto';
import { useTema } from '@/hooks/use-tema';

interface BotaoProps {
  titulo: string;
  aoTocar: () => void;
  /** Primário (cheio, cor `action`) ou secundário (card com borda). */
  variante?: 'primario' | 'secundario';
  /** 54 (padrão, telas e sheets) ou 50 (barra inferior do Resultado). */
  altura?: 50 | 54;
  desabilitado?: boolean;
  carregando?: boolean;
  icone?: IconSymbolName;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Botao({
  titulo,
  aoTocar,
  variante = 'primario',
  altura = 54,
  desabilitado,
  carregando,
  icone,
  accessibilityLabel,
  style,
}: BotaoProps) {
  const { cores } = useTema();
  const primario = variante === 'primario';
  const corTexto = primario ? cores.actionText : cores.text;

  return (
    <Pressable
      onPress={aoTocar}
      disabled={desabilitado || carregando}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? titulo}
      accessibilityState={{ disabled: !!desabilitado, busy: !!carregando }}
      style={({ pressed }) => [
        styles.botao,
        {
          height: altura,
          borderRadius: altura === 54 ? 16 : 15,
          backgroundColor: primario ? cores.action : cores.card,
          borderWidth: primario ? 0 : 1,
          borderColor: cores.border,
          opacity: desabilitado ? 0.35 : pressed ? 0.8 : 1,
        },
        style,
      ]}>
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <>
          {icone ? <IconSymbol name={icone} size={17} color={corTexto} /> : null}
          <Texto tamanho={altura === 54 ? 16 : 15} peso={600} style={{ color: corTexto }} numberOfLines={1}>
            {titulo}
          </Texto>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
});
