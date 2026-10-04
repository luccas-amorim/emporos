import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Botao } from '@/components/ui/botao';
import { Cartao } from '@/components/ui/cartao';
import { Texto } from '@/components/ui/texto';
import { REGRAS_FISCAIS } from '@/constants/regras-fiscais';
import type { Paleta } from '@/constants/theme';
import { calcularParidade, type CalculoInput, rotuloAliquota } from '@/core/calculadora';
import { formatarBRL, formatarMoeda, formatarPct } from '@/core/formato';
import { useTema } from '@/hooks/use-tema';
import { CHAVES, lerComMigracao } from '@/services/armazenamento';
import { taxaMensalEquivalente } from '@/services/selic';

// Exemplo do recibo: os números saem da própria calculadora, com as regras vigentes.
const SELIC_EXEMPLO = 15;
const EXEMPLO: CalculoInput = {
  precoBR: 3799,
  parcelasBR: 10,
  precoExt: 399,
  freteExt: 0,
  taxFreePct: 0,
  cenario: 'Encomenda',
  cotacao: 5.42,
  cotacaoUSD: 5.42,
  spread: 2,
  pgto: 'Cartao',
  selicMensal: taxaMensalEquivalente(SELIC_EXEMPLO),
  iofCartao: REGRAS_FISCAIS.iof.cartao,
  iofDinheiro: REGRAS_FISCAIS.iof.especie,
  icms: 0.2,
  siteCertificado: true,
};

export function useOnboarding() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    lerComMigracao(CHAVES.onboarding)
      .then((visto) => {
        if (!visto) setVisivel(true);
      })
      .catch(() => {});
  }, []);

  const concluir = () => {
    setVisivel(false);
    AsyncStorage.setItem(CHAVES.onboarding, '1').catch(() => {});
  };

  return { visivel, concluir };
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={estilosFixos.linha}>
      <Texto mono tamanho={12.5} cor="textMuted">
        {rotulo}
      </Texto>
      <Texto mono tamanho={12.5} cor="textMuted">
        {valor}
      </Texto>
    </View>
  );
}

function Itens({ itens }: { itens: string[] }) {
  return (
    <View style={{ gap: 10 }}>
      {itens.map((item, i) => (
        <View key={item} style={estilosFixos.item}>
          <Texto mono tamanho={13.5} cor="textSubtle">
            {String(i + 1).padStart(2, '0')}
          </Texto>
          <Texto tamanho={13.5} cor="textMuted" style={{ flex: 1, lineHeight: 18 }}>
            {item}
          </Texto>
        </View>
      ))}
    </View>
  );
}

interface Passo {
  titulo: string;
  conteudo: React.ReactNode;
  itens: string[];
}

// Tela 01: três passos. Um recibo explica o problema em vez de slides com ilustração.
export function Onboarding({ visivel, aoConcluir }: { visivel: boolean; aoConcluir: () => void }) {
  const { cores } = useTema();
  const styles = useMemo(() => criarStyles(cores), [cores]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [indice, setIndice] = useState(0);
  const listaRef = useRef<FlatList<Passo>>(null);

  const passos = useMemo<Passo[]>(() => {
    const r = calcularParidade(EXEMPLO);
    const valor = (tipo: string) => formatarBRL(r.breakdown.find((i) => i.tipo === tipo)?.valor ?? 0);
    const parcela = formatarBRL(EXEMPLO.precoBR / EXEMPLO.parcelasBR);
    return [
      {
        titulo: 'O preço da etiqueta não é o que você paga.',
        conteudo: (
          <Cartao style={styles.recibo}>
            <View style={estilosFixos.linhaBase}>
              <Texto tamanho={13} cor="textMuted">
                Etiqueta
              </Texto>
              <Texto mono tamanho={20} peso={500}>
                {formatarMoeda(EXEMPLO.precoExt, 'US$', 2)}
              </Texto>
            </View>
            <Linha rotulo="+ câmbio e spread" valor={valor('produto')} />
            <Linha rotulo={`+ IOF ${rotuloAliquota(EXEMPLO.iofCartao)}`} valor={valor('iof')} />
            <Linha rotulo="+ Imposto de Importação" valor={valor('ii')} />
            <Linha rotulo={`+ ICMS ${rotuloAliquota(EXEMPLO.icms)}`} valor={valor('icms')} />
            <View style={styles.divisor} />
            <View style={estilosFixos.linhaBase}>
              <Texto tamanho={13} peso={600}>
                Na sua porta
              </Texto>
              <Texto mono tamanho={20} peso={600} cor="exterior">
                {formatarBRL(r.custoExt)}
              </Texto>
            </View>
            <View style={styles.caixaBrasil}>
              <Texto tamanho={12.5} style={{ lineHeight: 17 }}>
                Parcelado no Brasil, em valor de hoje:{' '}
                <Texto mono tamanho={12.5} peso={600} cor="brasil">
                  {formatarBRL(r.custoBR)}
                </Texto>
              </Texto>
            </View>
          </Cartao>
        ),
        itens: ['Cada imposto com a regra e a fonte oficial.', 'Parcelas trazidas a valor de hoje pela Selic.'],
      },
      {
        titulo: 'Parcela de amanhã vale menos que real de hoje.',
        conteudo: (
          <Cartao style={styles.recibo}>
            <View style={estilosFixos.linhaBase}>
              <Texto tamanho={13} cor="textMuted">
                No cartão
              </Texto>
              <Texto mono tamanho={20} peso={500}>
                {EXEMPLO.parcelasBR} × {parcela}
              </Texto>
            </View>
            <Linha rotulo={`Selic ${formatarPct(SELIC_EXEMPLO, 0)} a.a.`} valor={`${formatarPct(EXEMPLO.selicMensal * 100, 2)} a.m.`} />
            <View style={styles.divisor} />
            <View style={estilosFixos.linhaBase}>
              <Texto tamanho={13} peso={600}>
                Em valor de hoje
              </Texto>
              <Texto mono tamanho={20} peso={600} cor="brasil">
                {formatarBRL(r.custoBR)}
              </Texto>
            </View>
          </Cartao>
        ),
        itens: [
          'Enquanto as parcelas vencem, o dinheiro fica rendendo na sua conta.',
          'Por isso parcelar sem juros conta a favor de comprar no Brasil.',
        ],
      },
      {
        titulo: 'Encomenda ou viagem? A conta muda.',
        conteudo: (
          <Cartao style={[styles.recibo, { gap: 12 }]}>
            <View style={{ gap: 2 }}>
              <Texto tamanho={15} peso={600}>
                Encomenda
              </Texto>
              <Texto tamanho={13} cor="textMuted">
                Paga Imposto de Importação e ICMS, com as regras do Remessa Conforme.
              </Texto>
            </View>
            <View style={styles.divisor} />
            <View style={{ gap: 2 }}>
              <Texto tamanho={15} peso={600}>
                Viagem
              </Texto>
              <Texto tamanho={13} cor="textMuted">
                Sem imposto até a cota de bagagem, e com o tax free que você recupera.
              </Texto>
            </View>
          </Cartao>
        ),
        itens: ['Os padrões já vêm prontos; ajuste só o que for diferente.', 'Salve a simulação e acompanhe o câmbio.'],
      },
    ];
  }, [styles]);

  // Overlay absoluto em vez de <Modal>: no react-native-web, um Modal montado dentro
  // de uma tela de tab pode ficar abaixo da tab bar na stacking order e não receber
  // cliques. O overlay com zIndex alto se comporta igual em native e web.
  if (!visivel) return null;

  const ultimo = indice === passos.length - 1;
  const avancar = () => {
    if (ultimo) {
      aoConcluir();
      return;
    }
    // Atualiza o índice direto no press: onMomentumScrollEnd não dispara de forma
    // confiável em scrolls programáticos (especialmente no web), só em swipes.
    setIndice(indice + 1);
    listaRef.current?.scrollToIndex({ index: indice + 1, animated: true });
  };
  const rotuloBotao = indice === 0 ? 'Começar' : ultimo ? 'Começar a comparar' : 'Continuar';

  return (
    <View style={[styles.raiz, { paddingTop: insets.top + 14 }]}>
      <View style={styles.marca}>
        <View style={styles.logo} />
        <Texto tamanho={15} peso={600} style={{ flex: 1 }}>
          Vale importar?
        </Texto>
        {!ultimo && (
          <Pressable onPress={aoConcluir} hitSlop={12} accessibilityRole="button" accessibilityLabel="Pular introdução">
            <Texto tamanho={13} cor="textSubtle">
              Pular
            </Texto>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={listaRef}
        data={passos}
        keyExtractor={(item) => item.titulo}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onMomentumScrollEnd={(e) => setIndice(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={[styles.passo, { width }]}>
            <Texto tamanho={34} peso={600} style={styles.titulo} accessibilityRole="header">
              {item.titulo}
            </Texto>
            {item.conteudo}
            <Itens itens={item.itens} />
          </View>
        )}
      />

      <View style={[styles.rodape, { paddingBottom: Math.max(insets.bottom, 16) + 14 }]}>
        <View style={styles.pontos}>
          {passos.map((p, i) => (
            <View key={p.titulo} style={[styles.ponto, i === indice && styles.pontoAtivo]} />
          ))}
        </View>
        <Botao
          titulo={rotuloBotao}
          aoTocar={avancar}
          accessibilityLabel={ultimo ? 'Começar a usar o app' : 'Próximo slide'}
          style={{ alignSelf: 'stretch' }}
        />
        <Texto variante="rotulo">Gratuito, sem anúncios, sem cadastro.</Texto>
      </View>
    </View>
  );
}

const estilosFixos = StyleSheet.create({
  linha: { flexDirection: 'row', justifyContent: 'space-between' },
  linhaBase: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  item: { flexDirection: 'row', gap: 12 },
});

function criarStyles(cores: Paleta) {
  return StyleSheet.create({
    raiz: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      elevation: 1000,
      backgroundColor: cores.background,
    },
    marca: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, marginBottom: 8 },
    logo: { width: 22, height: 22, borderRadius: 7, backgroundColor: cores.text },
    passo: { paddingHorizontal: 24, paddingTop: 14, gap: 22 },
    titulo: { lineHeight: 36, letterSpacing: -1.2 },
    recibo: { borderRadius: 22, padding: 18, gap: 9 },
    divisor: { height: 1, backgroundColor: cores.border, marginVertical: 3 },
    caixaBrasil: { backgroundColor: cores.brasilSoft, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
    rodape: { paddingHorizontal: 24, alignItems: 'center', gap: 14 },
    pontos: { flexDirection: 'row', gap: 6 },
    ponto: { width: 6, height: 6, borderRadius: 3, backgroundColor: cores.border },
    pontoAtivo: { width: 18, backgroundColor: cores.text },
  });
}
