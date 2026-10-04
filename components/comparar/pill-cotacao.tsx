import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Texto } from '@/components/ui/texto';
import type { CurrencyCode } from '@/constants/currencies';
import { formatarCotacaoBR } from '@/core/formato';
import { useTema } from '@/hooks/use-tema';
import { cotacaoDesatualizada, type DadosMercado, descreverIdade } from '@/services/mercado';

// "USD 5,42 · há 3 min". Em âmbar quando a cotação é do cache, da referência ou velha.
export function PillCotacao({ dados, moeda }: { dados: DadosMercado; moeda: CurrencyCode }) {
  const { cores } = useTema();
  const velha = cotacaoDesatualizada(dados);
  const valor = formatarCotacaoBR(dados.cotacoes[moeda]).replace('R$ ', '');
  const idade = dados.origem === 'padrao' ? 'referência' : descreverIdade(dados.atualizadoEm);
  const texto = `${moeda} ${valor} · ${idade}`;

  return (
    <View
      style={[
        styles.pill,
        velha
          ? { backgroundColor: cores.warnSoft, borderColor: cores.warnSoft }
          : { backgroundColor: cores.card, borderColor: cores.border },
      ]}
      accessible
      accessibilityLabel={`Cotação: ${moeda} a ${formatarCotacaoBR(dados.cotacoes[moeda])}, ${idade}${velha ? ', desatualizada' : ''}`}>
      <View style={[styles.ponto, { backgroundColor: velha ? cores.warn : cores.brasil }]} />
      <Texto mono tamanho={11} peso={velha ? 600 : 400} cor={velha ? 'warn' : 'textMuted'}>
        {texto}
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1 },
  ponto: { width: 6, height: 6, borderRadius: 3 },
});
