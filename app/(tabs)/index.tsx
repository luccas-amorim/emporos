import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BannerSemConexao } from '@/components/comparar/banner-sem-conexao';
import { CampoLink, type StatusLink } from '@/components/comparar/campo-link';
import { CartaoPreco } from '@/components/comparar/cartao-preco';
import { CartaoProduto } from '@/components/comparar/cartao-produto';
import { CartaoTaxFree } from '@/components/comparar/cartao-tax-free';
import { ChipsPremissas } from '@/components/comparar/chips-premissas';
import { PillCotacao } from '@/components/comparar/pill-cotacao';
import { SheetAjustes } from '@/components/comparar/sheet-ajustes';
import { SheetPremissas } from '@/components/comparar/sheet-premissas';
import { SheetPrecoBrasil, SheetPrecoExterior } from '@/components/comparar/sheet-precos';
import { Botao } from '@/components/ui/botao';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Texto } from '@/components/ui/texto';
import { CODIGOS_MOEDA, moedaPorCodigo } from '@/constants/currencies';
import type { Paleta } from '@/constants/theme';
import { calcularParidade, parseNumeroLocal } from '@/core/calculadora';
import { formatarBRL, formatarMoeda } from '@/core/formato';
import { normalizarUrl, type ProdutoLido } from '@/core/parser-produto';
import { situacaoCota } from '@/core/premissas';
import {
  type CamposFormulario,
  montarSimulacao,
  premissasDe,
  useFormularioCalculo,
  valoresNumericos,
} from '@/hooks/use-formulario-calculo';
import { definirSimulacaoAtual } from '@/hooks/use-simulacao-atual';
import { useTema } from '@/hooks/use-tema';
import { carregarDadosMercado, type DadosMercado } from '@/services/mercado';
import { lerProduto } from '@/services/produto';

type SheetAberto = 'premissas' | 'exterior' | 'brasil' | 'ajustes' | null;

function detalheExterior(campos: CamposFormulario): string {
  if (campos.cenario === 'Viagem') return 'na loja, sem frete';
  return `+ frete ${formatarMoeda(parseNumeroLocal(campos.freteExt), moedaPorCodigo(campos.moeda).simbolo)}`;
}

function detalheBrasil(campos: CamposFormulario): string {
  const { parcelas, precoBRTotal } = valoresNumericos(campos);
  if (precoBRTotal <= 0) return 'à vista ou parcelado';
  if (parcelas <= 1) return 'à vista';
  if (campos.modoBR === 'parcela') return `${parcelas}x · total ${formatarMoeda(precoBRTotal, 'R$')}`;
  return `${parcelas}x de ${formatarBRL(precoBRTotal / parcelas)}${campos.semJuros ? '' : ' com juros'}`;
}

// Tela 02/07: link, os dois preços e as premissas; "Comparar" abre o Resultado.
export default function Comparar() {
  const { cores } = useTema();
  const styles = useMemo(() => criarStyles(cores), [cores]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const { campos, definir, aplicarPrefill, aplicarPremissas } = useFormularioCalculo();

  const [dados, setDados] = useState<DadosMercado | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [sheet, setSheet] = useState<SheetAberto>(null);
  const [statusLink, setStatusLink] = useState<StatusLink>('idle');
  const [produtoLido, setProdutoLido] = useState<ProdutoLido | null>(null);
  // Link da leitura em curso: se o usuário trocar o link no meio, a resposta antiga é ignorada.
  const lendo = useRef<string | null>(null);
  const lidoPorUltimo = useRef<string | null>(null);

  const buscarDados = useCallback(async () => {
    setDados(await carregarDadosMercado(CODIGOS_MOEDA));
  }, []);

  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  // "Recalcular hoje", vindo do Histórico.
  useEffect(() => {
    if (!params.prefill) return;
    aplicarPrefill(params);
  }, [params.prefill]); // eslint-disable-line react-hooks/exhaustive-deps

  const aoAtualizar = useCallback(async () => {
    setAtualizando(true);
    await buscarDados();
    setAtualizando(false);
  }, [buscarDados]);

  const moeda = moedaPorCodigo(campos.moeda);
  const viagem = campos.cenario === 'Viagem';
  const simulacao = montarSimulacao(campos, dados);
  const premissas = premissasDe(campos);
  const cota =
    viagem && dados
      ? situacaoCota(parseNumeroLocal(campos.precoExt), dados.cotacoes[campos.moeda], dados.cotacoes.USD)
      : null;

  const comparar = () => {
    if (!simulacao || !dados) return;
    definirSimulacaoAtual({
      entrada: simulacao.entrada,
      registro: simulacao.registro,
      resultado: calcularParidade(simulacao.entrada),
      dados,
      moeda: campos.moeda,
    });
    router.push('/resultado');
  };

  const fechar = () => setSheet(null);

  // Lê a página no aparelho e preenche o que achar. Falhou: segue para o manual.
  const lerLink = async (texto: string) => {
    const url = normalizarUrl(texto);
    if (!url || url === lidoPorUltimo.current || lendo.current === url) return;
    lendo.current = url;
    lidoPorUltimo.current = url;
    setStatusLink('lendo');
    const leitura = await lerProduto(url);
    if (lendo.current !== url) return;
    lendo.current = null;
    const produto = leitura.produto ?? null;
    setProdutoLido(produto);
    if (produto?.nome) definir('nomeProduto', produto.nome);
    if (leitura.status === 'ok') {
      definir('precoExt', String(leitura.produto.preco));
      if (leitura.produto.moeda) definir('moeda', leitura.produto.moeda);
      setStatusLink('ok');
    } else {
      setStatusLink('falhou');
    }
  };

  const colar = async () => {
    const texto = (await Clipboard.getStringAsync().catch(() => '')).trim();
    if (!texto) return;
    const url = normalizarUrl(texto);
    definir('link', url ?? texto);
    if (url) lerLink(url);
  };

  const mudarLink = (texto: string) => {
    definir('link', texto);
    if (statusLink !== 'idle' && normalizarUrl(texto) !== lidoPorUltimo.current) {
      lendo.current = null;
      lidoPorUltimo.current = null;
      setStatusLink('idle');
      setProdutoLido(null);
    }
  };

  return (
    <View style={styles.tela}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.tela}>
        <ScrollView
          contentContainerStyle={[styles.conteudo, { paddingTop: insets.top + 10 }]}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={cores.textSubtle} />}>
          <View style={styles.cabecalho}>
            <Texto variante="tituloAba" accessibilityRole="header">
              Comparar
            </Texto>
            <View style={styles.cabecalhoDireita}>
              {dados ? <PillCotacao dados={dados} moeda={campos.moeda} /> : <ActivityIndicator color={cores.textSubtle} />}
              <Pressable
                onPress={() => setSheet('ajustes')}
                style={styles.botaoAjustes}
                accessibilityRole="button"
                accessibilityLabel="Ajustes">
                <IconSymbol name="gearshape" size={20} color={cores.textMuted} />
              </Pressable>
            </View>
          </View>

          {dados ? <BannerSemConexao dados={dados} /> : null}

          <CampoLink
            link={campos.link}
            status={statusLink}
            produto={produtoLido}
            nome={campos.nomeProduto}
            siteCertificado={campos.siteCertificado && campos.cenario === 'Encomenda'}
            aoMudarLink={mudarLink}
            aoMudarNome={(t) => definir('nomeProduto', t)}
            aoColar={colar}
            aoLer={() => lerLink(campos.link)}
          />
          <CartaoProduto
            mostrarNome={statusLink !== 'ok'}
            nome={campos.nomeProduto}
            observacao={campos.observacao}
            aoMudarNome={(t) => definir('nomeProduto', t)}
            aoMudarObservacao={(t) => definir('observacao', t)}
          />

          <View style={styles.grade}>
            <CartaoPreco
              rotulo="Lá fora"
              simbolo={moeda.simbolo}
              valor={campos.precoExt}
              aoMudar={(t) => definir('precoExt', t)}
              detalhe={detalheExterior(campos)}
              marca={campos.moeda}
              aoEditar={() => setSheet('exterior')}
              accessibilityLabel={`Preço no exterior em ${moeda.nome}`}
              rotuloEdicao="Editar moeda e frete"
              destacado={statusLink === 'falhou' && !campos.precoExt.trim()}
            />
            <CartaoPreco
              rotulo={campos.modoBR === 'parcela' ? 'No Brasil · parcela' : 'No Brasil'}
              simbolo="R$"
              valor={campos.valorBR}
              aoMudar={(t) => definir('valorBR', t)}
              detalhe={detalheBrasil(campos)}
              marca={valoresNumericos(campos).parcelas > 1 ? `${valoresNumericos(campos).parcelas}x` : 'à vista'}
              aoEditar={() => setSheet('brasil')}
              accessibilityLabel={
                campos.modoBR === 'parcela' ? 'Valor da parcela em reais' : 'Preço total no Brasil em reais'
              }
              rotuloEdicao="Editar parcelas"
            />
          </View>

          {viagem && <CartaoTaxFree valor={campos.taxFree} aoMudar={(t) => definir('taxFree', t)} />}

          <ChipsPremissas premissas={premissas} cota={cota} aoAjustar={() => setSheet('premissas')} />

        </ScrollView>

        <View style={styles.rodape}>
          {!simulacao && dados ? (
            <Texto variante="rotulo" style={styles.dica}>
              Preencha os dois preços para comparar.
            </Texto>
          ) : null}
          <Botao
            titulo="Comparar"
            aoTocar={comparar}
            desabilitado={!simulacao}
            accessibilityLabel="Calcular comparação"
          />
        </View>
      </KeyboardAvoidingView>

      <SheetPremissas
        visivel={sheet === 'premissas'}
        aoFechar={fechar}
        atuais={{ ...premissas, taxFree: campos.taxFree }}
        aoAplicar={aplicarPremissas}
      />
      <SheetPrecoExterior visivel={sheet === 'exterior'} aoFechar={fechar} campos={campos} definir={definir} />
      <SheetPrecoBrasil
        visivel={sheet === 'brasil'}
        aoFechar={fechar}
        campos={campos}
        definir={definir}
        selicMensal={dados?.selicMensal}
      />
      <SheetAjustes
        visivel={sheet === 'ajustes'}
        aoFechar={fechar}
        moeda={campos.moeda}
        aoMudarMoeda={(codigo) => definir('moeda', codigo)}
        icms={campos.icms}
        aoMudarIcms={(icms) => definir('icms', icms)}
      />
    </View>
  );
}

function criarStyles(cores: Paleta) {
  return StyleSheet.create({
    tela: { flex: 1, backgroundColor: cores.background },
    conteudo: { paddingHorizontal: 16, paddingBottom: 24, gap: 14 },
    cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
    cabecalhoDireita: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    botaoAjustes: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
    grade: { flexDirection: 'row', gap: 10 },
    rodape: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 8, backgroundColor: cores.background },
    dica: { textAlign: 'center' },
  });
}
