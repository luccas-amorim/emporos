import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { Texto } from '@/components/ui/texto';
import { type Premissas, rotulosPremissas, type SituacaoCota } from '@/core/premissas';

interface ChipsPremissasProps {
  premissas: Premissas;
  /** Só em Viagem: se o preço cabe na cota de bagagem. */
  cota?: SituacaoCota | null;
  aoAjustar: () => void;
}

// "Premissas · Ajustar": padrões sensatos à vista, ajuste num sheet.
export function ChipsPremissas({ premissas, cota, aoAjustar }: ChipsPremissasProps) {
  return (
    <View style={styles.bloco}>
      <View style={styles.topo}>
        <Texto variante="rotulo">Premissas</Texto>
        <Pressable onPress={aoAjustar} hitSlop={12} accessibilityRole="button" accessibilityLabel="Ajustar premissas">
          <Texto tamanho={12} peso={600}>
            Ajustar
          </Texto>
        </Pressable>
      </View>
      <View style={styles.chips}>
        {rotulosPremissas(premissas).map((rotulo) => (
          <Chip key={rotulo} rotulo={rotulo} aoTocar={aoAjustar} accessibilityLabel={`${rotulo}. Toque para ajustar.`} />
        ))}
        {cota ? <Chip rotulo={cota.rotulo} tom={cota.dentro ? 'brasil' : 'aviso'} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: 10, paddingHorizontal: 4, paddingTop: 2 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
