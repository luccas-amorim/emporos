import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GraficoCambio } from '@/components/cambio/grafico-cambio';
import { ListaAlertas } from '@/components/cambio/lista-alertas';
import { SheetNovoAlerta } from '@/components/cambio/sheet-novo-alerta';
import { Cartao } from '@/components/ui/cartao';
import { ControleSegmentado } from '@/components/ui/controle-segmentado';
import { Texto } from '@/components/ui/texto';
import { CODIGOS_MOEDA, type CurrencyCode, moedaPorCodigo } from '@/constants/currencies';
import { ALERTAS_CAMBIO_ATIVO } from '@/constants/feature-flags';
import type { Paleta } from '@/constants/theme';
import {
  AVISO_COMPARACAO,
  diferencaPelaMedia,
  fraseImpacto,
  insightCambio,
  mediaMinMax,
  rotuloVariacao,
  variacaoDoDia,
} from '@/core/cambio';
import { formatarCotacaoBR } from '@/core/formato';
import { useAlertasCambio } from '@/hooks/use-alertas-cambio';
import { pontoDeViradaSalvo, ultimaSimulacaoNaMoeda, useHistoricoSimulacoes } from '@/hooks/use-historico-simulacoes';
import { useSerieCambio } from '@/hooks/use-serie-cambio';
import { useTema } from '@/hooks/use-tema';
import type { AlertaCambio } from '@/services/alertas';
import { carregarDadosMercado, type DadosMercado } from '@/services/mercado';

const MOEDAS_ABA: CurrencyCode[] = ['USD', 'EUR', 'GBP'];

// Tela 05: cotação, 90 dias com a média, insight comparativo e alertas.
export default function Cambio() {
  const { cores } = useTema();
  const styles = useMemo(() => criarStyles(cores), [cores]);
  const insets = useSafeAreaInsets();
  const [moeda, setMoeda] = useState<CurrencyCode>('USD');
  const [dados, setDados] = useState<DadosMercado | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [sheet, setSheet] = useState<{ editando: AlertaCambio | null } | null>(null);
  const { serie, carregando: carregandoSerie, recarregar } = useSerieCambio(moeda);
  const { historico } = useHistoricoSimulacoes();
  const { alertas, carregando, editarAlerta, sincronizarComCotacoes } = useAlertasCambio();

  const buscarDados = useCallback(async () => {
    setDados(await carregarDadosMercado(CODIGOS_MOEDA));
  }, []);

  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  // Com o app aberto, o alerta que já está no alvo aparece aqui e não vira notificação.
  useEffect(() => {
    if (!carregando && dados) sincronizarComCotacoes(dados.cotacoes);
  }, [carregando, dados, alertas.length, sincronizarComCotacoes]);

  const aoAtualizar = async () => {
    setAtualizando(true);
    await Promise.all([buscarDados(), recarregar()]);
    setAtualizando(false);
  };

  const info = moedaPorCodigo(moeda);
  const atual = dados?.cotacoes[moeda];
  const pontos = serie?.pontos ?? [];
  const stats = mediaMinMax(pontos);
  const variacao = variacaoDoDia(pontos);
  const insight = atual !== undefined && stats ? insightCambio(atual, stats.media, info.nomeFrase) : null;
  const simulacao = ultimaSimulacaoNaMoeda(historico, moeda);
  const impacto =
    simulacao && atual !== undefined && stats
      ? fraseImpacto(simulacao.nomeProduto, diferencaPelaMedia(simulacao.custoExt, simulacao.cotacao!, atual, stats.media))
      : null;
  const sugestao = simulacao ? pontoDeViradaSalvo(simulacao) : null;

  return (
    <View style={styles.tela}>
      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingTop: insets.top + 10 }]}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={cores.textSubtle} />}>
        <View style={styles.cabecalho}>
          <Texto variante="tituloAba" accessibilityRole="header">
            Câmbio
          </Texto>
          <ControleSegmentado
            compacto
            mono
            opcoes={MOEDAS_ABA.map((codigo) => ({
              valor: codigo,
              rotulo: codigo,
              accessibilityLabel: moedaPorCodigo(codigo).nome,
            }))}
            valor={moeda}
            aoMudar={setMoeda}
          />
        </View>

        <View style={styles.cotacao}>
          {atual !== undefined ? (
            <Texto mono tamanho={42} peso={600} style={styles.valorGrande} accessibilityLabel={`${info.nome}: ${formatarCotacaoBR(atual)}`}>
              {formatarCotacaoBR(atual)}
            </Texto>
          ) : (
            <ActivityIndicator color={cores.textSubtle} style={styles.carregando} />
          )}
          <Texto tamanho={13} cor="textSubtle">
            {variacao !== null ? (
              <Texto tamanho={13} peso={600} cor={variacao < 0 ? 'brasil' : 'warn'}>
                {rotuloVariacao(variacao)}
              </Texto>
            ) : null}
            {variacao !== null ? ' · ' : ''}comercial · AwesomeAPI
          </Texto>
        </View>

        {pontos.length > 1 ? (
          <GraficoCambio pontos={pontos} />
        ) : !carregandoSerie ? (
          <Cartao tom="aviso" raio={18}>
            <Texto tamanho={13} style={{ lineHeight: 18 }}>
              Não deu para carregar o histórico de 90 dias. Puxe a tela para tentar de novo.
            </Texto>
          </Cartao>
        ) : null}

        {insight ? (
          <Cartao tom={insight.abaixo ? 'brasil' : insight.rotulo === 'Na média' ? 'apoio' : 'aviso'} style={{ gap: 5 }}>
            <Texto variante="overline" cor={insight.abaixo ? 'brasil' : insight.rotulo === 'Na média' ? 'textSubtle' : 'warn'}>
              {insight.rotulo}
            </Texto>
            <Texto tamanho={15} peso={600} style={{ lineHeight: 20 }}>
              {insight.titulo}
            </Texto>
            <Texto tamanho={12.5} cor="textMuted" style={{ lineHeight: 18 }}>
              {impacto ? `${impacto} ` : ''}
              {AVISO_COMPARACAO}
            </Texto>
          </Cartao>
        ) : null}

        {ALERTAS_CAMBIO_ATIVO && (
          <>
            <View style={styles.tituloAlertas}>
              <Texto tamanho={15} peso={600} accessibilityRole="header">
                Alertas
              </Texto>
              <Pressable
                onPress={() => setSheet({ editando: null })}
                disabled={atual === undefined}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Novo alerta">
                <Texto tamanho={13} peso={600} cor="textMuted">
                  + Novo
                </Texto>
              </Pressable>
            </View>
            <ListaAlertas
              alertas={alertas}
              cotacoes={dados?.cotacoes ?? null}
              aoAlternar={(alerta, ativo) => editarAlerta(alerta.id, { ativo })}
              aoEditar={(alerta) => setSheet({ editando: alerta })}
            />
          </>
        )}
      </ScrollView>

      {atual !== undefined || sheet?.editando ? (
        <SheetNovoAlerta
          visivel={!!sheet}
          aoFechar={() => setSheet(null)}
          moeda={sheet?.editando?.moeda ?? moeda}
          cotacaoHoje={dados?.cotacoes[sheet?.editando?.moeda ?? moeda] ?? atual ?? 0}
          sugestao={sugestao ? { valor: sugestao, nomeProduto: simulacao?.nomeProduto } : null}
          origem={simulacao?.id}
          editando={sheet?.editando ?? null}
        />
      ) : null}
    </View>
  );
}

function criarStyles(cores: Paleta) {
  return StyleSheet.create({
    tela: { flex: 1, backgroundColor: cores.background },
    conteudo: { paddingHorizontal: 16, paddingBottom: 24, gap: 14 },
    cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
    cotacao: { gap: 2, paddingHorizontal: 4 },
    valorGrande: { letterSpacing: -1.7, lineHeight: 50 },
    carregando: { alignSelf: 'flex-start', height: 50 },
    tituloAlertas: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, paddingTop: 2 },
  });
}
