import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Cartao } from '@/components/ui/cartao';
import { Texto } from '@/components/ui/texto';
import { formatarBRL } from '@/core/formato';
import type { Barra } from '@/core/resultado';
import { useTema } from '@/hooks/use-tema';

// As duas opções lado a lado: a mais cara ocupa a barra inteira.
export function BarrasComparacao({ barras }: { barras: Barra[] }) {
  const { cores } = useTema();

  return (
    <Cartao style={styles.cartao}>
      {barras.map((barra) => (
        <View
          key={barra.sentido}
          style={styles.item}
          accessible
          accessibilityLabel={`${barra.rotulo}: ${formatarBRL(barra.valor)}`}>
          <View style={styles.topo}>
            <Texto tamanho={13} cor="textMuted" style={{ flexShrink: 1 }}>
              {barra.rotulo}
            </Texto>
            <Texto mono tamanho={13} peso={600}>
              {formatarBRL(barra.valor)}
            </Texto>
          </View>
          <View style={[styles.trilho, { backgroundColor: cores.surface2 }]}>
            <View
              style={[
                styles.preenchimento,
                {
                  width: `${Math.max(2, Math.round(barra.proporcao * 100))}%`,
                  backgroundColor: barra.sentido === 'brasil' ? cores.brasil : cores.exterior,
                },
              ]}
            />
          </View>
        </View>
      ))}
    </Cartao>
  );
}

const styles = StyleSheet.create({
  cartao: { padding: 16, gap: 12 },
  item: { gap: 7 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  trilho: { height: 10, borderRadius: 5, overflow: 'hidden' },
  preenchimento: { height: '100%', borderRadius: 5 },
});
