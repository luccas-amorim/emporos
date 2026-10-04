import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Linking, Pressable, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CartaoSimulacao } from '@/components/historico/cartao-simulacao';
import { Botao } from '@/components/ui/botao';
import { Cartao } from '@/components/ui/cartao';
import { Sheet } from '@/components/ui/sheet';
import { Texto } from '@/components/ui/texto';
import { CODIGOS_MOEDA, moedaPorCodigo } from '@/constants/currencies';
import type { Paleta } from '@/constants/theme';
import { textoCompartilhamento } from '@/core/compartilhamento';
import { resumoMudancas, type SimulacaoRecalculada } from '@/core/historico';
import {
  paramsRecalculo,
  recarregarHistorico,
  useHistoricoRecalculado,
  useHistoricoSimulacoes,
} from '@/hooks/use-historico-simulacoes';
import { definirSimulacaoAtual } from '@/hooks/use-simulacao-atual';
import { useTema } from '@/hooks/use-tema';
import { carregarDadosMercado, type DadosMercado } from '@/services/mercado';

// Tela 04: o histórico refeito com o câmbio de hoje, destacando o que mudou de lado.
export default function HistoricoScreen() {
  const { cores } = useTema();
  const styles = useMemo(() => criarStyles(cores), [cores]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { historico, carregando, removerSimulacao, limparHistorico } = useHistoricoSimulacoes();
  const [dados, setDados] = useState<DadosMercado | null>(null);
  const [acoes, setAcoes] = useState<SimulacaoRecalculada | null>(null);
  const [confirmarLimpeza, setConfirmarLimpeza] = useState(false);
  const recalculadas = useHistoricoRecalculado(dados);

  // Ao focar a aba: relê o histórico e busca a cotação de hoje.
  useFocusEffect(
    useCallback(() => {
      recarregarHistorico();
      carregarDadosMercado(CODIGOS_MOEDA).then(setDados);
    }, [])
  );

  const resumo = recalculadas ? resumoMudancas(recalculadas, (m) => moedaPorCodigo(m).nomeFrase) : null;

  const abrir = (r: SimulacaoRecalculada) => {
    if (!dados) return;
    const { id: _id, data: _data, valeImportar: _v, custoBR: _b, custoExt: _e, economia: _ec, ...registro } = r.item;
    definirSimulacaoAtual({
      entrada: r.entrada,
      registro: { ...registro, cotacao: r.entrada.cotacao, selicAnual: dados.selicAnual },
      resultado: r.resultado,
      dados,
      moeda: r.item.moeda,
      salvaComo: r.item.id,
    });
    router.push('/resultado');
  };

  const editar = (r: SimulacaoRecalculada) => {
    setAcoes(null);
    router.push({ pathname: '/', params: { prefill: String(Date.now()), ...paramsRecalculo(r.item) } });
  };

  const compartilhar = async (r: SimulacaoRecalculada) => {
    setAcoes(null);
    try {
      await Share.share({ message: textoCompartilhamento({ ...r.resultado, nomeProduto: r.item.nomeProduto }) });
    } catch {
      // usuário cancelou o share
    }
  };

  const offline = dados && dados.origem !== 'rede';

  return (
    <View style={styles.tela}>
      <FlatList
        data={recalculadas ?? []}
        keyExtractor={(r) => r.item.id}
        contentContainerStyle={[styles.conteudo, { paddingTop: insets.top + 10 }]}
        ListHeaderComponent={
          <View style={styles.cabeca}>
            <View style={styles.titulos}>
              <View style={styles.linhaTitulo}>
                <Texto variante="tituloAba" accessibilityRole="header">
                  Histórico
                </Texto>
                {historico.length > 0 ? (
                  <Pressable
                    onPress={() => setConfirmarLimpeza(true)}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel="Limpar todo o histórico">
                    <Texto tamanho={13} cor="textSubtle">
                      Limpar
                    </Texto>
                  </Pressable>
                ) : null}
              </View>
              {historico.length > 0 ? (
                <Texto tamanho={13} cor="textSubtle">
                  {offline ? 'Recalculado com a última cotação salva' : 'Recalculado com o câmbio de hoje'}
                </Texto>
              ) : null}
            </View>
            {resumo ? (
              <Cartao tom={resumo.sentido} raio={18} style={{ gap: 4 }} accessibilityRole="summary">
                <Texto tamanho={14} peso={600} cor={resumo.sentido}>
                  {resumo.titulo}
                </Texto>
                <Texto tamanho={13} style={{ lineHeight: 18 }}>
                  {resumo.texto}
                </Texto>
              </Cartao>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !carregando && historico.length === 0 ? (
            <Texto tamanho={14} cor="textMuted" style={styles.vazio}>
              Nenhuma simulação salva ainda. Compare na aba Comparar e toque em Salvar.
            </Texto>
          ) : null
        }
        renderItem={({ item }) => (
          <CartaoSimulacao simulacao={item} aoAbrir={() => abrir(item)} aoMaisAcoes={() => setAcoes(item)} />
        )}
      />

      <Sheet visivel={!!acoes} aoFechar={() => setAcoes(null)} titulo={acoes?.item.nomeProduto?.trim() || 'Simulação'}>
        {acoes ? (
          <View style={[styles.grupo, { backgroundColor: cores.card, borderColor: cores.border }]}>
            <LinhaAcao rotulo="Editar na Comparar" acessivel="Recalcular esta simulação com a cotação de hoje" aoTocar={() => editar(acoes)} />
            <LinhaAcao rotulo="Compartilhar" acessivel="Compartilhar esta simulação" aoTocar={() => compartilhar(acoes)} divisor />
            {acoes.item.link ? (
              <LinhaAcao
                rotulo="Abrir o link do produto"
                acessivel="Abrir link do produto"
                aoTocar={() => Linking.openURL(acoes.item.link!)}
                divisor
              />
            ) : null}
            <LinhaAcao
              rotulo="Excluir"
              acessivel="Excluir esta simulação"
              perigo
              divisor
              aoTocar={() => {
                removerSimulacao(acoes.item.id);
                setAcoes(null);
              }}
            />
          </View>
        ) : null}
      </Sheet>

      <Sheet
        visivel={confirmarLimpeza}
        aoFechar={() => setConfirmarLimpeza(false)}
        titulo="Limpar o histórico?"
        subtitulo="As simulações salvas somem deste aparelho. Os alertas de câmbio continuam."
        rodape={
          <View style={{ gap: 10 }}>
            <Botao
              titulo={`Apagar ${historico.length} ${historico.length === 1 ? 'simulação' : 'simulações'}`}
              accessibilityLabel="Confirmar limpeza do histórico"
              aoTocar={() => {
                limparHistorico();
                setConfirmarLimpeza(false);
              }}
            />
            <Botao titulo="Cancelar" variante="secundario" aoTocar={() => setConfirmarLimpeza(false)} />
          </View>
        }>
        <View />
      </Sheet>
    </View>
  );
}

function LinhaAcao({
  rotulo,
  acessivel,
  aoTocar,
  perigo,
  divisor,
}: {
  rotulo: string;
  acessivel: string;
  aoTocar: () => void;
  perigo?: boolean;
  divisor?: boolean;
}) {
  const { cores } = useTema();
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityLabel={acessivel}
      style={({ pressed }) => [
        { minHeight: 48, justifyContent: 'center', paddingHorizontal: 14 },
        divisor && { borderTopWidth: 1, borderTopColor: cores.border },
        pressed && { backgroundColor: cores.surface2 },
      ]}>
      <Texto tamanho={15} cor={perigo ? 'danger' : 'text'}>
        {rotulo}
      </Texto>
    </Pressable>
  );
}

function criarStyles(cores: Paleta) {
  return StyleSheet.create({
    tela: { flex: 1, backgroundColor: cores.background },
    conteudo: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
    cabeca: { gap: 14, marginBottom: 4 },
    titulos: { gap: 4, paddingHorizontal: 4 },
    linhaTitulo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    vazio: { textAlign: 'center', marginTop: 40, paddingHorizontal: 20, lineHeight: 20 },
    grupo: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  });
}
