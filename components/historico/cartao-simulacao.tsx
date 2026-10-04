import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { estiloCartao } from '@/components/ui/cartao';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Texto } from '@/components/ui/texto';
import type { Paleta } from '@/constants/theme';
import type { Veredito } from '@/core/calculadora';
import { rotuloData, rotuloVereditoCurto, type SimulacaoRecalculada } from '@/core/historico';
import { useTema } from '@/hooks/use-tema';

function corDoVeredito(veredito: Veredito): keyof Paleta {
  return veredito === 'brasil' ? 'brasil' : veredito === 'exterior' ? 'exterior' : 'textMuted';
}

interface CartaoSimulacaoProps {
  simulacao: SimulacaoRecalculada;
  aoAbrir: () => void;
  aoMaisAcoes: () => void;
}

// Card do Histórico: veredito de hoje à direita; se inverteu, "Na época" × "Hoje".
export function CartaoSimulacao({ simulacao, aoAbrir, aoMaisAcoes }: CartaoSimulacaoProps) {
  const { cores } = useTema();
  const { item, resultado, vereditoAtual, vereditoOriginal, mudou } = simulacao;
  const nome = item.nomeProduto?.trim() || (item.cenario === 'Encomenda' ? 'Encomenda' : 'Compra em viagem');
  const meta = `${item.cenario ?? 'Viagem'} · ${item.moeda} · ${rotuloData(item.data)}`;
  const hoje = rotuloVereditoCurto(vereditoAtual, resultado.economia);
  const naEpoca = rotuloVereditoCurto(vereditoOriginal, item.economia);

  return (
    <Pressable
      onPress={aoAbrir}
      accessibilityRole="button"
      accessibilityLabel={`${nome}, ${meta}. Hoje: ${hoje}${mudou ? `. Mudou: na época era ${naEpoca}` : ''}. Toque para ver a conta.`}
      accessibilityActions={[{ name: 'mais', label: 'Mais ações desta simulação' }]}
      onAccessibilityAction={(e) => e.nativeEvent.actionName === 'mais' && aoMaisAcoes()}
      style={({ pressed }) => [
        estiloCartao(cores, { raio: 18, destaque: mudou ? corDoVeredito(vereditoAtual) : undefined }),
        styles.cartao,
        pressed && { opacity: 0.75 },
      ]}>
      <View style={styles.topo}>
        <View style={styles.textos}>
          <Texto tamanho={15} peso={600} numberOfLines={1}>
            {nome}
          </Texto>
          <Texto variante="rotulo">{meta}</Texto>
        </View>
        {mudou ? (
          <View style={[styles.pill, { backgroundColor: cores[vereditoAtual === 'exterior' ? 'exteriorSoft' : 'brasilSoft'] }]}>
            <Texto tamanho={11} peso={600} cor={corDoVeredito(vereditoAtual)}>
              Mudou
            </Texto>
          </View>
        ) : (
          <Texto mono tamanho={13} cor={corDoVeredito(vereditoAtual)}>
            {hoje}
          </Texto>
        )}
        <Pressable
          onPress={aoMaisAcoes}
          hitSlop={10}
          style={styles.mais}
          accessibilityRole="button"
          accessibilityLabel={`Mais ações: ${nome}`}>
          <IconSymbol name="ellipsis" size={18} color={cores.textSubtle} />
        </Pressable>
      </View>

      {mudou ? (
        <View style={styles.colunas}>
          <View style={styles.coluna}>
            <Texto variante="rotulo">Na época</Texto>
            <Texto mono tamanho={13} cor={corDoVeredito(vereditoOriginal)}>
              {naEpoca}
            </Texto>
          </View>
          <View style={styles.coluna}>
            <Texto variante="rotulo">Hoje</Texto>
            <Texto mono tamanho={13} peso={600} cor={corDoVeredito(vereditoAtual)}>
              {hoje}
            </Texto>
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cartao: { gap: 10 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  textos: { flex: 1, gap: 2 },
  pill: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999 },
  mais: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginRight: -6 },
  colunas: { flexDirection: 'row', gap: 8 },
  coluna: { flex: 1, gap: 2 },
});
