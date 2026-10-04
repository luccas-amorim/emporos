// Histórico de simulações: formato salvo (com versão e migração) e o recálculo com o
// câmbio de hoje que deixa o histórico "vivo".

import type { CurrencyCode } from '@/constants/currencies';
import { REGRAS_FISCAIS } from '@/constants/regras-fiscais';
import {
  type CalculoInput,
  type CalculoResultado,
  calcularParidade,
  type Cenario,
  type FormaPagamento,
  type Veredito,
  vereditoDeCustos,
} from '@/core/calculadora';
import { formatarBRL, formatarCotacaoBR } from '@/core/formato';

export interface SimulacaoSalva {
  id: string;
  data: string; // ISO 8601
  nomeProduto?: string;
  link?: string;
  observacao?: string;
  precoBR: number;
  parcelasBR: number;
  precoExt: number;
  moeda: CurrencyCode;
  pgto: FormaPagamento;
  spread: number;
  valeImportar: boolean;
  custoBR: number;
  custoExt: number;
  economia: number;
  // Campos adicionados depois do lançamento do histórico — opcionais para
  // manter compatibilidade com simulações já salvas no aparelho.
  cenario?: Cenario;
  freteExt?: number;
  taxFreePct?: number;
  icms?: number; // alíquota de ICMS usada (Encomenda)
  siteCertificado?: boolean; // site no Remessa Conforme (Encomenda)
  pais?: string; // código ISO do país da compra
  cotacao?: number;
  selicAnual?: number;
  /** Veredito no dia em que a simulação foi salva (v2). */
  vereditoOriginal?: Veredito;
}

/** Versão atual do formato salvo. v1: lista solta; v2: { versao, simulacoes }. */
export const VERSAO_HISTORICO = 2;

export interface HistoricoSalvo {
  versao: number;
  simulacoes: SimulacaoSalva[];
}

function pareceSimulacao(item: unknown): item is SimulacaoSalva {
  const s = item as SimulacaoSalva;
  return !!s && typeof s === 'object' && typeof s.id === 'string' && typeof s.precoBR === 'number';
}

// Lê o histórico em qualquer versão e devolve no formato atual, sem descartar registros:
// itens de v1 ganham o vereditoOriginal a partir dos custos guardados. Lança se o
// conteúdo não for reconhecível, para quem chamou não sobrescrever o armazenamento.
export function migrarHistorico(bruto: unknown): HistoricoSalvo {
  const lista = Array.isArray(bruto)
    ? bruto
    : bruto && typeof bruto === 'object' && Array.isArray((bruto as HistoricoSalvo).simulacoes)
      ? (bruto as HistoricoSalvo).simulacoes
      : null;
  if (!lista) throw new Error('Histórico em formato desconhecido');

  return {
    versao: VERSAO_HISTORICO,
    simulacoes: lista.filter(pareceSimulacao).map((item) => ({
      ...item,
      vereditoOriginal: item.vereditoOriginal ?? vereditoDeCustos(item.custoBR, item.custoExt),
    })),
  };
}

/** Precisa regravar no formato atual? */
export function historicoDesatualizado(bruto: unknown): boolean {
  return Array.isArray(bruto) || (bruto as HistoricoSalvo)?.versao !== VERSAO_HISTORICO;
}

/** Cotações e Selic do dia, no formato que o recálculo precisa. */
export interface MercadoHoje {
  cotacoes: Record<CurrencyCode, number>;
  selicMensal: number;
}

// Remonta a entrada do cálculo com a simulação salva e o mercado de hoje (o mesmo que
// o "Recalcular hoje" faz pela Comparar). Regras fiscais: as vigentes.
export function entradaDoRegistro(item: SimulacaoSalva, mercado: MercadoHoje): CalculoInput {
  const cenario = item.cenario ?? 'Viagem';
  const encomenda = cenario === 'Encomenda';
  return {
    precoBR: item.precoBR,
    parcelasBR: item.parcelasBR,
    precoExt: item.precoExt,
    freteExt: encomenda ? (item.freteExt ?? 0) : 0,
    taxFreePct: encomenda ? 0 : (item.taxFreePct ?? 0),
    cenario,
    cotacao: mercado.cotacoes[item.moeda],
    cotacaoUSD: mercado.cotacoes.USD,
    spread: item.spread,
    pgto: item.pgto,
    selicMensal: mercado.selicMensal,
    iofCartao: REGRAS_FISCAIS.iof.cartao,
    iofDinheiro: REGRAS_FISCAIS.iof.especie,
    icms: item.icms ?? REGRAS_FISCAIS.icms.padrao,
    siteCertificado: item.siteCertificado ?? true,
  };
}

export interface SimulacaoRecalculada {
  item: SimulacaoSalva;
  entrada: CalculoInput;
  resultado: CalculoResultado;
  vereditoOriginal: Veredito;
  vereditoAtual: Veredito;
  /** O veredito inverteu (Brasil ↔ importar). Empate não conta como inversão. */
  mudou: boolean;
}

export function recalcularSimulacao(item: SimulacaoSalva, mercado: MercadoHoje): SimulacaoRecalculada {
  const entrada = entradaDoRegistro(item, mercado);
  const resultado = calcularParidade(entrada);
  const vereditoOriginal = item.vereditoOriginal ?? vereditoDeCustos(item.custoBR, item.custoExt);
  const vereditoAtual = resultado.veredito;
  const mudou = vereditoOriginal !== 'empate' && vereditoAtual !== 'empate' && vereditoOriginal !== vereditoAtual;
  return { item, entrada, resultado, vereditoOriginal, vereditoAtual, mudou };
}

/** "Brasil · R$ 716" / "Importar · R$ 96" / "Tanto faz · R$ 3". */
export function rotuloVereditoCurto(veredito: Veredito, economia: number): string {
  const nome = veredito === 'brasil' ? 'Brasil' : veredito === 'exterior' ? 'Importar' : 'Tanto faz';
  return `${nome} · ${formatarBRL(Math.round(economia), 0)}`;
}

/** Banner do topo: "1 decisão mudou" e uma frase sobre o caso. Null se nada mudou. */
export function resumoMudancas(
  recalculadas: SimulacaoRecalculada[],
  nomeFrase: (moeda: CurrencyCode) => string
): { titulo: string; texto: string; sentido: 'brasil' | 'exterior' } | null {
  const mudaram = recalculadas.filter((r) => r.mudou);
  if (mudaram.length === 0) return null;
  const primeira = mudaram[0];
  const sentido = primeira.vereditoAtual === 'exterior' ? 'exterior' : 'brasil';
  const titulo = mudaram.length === 1 ? '1 decisão mudou' : `${mudaram.length} decisões mudaram`;

  if (mudaram.length > 1) {
    return { titulo, sentido, texto: 'Com o câmbio de hoje, essas simulações trocaram de lado. Toque numa delas para ver a conta.' };
  }
  const nome = primeira.item.nomeProduto?.trim() || 'a sua simulação';
  const moeda = nomeFrase(primeira.item.moeda);
  const cotacao = formatarCotacaoBR(primeira.entrada.cotacao);
  const agora = sentido === 'exterior' ? 'agora vale importar' : 'agora sai mais barato no Brasil';
  return { titulo, sentido, texto: `Com ${moeda} a ${cotacao}, ${nome} ${agora}.` };
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "hoje", "ontem", "12 set" ou "12 set 2025" (fora do ano corrente). */
export function rotuloData(iso: string, agora: Date = new Date()): string {
  const data = new Date(iso);
  const dia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dias = Math.round((dia(agora) - dia(data)) / 86400000);
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'ontem';
  const base = `${data.getDate()} ${MESES[data.getMonth()]}`;
  return data.getFullYear() === agora.getFullYear() ? base : `${base} ${data.getFullYear()}`;
}
