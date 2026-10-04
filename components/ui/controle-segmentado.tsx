import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Texto } from '@/components/ui/texto';
import type { Paleta } from '@/constants/theme';
import { useTema } from '@/hooks/use-tema';

export interface OpcaoSegmento<T extends string | number> {
  valor: T;
  rotulo: string;
  accessibilityLabel?: string;
}

interface ControleSegmentadoProps<T extends string | number> {
  opcoes: OpcaoSegmento<T>[];
  valor: T;
  aoMudar: (valor: T) => void;
  /** Valores em Geist Mono (alíquotas, códigos de moeda). */
  mono?: boolean;
  /** Versão compacta, para cabeçalhos (ex.: USD/EUR/GBP no Câmbio). */
  compacto?: boolean;
}

// Escolha exclusiva num trilho: o item ativo vira um card sobre o surface2.
export function ControleSegmentado<T extends string | number>({
  opcoes,
  valor,
  aoMudar,
  mono,
  compacto,
}: ControleSegmentadoProps<T>) {
  const { cores } = useTema();
  const styles = useMemo(() => criarStyles(cores), [cores]);

  return (
    <View style={[styles.trilho, compacto && styles.trilhoCompacto]} accessibilityRole="radiogroup">
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === valor;
        return (
          <Pressable
            key={String(opcao.valor)}
            style={[styles.item, compacto && styles.itemCompacto, ativo && styles.itemAtivo]}
            onPress={() => aoMudar(opcao.valor)}
            accessibilityRole="button"
            accessibilityLabel={opcao.accessibilityLabel ?? opcao.rotulo}
            accessibilityState={{ selected: ativo }}
            hitSlop={compacto ? 6 : undefined}>
            <Texto
              tamanho={compacto ? 12 : 14}
              mono={mono}
              peso={ativo ? 600 : 400}
              cor={ativo ? 'text' : compacto ? 'textSubtle' : 'textMuted'}
              numberOfLines={1}>
              {opcao.rotulo}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

function criarStyles(cores: Paleta) {
  return StyleSheet.create({
    trilho: { flexDirection: 'row', gap: 3, padding: 3, borderRadius: 13, backgroundColor: cores.surface2 },
    trilhoCompacto: { gap: 2, borderRadius: 12 },
    item: { flex: 1, minHeight: 38, paddingHorizontal: 8, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    itemCompacto: { flex: 0, minHeight: 30, paddingHorizontal: 9, borderRadius: 9 },
    itemAtivo: { backgroundColor: cores.card },
  });
}
