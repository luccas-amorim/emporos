import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FlagIcon } from '@/components/flag-icon';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Texto } from '@/components/ui/texto';
import { type CurrencyCode, MOEDAS } from '@/constants/currencies';
import { useTema } from '@/hooks/use-tema';

// Seletor de moeda em lista agrupada (dentro de sheets). Único lugar com bandeira.
export function ListaMoedas({ valor, aoMudar }: { valor: CurrencyCode; aoMudar: (codigo: CurrencyCode) => void }) {
  const { cores } = useTema();

  return (
    <View style={[styles.grupo, { backgroundColor: cores.card, borderColor: cores.border }]} accessibilityRole="radiogroup">
      {MOEDAS.map((moeda, i) => {
        const ativa = moeda.code === valor;
        return (
          <Pressable
            key={moeda.code}
            onPress={() => aoMudar(moeda.code)}
            accessibilityRole="button"
            accessibilityLabel={`${moeda.nome}, ${moeda.code}`}
            accessibilityState={{ selected: ativa }}
            style={({ pressed }) => [
              styles.linha,
              i > 0 && { borderTopWidth: 1, borderTopColor: cores.border },
              pressed && { backgroundColor: cores.surface2 },
            ]}>
            <FlagIcon code={moeda.bandeira} size={18} />
            <Texto tamanho={15} peso={ativa ? 600 : 400} style={{ flex: 1 }}>
              {moeda.nome}
            </Texto>
            <Texto mono tamanho={12} cor="textSubtle">
              {moeda.code}
            </Texto>
            <View style={styles.marca}>{ativa ? <IconSymbol name="checkmark" size={16} color={cores.text} /> : null}</View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 14 },
  marca: { width: 18, alignItems: 'flex-end' },
});
