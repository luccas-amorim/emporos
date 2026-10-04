import React, { useMemo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { estiloCampo } from '@/components/comparar/estilos-campo';
import { Cartao } from '@/components/ui/cartao';
import { LIMITE_ESCALA_FONTE, Texto } from '@/components/ui/texto';
import { useTema } from '@/hooks/use-tema';

// Viagem: quanto do imposto local volta ao bolso (informado pelo usuário).
export function CartaoTaxFree({ valor, aoMudar }: { valor: string; aoMudar: (texto: string) => void }) {
  const { cores } = useTema();
  const estilo = useMemo(() => estiloCampo(cores, true, 15, 600), [cores]);

  return (
    <Cartao style={styles.cartao}>
      <View style={styles.textos}>
        <Texto tamanho={14} peso={500}>
          Tax free que você recupera
        </Texto>
        <Texto variante="rotulo">O que volta ao bolso, não a alíquota cheia</Texto>
      </View>
      <View style={styles.valor}>
        <TextInput
          style={[estilo, styles.campo]}
          value={valor}
          onChangeText={aoMudar}
          placeholder="0"
          placeholderTextColor={cores.textSubtle}
          keyboardType="decimal-pad"
          maxLength={5}
          maxFontSizeMultiplier={LIMITE_ESCALA_FONTE}
          accessibilityLabel="Percentual de tax free que você espera recuperar"
        />
        <Texto mono tamanho={15} peso={600}>
          %
        </Texto>
      </View>
    </Cartao>
  );
}

const styles = StyleSheet.create({
  cartao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  textos: { flex: 1, gap: 2 },
  valor: { flexDirection: 'row', alignItems: 'center' },
  campo: { minWidth: 28, minHeight: 44, textAlign: 'right' },
});
