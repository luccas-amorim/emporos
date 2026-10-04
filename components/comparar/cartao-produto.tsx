import React, { useMemo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { estiloCampo } from '@/components/comparar/estilos-campo';
import { Cartao } from '@/components/ui/cartao';
import { LIMITE_ESCALA_FONTE, Texto } from '@/components/ui/texto';
import { useTema } from '@/hooks/use-tema';

interface CartaoProdutoProps {
  nome: string;
  observacao: string;
  aoMudarNome: (nome: string) => void;
  aoMudarObservacao: (observacao: string) => void;
}

// Nome do produto (opcional) e uma observação curta, que vão junto para o histórico.
export function CartaoProduto({ nome, observacao, aoMudarNome, aoMudarObservacao }: CartaoProdutoProps) {
  const { cores } = useTema();
  const estiloNome = useMemo(() => estiloCampo(cores, false, 15, 600), [cores]);
  const estiloObs = useMemo(() => estiloCampo(cores, false, 13), [cores]);

  return (
    <Cartao style={{ gap: 4 }}>
      <Texto variante="rotulo">Produto</Texto>
      <TextInput
        style={[estiloNome, styles.campo]}
        value={nome}
        onChangeText={aoMudarNome}
        placeholder="Nome do produto (opcional)"
        placeholderTextColor={cores.textSubtle}
        maxFontSizeMultiplier={LIMITE_ESCALA_FONTE}
        accessibilityLabel="Nome do produto (opcional)"
      />
      <View style={[styles.divisor, { backgroundColor: cores.border }]} />
      <TextInput
        style={[estiloObs, styles.campo]}
        value={observacao}
        onChangeText={aoMudarObservacao}
        placeholder="Observação: cor, cupom, vendedor…"
        placeholderTextColor={cores.textSubtle}
        maxLength={140}
        maxFontSizeMultiplier={LIMITE_ESCALA_FONTE}
        accessibilityLabel="Observação sobre a compra (opcional)"
      />
    </Cartao>
  );
}

const styles = StyleSheet.create({
  campo: { minHeight: 32 },
  divisor: { height: 1, marginVertical: 4 },
});
