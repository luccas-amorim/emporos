import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Texto } from '@/components/ui/texto';
import { formatarBRL, formatarNumeroBR } from '@/core/formato';
import type { LinhaRecibo } from '@/core/resultado';
import { useTema } from '@/hooks/use-tema';

// "De onde vem o custo de importar": rótulo com a regra · pontilhado · valor.
export function Recibo({ titulo, linhas }: { titulo: string; linhas: LinhaRecibo[] }) {
  const { cores } = useTema();

  return (
    <View style={styles.bloco}>
      <Texto variante="overline" accessibilityRole="header">
        {titulo}
      </Texto>
      {linhas.map((linha) => (
        <View
          key={linha.rotulo}
          style={styles.linha}
          accessible
          accessibilityLabel={`${linha.rotulo}: ${linha.credito ? 'menos ' : ''}${formatarBRL(Math.abs(linha.valor))}`}>
          <Texto tamanho={13} cor="textMuted" style={styles.rotulo}>
            {linha.rotulo}
          </Texto>
          <View style={[styles.pontilhado, { borderColor: cores.textSubtle }]} />
          <Texto mono tamanho={13} cor={linha.credito ? 'brasil' : 'text'}>
            {linha.credito ? '−' : ''}
            {formatarNumeroBR(Math.abs(linha.valor))}
          </Texto>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: 8 },
  linha: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  rotulo: { flexShrink: 1 },
  pontilhado: { flex: 1, minWidth: 12, borderBottomWidth: 1, borderStyle: 'dotted', opacity: 0.5, marginBottom: 4 },
});
