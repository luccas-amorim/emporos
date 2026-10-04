import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

import type { CurrencyCode } from '@/constants/currencies';
import {
  type HistoricoSalvo,
  historicoDesatualizado,
  type MercadoHoje,
  migrarHistorico,
  recalcularSimulacao,
  type SimulacaoRecalculada,
  type SimulacaoSalva,
  VERSAO_HISTORICO,
} from '@/core/historico';
import { CHAVES, lerComMigracao } from '@/services/armazenamento';

export type { SimulacaoSalva } from '@/core/historico';

// Parâmetros do "Recalcular hoje" (Histórico → Home). Todo campo vai preenchido, mesmo
// vazio: a Home aplica todos, para não herdar valores da simulação que estava na tela.
export function paramsRecalculo(item: SimulacaoSalva): Record<string, string> {
  return {
    precoBR: String(item.precoBR),
    parcelasBR: String(item.parcelasBR),
    precoExt: String(item.precoExt),
    freteExt: item.freteExt ? String(item.freteExt) : '',
    moeda: item.moeda,
    pgto: item.pgto,
    spread: String(item.spread),
    cenario: item.cenario ?? 'Viagem',
    taxFree: item.taxFreePct ? String(item.taxFreePct) : '',
    icms: item.icms ? String(item.icms) : '',
    certificado: item.siteCertificado === false ? 'nao' : 'sim',
    nomeProduto: item.nomeProduto ?? '',
    link: item.link ?? '',
    observacao: item.observacao ?? '',
  };
}

/** Simulação mais recente salva na moeda, com a cotação da época (para o insight do Câmbio). */
export function ultimaSimulacaoNaMoeda(historico: SimulacaoSalva[], moeda: CurrencyCode): SimulacaoSalva | null {
  return historico.find((item) => item.moeda === moeda && !!item.cotacao && item.custoExt > 0) ?? null;
}

// Ponto de virada de uma simulação salva: o custo de importar é linear na cotação, então
// basta a cotação e os dois custos da época (ver calcularPontoDeVirada).
export function pontoDeViradaSalvo(item: SimulacaoSalva): number | null {
  if (!item.cotacao || item.custoExt <= 0) return null;
  return (item.cotacao * item.custoBR) / item.custoExt;
}

const LIMITE_HISTORICO = 50;

// O histórico é um só para o app inteiro: Comparar, Resultado e Histórico leem e
// escrevem a mesma lista. Cada tela com o seu próprio estado acabava sobrescrevendo
// no armazenamento o que outra tinha acabado de salvar.
interface EstadoHistorico {
  historico: SimulacaoSalva[];
  carregando: boolean;
}

let estado: EstadoHistorico = { historico: [], carregando: true };
let carga: Promise<void> | null = null;
const ouvintes = new Set<() => void>();

function publicar(novo: EstadoHistorico) {
  estado = novo;
  ouvintes.forEach((ouvinte) => ouvinte());
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

// Se o histórico salvo estiver ilegível, ele é copiado para esta chave antes de qualquer
// gravação, para nada se perder de vez.
const CHAVE_COPIA_ILEGIVEL = `${CHAVES.historico}_ilegivel`;

function serializar(historico: SimulacaoSalva[]): string {
  const salvo: HistoricoSalvo = { versao: VERSAO_HISTORICO, simulacoes: historico };
  return JSON.stringify(salvo);
}

/** Relê o histórico do armazenamento (abertura do app, aba em foco, testes). */
export function recarregarHistorico(): Promise<void> {
  carga = (async () => {
    let bruto: string | null = null;
    try {
      bruto = await lerComMigracao(CHAVES.historico);
      if (!bruto) {
        publicar({ historico: [], carregando: false });
        return;
      }
      const conteudo = JSON.parse(bruto);
      const { simulacoes } = migrarHistorico(conteudo);
      publicar({ historico: simulacoes, carregando: false });
      // Lista solta da v1 (ou versão antiga): regrava já no formato atual.
      if (historicoDesatualizado(conteudo)) await AsyncStorage.setItem(CHAVES.historico, serializar(simulacoes));
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error);
      if (bruto) await AsyncStorage.setItem(CHAVE_COPIA_ILEGIVEL, bruto).catch(() => {});
      publicar({ ...estado, carregando: false });
    }
  })();
  return carga;
}

async function alterar(mudanca: (atual: SimulacaoSalva[]) => SimulacaoSalva[]) {
  // Nunca grava antes da primeira leitura: sobrescreveria o que está salvo.
  await (carga ?? recarregarHistorico());
  const historico = mudanca(estado.historico);
  publicar({ ...estado, historico });
  try {
    await AsyncStorage.setItem(CHAVES.historico, serializar(historico));
  } catch (error) {
    console.error('❌ Erro ao salvar histórico:', error);
  }
}

export function novoIdSimulacao(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useHistoricoSimulacoes() {
  const { historico, carregando } = useSyncExternalStore(assinar, () => estado);

  useEffect(() => {
    if (!carga) recarregarHistorico();
  }, []);

  /** Salva no topo da lista e devolve o id. */
  const adicionarSimulacao = useCallback((simulacao: Omit<SimulacaoSalva, 'id' | 'data'> & { id?: string }) => {
    const nova: SimulacaoSalva = { ...simulacao, id: simulacao.id ?? novoIdSimulacao(), data: new Date().toISOString() };
    alterar((atual) => [nova, ...atual.filter((item) => item.id !== nova.id)].slice(0, LIMITE_HISTORICO));
    return nova.id;
  }, []);

  const removerSimulacao = useCallback((id: string) => {
    alterar((atual) => atual.filter((item) => item.id !== id));
  }, []);

  const limparHistorico = useCallback(() => {
    alterar(() => []);
  }, []);

  return { historico, carregando, adicionarSimulacao, removerSimulacao, limparHistorico };
}

// Histórico "vivo": cada simulação refeita com a cotação e a Selic de hoje, com o
// veredito da época ao lado do de hoje.
export function useHistoricoRecalculado(mercado: MercadoHoje | null): SimulacaoRecalculada[] | null {
  const { historico } = useHistoricoSimulacoes();
  return useMemo(
    () => (mercado ? historico.map((item) => recalcularSimulacao(item, mercado)) : null),
    [historico, mercado]
  );
}
