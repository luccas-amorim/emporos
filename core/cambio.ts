// Histórico de câmbio (90 cotações diárias): estatísticas, insight e geometria do
// gráfico. O insight compara com o passado; nunca é previsão nem conselho de compra.

import { formatarBRL, formatarNumeroBR, formatarPct } from '@/core/formato';

export interface PontoSerie {
  /** Instante da cotação (ms desde 1970). */
  data: number;
  /** BRL por 1 unidade da moeda (média entre compra e venda). */
  valor: number;
}

export interface Estatisticas {
  media: number;
  min: number;
  max: number;
}

export function mediaMinMax(serie: PontoSerie[]): Estatisticas | null {
  if (serie.length === 0) return null;
  let soma = 0;
  let min = Infinity;
  let max = -Infinity;
  for (const { valor } of serie) {
    soma += valor;
    min = Math.min(min, valor);
    max = Math.max(max, valor);
  }
  return { media: soma / serie.length, min, max };
}

/** Distância da cotação atual para a média, em % (negativo = abaixo da média). */
export function desvioDaMedia(atual: number, media: number): number {
  return media > 0 ? (atual / media - 1) * 100 : 0;
}

/** Variação da última cotação da série em relação à anterior, em %. */
export function variacaoDoDia(serie: PontoSerie[]): number | null {
  if (serie.length < 2) return null;
  const ordenada = [...serie].sort((a, b) => a.data - b.data);
  const ultimo = ordenada[ordenada.length - 1].valor;
  const anterior = ordenada[ordenada.length - 2].valor;
  return anterior > 0 ? (ultimo / anterior - 1) * 100 : null;
}

/** "−0,8% hoje" / "+0,3% hoje", com o sinal de menos tipográfico. */
export function rotuloVariacao(variacao: number): string {
  const sinal = variacao < 0 ? '−' : '+';
  return `${sinal}${formatarNumeroBR(Math.abs(variacao), 1)}% hoje`;
}

export interface Insight {
  abaixo: boolean;
  /** "Abaixo da média" / "Acima da média" (overline). */
  rotulo: string;
  /** "O dólar está 2,5% abaixo da média de 90 dias." */
  titulo: string;
}

function maiuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Insight do card: só compara com a média. Dentro de 0,05% da média, diz que está nela.
export function insightCambio(atual: number, media: number, nomeFrase: string): Insight {
  const desvio = desvioDaMedia(atual, media);
  const abaixo = desvio < 0;
  const moeda = maiuscula(nomeFrase);
  if (Math.abs(desvio) < 0.05) {
    return { abaixo: false, rotulo: 'Na média', titulo: `${moeda} está na média dos últimos 90 dias.` };
  }
  return {
    abaixo,
    rotulo: abaixo ? 'Abaixo da média' : 'Acima da média',
    titulo: `${moeda} está ${formatarPct(Math.abs(desvio), 1)} ${abaixo ? 'abaixo' : 'acima'} da média de 90 dias.`,
  };
}

// Quanto uma simulação salva custaria a mais (positivo) ou a menos (negativo) na
// cotação de hoje do que na média. O custo de importar é linear na cotação, então
// basta escalar o custo calculado na época.
export function diferencaPelaMedia(custoExt: number, cotacaoDoCusto: number, atual: number, media: number): number {
  if (cotacaoDoCusto <= 0) return 0;
  return (custoExt * (atual - media)) / cotacaoDoCusto;
}

/** "No Sony que você simulou, são ~R$ 107 a menos que na média." */
export function fraseImpacto(nomeProduto: string | undefined, diferenca: number): string {
  const alvo = nomeProduto?.trim() ? `No ${nomeProduto.trim()} que você simulou` : 'Na sua última simulação';
  const valor = formatarBRL(Math.abs(Math.round(diferenca)), 0);
  return `${alvo}, são ~${valor} a ${diferenca < 0 ? 'menos' : 'mais'} que na média.`;
}

export const AVISO_COMPARACAO = 'Comparação com o passado, não previsão.';

export interface GeometriaGrafico {
  /** Pontos da linha no formato do <polyline> ("x,y x,y ..."). */
  pontos: string;
  /** Altura (y) da linha da média. */
  yMedia: number;
  /** Último ponto, onde fica a bolinha. */
  ultimo: { x: number; y: number };
}

// Escala a série (em ordem cronológica) para uma área de largura × altura, com folga
// para a linha e o ponto final não encostarem nas bordas.
export function geometriaGrafico(
  serie: PontoSerie[],
  largura: number,
  altura: number,
  folga = 4,
  folgaX = 0
): GeometriaGrafico | null {
  const stats = mediaMinMax(serie);
  if (!stats || serie.length < 2) return null;
  const ordenada = [...serie].sort((a, b) => a.data - b.data);
  const amplitude = stats.max - stats.min || 1;
  const util = altura - 2 * folga;
  const y = (valor: number) => folga + (1 - (valor - stats.min) / amplitude) * util;
  const passo = (largura - 2 * folgaX) / (ordenada.length - 1);
  const coords = ordenada.map((p, i) => ({ x: folgaX + i * passo, y: y(p.valor) }));
  const arred = (n: number) => Math.round(n * 10) / 10;
  return {
    pontos: coords.map((c) => `${arred(c.x)},${arred(c.y)}`).join(' '),
    yMedia: arred(y(stats.media)),
    ultimo: { x: arred(coords[coords.length - 1].x), y: arred(coords[coords.length - 1].y) },
  };
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Meses cobertos pela série, em ordem ("jul", "ago", "set", "out"). */
export function rotulosMeses(serie: PontoSerie[]): string[] {
  const ordenada = [...serie].sort((a, b) => a.data - b.data);
  const meses: string[] = [];
  for (const p of ordenada) {
    const mes = MESES[new Date(p.data).getMonth()];
    if (meses[meses.length - 1] !== mes) meses.push(mes);
  }
  return meses;
}
