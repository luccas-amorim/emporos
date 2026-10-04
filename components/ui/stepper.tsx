import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Texto } from '@/components/ui/texto';
import { useTema } from '@/hooks/use-tema';

interface StepperProps {
  /** Valor já formatado ("2,0%", "R$ 5,30"). */
  valorTexto: string;
  aoDiminuir: () => void;
  aoAumentar: () => void;
  podeDiminuir?: boolean;
  podeAumentar?: boolean;
  /** O que o stepper ajusta, para o leitor de tela ("spread", "cotação alvo"). */
  rotuloAcessivel: string;
  /** Compacto (botões de 32, valor em 15) ou grande (botões de 40, valor em 34). */
  tamanho?: 'compacto' | 'grande';
}

// − valor +. Os botões ganham área de toque de 44pt.
export function Stepper({
  valorTexto,
  aoDiminuir,
  aoAumentar,
  podeDiminuir = true,
  podeAumentar = true,
  rotuloAcessivel,
  tamanho = 'compacto',
}: StepperProps) {
  const { cores } = useTema();
  const grande = tamanho === 'grande';
  const lado = grande ? 40 : 32;
  const folga = (44 - lado) / 2;

  const botao = (icone: 'minus' | 'plus', aoTocar: () => void, habilitado: boolean, rotulo: string) => (
    <Pressable
      onPress={aoTocar}
      disabled={!habilitado}
      hitSlop={folga}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: !habilitado }}
      style={({ pressed }) => [
        styles.botao,
        { width: lado, height: lado, borderRadius: grande ? 12 : 10, backgroundColor: cores.surface2 },
        (!habilitado || pressed) && { opacity: habilitado ? 0.7 : 0.35 },
      ]}>
      <IconSymbol name={icone} size={grande ? 20 : 18} color={cores.text} />
    </Pressable>
  );

  return (
    <View
      style={[styles.linha, grande && styles.linhaGrande]}
      accessible={false}>
      {botao('minus', aoDiminuir, podeDiminuir, `Diminuir ${rotuloAcessivel}`)}
      <Texto
        mono
        peso={600}
        tamanho={grande ? 34 : 15}
        style={grande ? { letterSpacing: -1 } : undefined}
        accessibilityLabel={`${rotuloAcessivel}: ${valorTexto}`}
        accessibilityRole="adjustable"
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment' && podeAumentar) aoAumentar();
          if (e.nativeEvent.actionName === 'decrement' && podeDiminuir) aoDiminuir();
        }}>
        {valorTexto}
      </Texto>
      {botao('plus', aoAumentar, podeAumentar, `Aumentar ${rotuloAcessivel}`)}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  linhaGrande: { justifyContent: 'space-between', flex: 1 },
  botao: { alignItems: 'center', justifyContent: 'center' },
});
