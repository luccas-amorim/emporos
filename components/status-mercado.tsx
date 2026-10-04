import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FlagIcon } from '@/components/flag-icon';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { type CurrencyCode, moedaPorCodigo, parStatus } from '@/constants/currencies';
import type { Paleta } from '@/constants/theme';
import { formatarCotacaoBR, formatarPct } from '@/core/formato';
import { useTema } from '@/hooks/use-tema';
import { type DadosMercado, descreverIdade } from '@/services/mercado';

interface StatusMercadoProps {
  dados: DadosMercado;
  moeda: CurrencyCode;
}

// Cotações do par em uso + Selic, com a idade do dado (rede, cache ou referência).
export function StatusMercado({ dados, moeda }: StatusMercadoProps) {
  const { cores } = useTema();
  const styles = useMemo(() => criarStyles(cores), [cores]);

  return (
    <>
      <View style={styles.box}>
        {parStatus(moeda).map((codigo) => (
          <View key={codigo} style={styles.coluna}>
            <View style={styles.rotuloLinha}>
              <FlagIcon code={moedaPorCodigo(codigo).bandeira} size={12} />
              <Text style={styles.rotulo}> {codigo}</Text>
            </View>
            <Text style={styles.valor}>{formatarCotacaoBR(dados.cotacoes[codigo])}</Text>
          </View>
        ))}
        <View style={[styles.coluna, { borderRightWidth: 0 }]}>
          <View style={styles.rotuloLinha}>
            <IconSymbol name="chart.line.uptrend.xyaxis" size={12} color={cores.textMuted} />
            <Text style={styles.rotulo}> SELIC</Text>
          </View>
          <Text style={styles.valor}>{formatarPct(dados.selicAnual, 2)} a.a.</Text>
        </View>
      </View>
      <View style={styles.idadeLinha}>
        {dados.origem !== 'rede' && <IconSymbol name="wifi.slash" size={12} color={cores.warn} />}
        <Text style={[styles.idade, dados.origem !== 'rede' && { color: cores.warn }]}>
          {dados.origem === 'rede'
            ? `Cotação atualizada ${descreverIdade(dados.atualizadoEm)}`
            : dados.origem === 'cache'
              ? `Sem conexão — usando cotação salva ${descreverIdade(dados.atualizadoEm)}`
              : 'Sem conexão — usando valores de referência. Puxe para atualizar.'}
        </Text>
      </View>
    </>
  );
}

function criarStyles(cores: Paleta) {
  return StyleSheet.create({
    box: { flexDirection: 'row', backgroundColor: cores.card, borderRadius: 18, marginBottom: 6, borderWidth: 1, borderColor: cores.border, overflow: 'hidden', width: '100%' },
    coluna: { flex: 1, alignItems: 'center', padding: 10, borderRightWidth: 1, borderRightColor: cores.borderSoft },
    rotuloLinha: { flexDirection: 'row', alignItems: 'center' },
    rotulo: { fontSize: 10, color: cores.subtext, fontWeight: 'bold', textTransform: 'uppercase' },
    valor: { fontSize: 13, color: cores.text, fontWeight: 'bold', marginTop: 2 },
    idadeLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 12, width: '100%' },
    idade: { fontSize: 11, color: cores.muted, textAlign: 'center' },
  });
}
