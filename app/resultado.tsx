import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SheetNovoAlerta } from '@/components/cambio/sheet-novo-alerta';
import { BarrasComparacao } from '@/components/resultado/barras-comparacao';
import { Recibo } from '@/components/resultado/recibo';
import { SheetFontes } from '@/components/resultado/sheet-fontes';
import { Botao } from '@/components/ui/botao';
import { Cartao } from '@/components/ui/cartao';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Texto } from '@/components/ui/texto';
import { moedaPorCodigo } from '@/constants/currencies';
import { ALERTAS_CAMBIO_ATIVO } from '@/constants/feature-flags';
import { REGRAS_FISCAIS, rotuloRevisao } from '@/constants/regras-fiscais';
import { AVISO_LEGAL } from '@/constants/textos';
import type { Paleta } from '@/constants/theme';
import { rotuloAliquota } from '@/core/calculadora';
import { textoCompartilhamento } from '@/core/compartilhamento';
import { formatarNumeroBR } from '@/core/formato';
import {
  barrasComparacao,
  contextoResultado,
  explicacaoValorPresente,
  type FraseDestacada,
  fraseApoio,
  linhasRecibo,
  sentidoDoVeredito,
  textoDaFrase,
  textoPontoDeVirada,
  tituloRecibo,
} from '@/core/resultado';
import { useHistoricoSimulacoes } from '@/hooks/use-historico-simulacoes';
import { marcarSimulacaoSalva, useSimulacaoAtual } from '@/hooks/use-simulacao-atual';
import { useTema } from '@/hooks/use-tema';

const ESPACO_FIXO = String.fromCharCode(0xa0);

/** Valor que não quebra entre o símbolo e o número ("R$ 4,74"). */
function semQuebra(texto: string): string {
  return texto.replace(/(R[$]|US[$]|€|£|¥) /g, (_, simbolo: string) => simbolo + ESPACO_FIXO);
}

function Frase({ frase, tamanho, cor }: { frase: FraseDestacada; tamanho: number; cor: 'textMuted' }) {
  return (
    <Texto tamanho={tamanho} cor={cor} style={{ lineHeight: Math.round(tamanho * 1.45) }}>
      {frase.antes}
      <Texto tamanho={tamanho} peso={600}>
        {semQuebra(frase.destaque)}
      </Texto>
      {frase.depois}
    </Texto>
  );
}

// Telas 03/08: o veredito ocupa a tela; o resto explica de onde ele vem.
export default function Resultado() {
  const { cores } = useTema();
  const styles = useMemo(() => criarStyles(cores), [cores]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const simulacao = useSimulacaoAtual();
  const { adicionarSimulacao } = useHistoricoSimulacoes();
  const [fontesVisiveis, setFontesVisiveis] = useState(false);
  const [alertaVisivel, setAlertaVisivel] = useState(false);
  const [alertaCriado, setAlertaCriado] = useState(false);

  const resultado = simulacao?.resultado;

  // O leitor de tela anuncia o veredito antes de qualquer outra coisa.
  useEffect(() => {
    if (!simulacao) return;
    const { entrada, resultado: r } = simulacao;
    AccessibilityInfo.announceForAccessibility(`${r.msg} ${textoDaFrase(fraseApoio(r, entrada.cenario, entrada.parcelasBR))}`);
  }, [simulacao?.resultado]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!simulacao || !resultado) return null;

  const { entrada, registro, dados } = simulacao;
  const moeda = moedaPorCodigo(simulacao.moeda);
  const viagem = entrada.cenario === 'Viagem';
  const sentido = sentidoDoVeredito(resultado.veredito);
  const vp = explicacaoValorPresente(entrada.precoBR, entrada.parcelasBR, entrada.selicMensal, resultado.custoBR);
  const virada = textoPontoDeVirada(resultado, entrada.cotacao, moeda);
  const salva = !!simulacao.salvaComo;
  // Em Viagem a compra é presencial e próxima: o primário é compartilhar. Na encomenda,
  // dá para esperar o câmbio, e o primário cria um alerta no ponto de virada.
  const oferecerAlerta = ALERTAS_CAMBIO_ATIVO && !viagem;
  const nomeMoeda = moeda.nomeFrase.replace(/^(o|a) /, '');

  const compartilhar = async () => {
    try {
      await Share.share({ message: textoCompartilhamento({ ...resultado, nomeProduto: registro.nomeProduto }) });
    } catch {
      // usuário cancelou o share — nada a fazer
    }
  };

  const salvar = () => {
    const id = adicionarSimulacao({
      ...registro,
      valeImportar: resultado.valeImportar,
      custoBR: resultado.custoBR,
      custoExt: resultado.custoExt,
      economia: resultado.economia,
    });
    marcarSimulacaoSalva(id);
  };

  return (
    <View style={styles.tela}>
      <View style={[styles.barraTopo, { paddingTop: insets.top + 6 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.voltar}
          accessibilityRole="button"
          accessibilityLabel="Voltar para Comparar">
          <IconSymbol name="chevron.left" size={16} color={cores.textMuted} />
          <Texto tamanho={15} cor="textMuted">
            Comparar
          </Texto>
        </Pressable>
        <Pressable onPress={compartilhar} hitSlop={10} accessibilityRole="button" accessibilityLabel="Compartilhar resultado">
          <Texto tamanho={15} peso={600}>
            Compartilhar
          </Texto>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.cabeca}>
          <Texto tamanho={13} cor="textSubtle">
            {contextoResultado(registro.nomeProduto, entrada.cenario)}
          </Texto>
          <Texto variante="veredito" cor={sentido ?? 'text'} accessibilityRole="header">
            {resultado.msg}
          </Texto>
          <Frase frase={fraseApoio(resultado, entrada.cenario, entrada.parcelasBR)} tamanho={15} cor="textMuted" />
        </View>

        <BarrasComparacao barras={barrasComparacao(resultado, entrada.cenario, entrada.parcelasBR)} />

        <Recibo titulo={tituloRecibo(entrada.cenario)} linhas={linhasRecibo(entrada, resultado, moeda)} />

        {resultado.avisos.map((aviso) => (
          <Cartao key={aviso} tom="aviso" raio={18} style={styles.aviso}>
            <IconSymbol name="exclamationmark.triangle" size={15} color={cores.warn} />
            <Texto tamanho={12.5} style={styles.avisoTexto}>
              {aviso}
            </Texto>
          </Cartao>
        ))}

        {vp ? (
          <Cartao tom="apoio" raio={18} style={styles.caixa}>
            <Texto tamanho={12.5} cor="textMuted" style={styles.caixaTexto}>
              <Texto tamanho={12.5} peso={600}>
                {vp.titulo}
              </Texto>{' '}
              {vp.texto}
            </Texto>
          </Cartao>
        ) : null}

        {virada ? (
          <Cartao tom="apoio" raio={18} style={[styles.caixa, { gap: 4 }]}>
            <Texto tamanho={13} peso={600}>
              Ponto de virada
            </Texto>
            <Texto tamanho={12.5} cor="textMuted" style={styles.caixaTexto}>
              {virada.antes}
              <Texto mono tamanho={12.5} peso={600}>
                {semQuebra(virada.destaque)}
              </Texto>
              {virada.depois}
            </Texto>
          </Cartao>
        ) : null}

        <Texto tamanho={11.5} cor="textSubtle" style={styles.rodapeTexto}>
          {viagem
            ? `Compras acima da cota de US$ ${formatarNumeroBR(REGRAS_FISCAIS.bagagem.cotaUSD, 0)} pagam ${rotuloAliquota(REGRAS_FISCAIS.bagagem.aliquotaExcedente)} sobre o excedente. `
            : ''}
          Regras fiscais de {rotuloRevisao()} · Receita Federal, BCB, Comsefaz ·{' '}
          <Texto
            tamanho={11.5}
            cor="textMuted"
            style={styles.sublinhado}
            onPress={() => setFontesVisiveis(true)}
            accessibilityRole="button"
            accessibilityLabel="Ver as fontes das regras fiscais">
            ver fontes
          </Texto>
        </Texto>
        <Texto tamanho={11.5} cor="textSubtle" style={styles.rodapeTexto}>
          {AVISO_LEGAL}
        </Texto>
      </ScrollView>

      <View style={[styles.barraBaixo, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]}>
        <Botao
          titulo={salva ? 'Salvo' : 'Salvar'}
          icone={salva ? 'checkmark' : undefined}
          variante="secundario"
          altura={50}
          desabilitado={salva}
          aoTocar={salvar}
          accessibilityLabel={salva ? 'Simulação salva no histórico' : 'Salvar no histórico'}
          style={{ flex: 1 }}
        />
        {oferecerAlerta ? (
          <Botao
            titulo={alertaCriado ? 'Alerta criado' : `Avisar se ${moeda.nomeFrase} cair`}
            icone={alertaCriado ? 'checkmark' : undefined}
            altura={50}
            desabilitado={alertaCriado}
            aoTocar={() => setAlertaVisivel(true)}
            accessibilityLabel={alertaCriado ? `Alerta do ${nomeMoeda} criado` : `Criar alerta para quando ${moeda.nomeFrase} cair`}
            style={{ flex: 1.4 }}
          />
        ) : (
          <Botao titulo="Compartilhar" altura={50} aoTocar={compartilhar} style={{ flex: 1.4 }} />
        )}
      </View>

      <SheetFontes visivel={fontesVisiveis} aoFechar={() => setFontesVisiveis(false)} dados={dados} />
      {oferecerAlerta ? (
        <SheetNovoAlerta
          visivel={alertaVisivel}
          aoFechar={() => setAlertaVisivel(false)}
          moeda={simulacao.moeda}
          cotacaoHoje={entrada.cotacao}
          sugestao={{ valor: resultado.pontoDeVirada, nomeProduto: registro.nomeProduto }}
          origem={simulacao.salvaComo}
          aoCriar={() => setAlertaCriado(true)}
        />
      ) : null}
    </View>
  );
}

function criarStyles(cores: Paleta) {
  return StyleSheet.create({
    tela: { flex: 1, backgroundColor: cores.background },
    barraTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 6, minHeight: 44 },
    voltar: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: -4 },
    conteudo: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24, gap: 14 },
    cabeca: { gap: 8 },
    aviso: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
    avisoTexto: { flex: 1, lineHeight: 18 },
    caixa: { paddingVertical: 13, paddingHorizontal: 14, borderRadius: 16 },
    caixaTexto: { lineHeight: 18 },
    rodapeTexto: { lineHeight: 16 },
    sublinhado: { textDecorationLine: 'underline' },
    barraBaixo: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: cores.background,
      borderTopWidth: 1,
      borderTopColor: cores.border,
    },
  });
}
