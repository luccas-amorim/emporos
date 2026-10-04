import { type CurrencyCode, moedaPorCodigo } from '@/constants/currencies';
import { formatarCotacaoBR, formatarPct } from '@/core/formato';

export type DirecaoAlerta = 'abaixo' | 'acima';

export interface AlertaCambio {
  id: string;
  moeda: CurrencyCode;
  alvo: number; // cotação em BRL
  direcao: DirecaoAlerta;
  criadoEm: string; // ISO 8601
  /** Quando o alerta avisou pela última vez; vazio enquanto não atingiu o alvo. */
  notificadoEm?: string;
  /** Desligado pelo switch da aba Câmbio; ausente = ligado (alertas antigos). */
  ativo?: boolean;
  /** Id da simulação de onde o alerta saiu ("Avisar se o dólar cair"). */
  origem?: string;
}

export function alertaAtivo(alerta: AlertaCambio): boolean {
  return alerta.ativo !== false;
}

function atingiuAlvo(alerta: AlertaCambio, cotacao: number): boolean {
  return alerta.direcao === 'abaixo' ? cotacao <= alerta.alvo : cotacao >= alerta.alvo;
}

// Retorna os alertas satisfeitos pelas cotações atuais (o banner da Home).
export function verificarAlertas(
  alertas: AlertaCambio[],
  cotacoes: Partial<Record<CurrencyCode, number>>
): AlertaCambio[] {
  return alertas.filter((alerta) => {
    if (!alertaAtivo(alerta)) return false;
    const cotacao = cotacoes[alerta.moeda];
    return cotacao !== undefined && atingiuAlvo(alerta, cotacao);
  });
}

export interface AtualizacaoAlertas {
  alertas: AlertaCambio[];
  /** Alertas que atingiram o alvo agora e ainda não tinham avisado. */
  disparados: AlertaCambio[];
  mudou: boolean;
}

// Cada alerta avisa uma vez ao atingir o alvo. Se a cotação sair do alvo, ele é
// rearmado e pode avisar de novo numa próxima vez — sem repetir a cada verificação.
export function atualizarAlertas(
  alertas: AlertaCambio[],
  cotacoes: Partial<Record<CurrencyCode, number>>,
  agora: Date
): AtualizacaoAlertas {
  const disparados: AlertaCambio[] = [];
  let mudou = false;

  const atualizados = alertas.map((alerta) => {
    const cotacao = cotacoes[alerta.moeda];
    if (cotacao === undefined || !alertaAtivo(alerta)) return alerta;

    if (atingiuAlvo(alerta, cotacao)) {
      if (alerta.notificadoEm) return alerta;
      const disparado = { ...alerta, notificadoEm: agora.toISOString() };
      disparados.push(disparado);
      mudou = true;
      return disparado;
    }

    if (!alerta.notificadoEm) return alerta;
    mudou = true;
    const { notificadoEm: _rearmado, ...rearmado } = alerta;
    return rearmado;
  });

  return { alertas: atualizados, disparados, mudou };
}

export function textoNotificacao(alerta: AlertaCambio, cotacao: number): { titulo: string; corpo: string } {
  const verbo = alerta.direcao === 'abaixo' ? 'caiu' : 'subiu';
  return {
    titulo: `${moedaPorCodigo(alerta.moeda).nome} ${verbo} até o seu alvo`,
    corpo: `A cotação está em ${formatarCotacaoBR(cotacao)} (alvo: ${formatarCotacaoBR(alerta.alvo)}). Abra o app para refazer a comparação com a cotação de hoje.`,
  };
}

/** "USD abaixo de R$ 5,30". */
export function rotuloAlerta(alerta: Pick<AlertaCambio, 'moeda' | 'alvo' | 'direcao'>): string {
  return `${alerta.moeda} ${alerta.direcao === 'abaixo' ? 'abaixo' : 'acima'} de ${formatarCotacaoBR(alerta.alvo)}`;
}

/** Quanto a cotação ainda precisa andar até o alvo, em % da cotação atual (0 = atingido). */
export function distanciaAlvo(alerta: Pick<AlertaCambio, 'alvo' | 'direcao'>, cotacao: number): number {
  if (cotacao <= 0) return 0;
  const falta = alerta.direcao === 'abaixo' ? cotacao - alerta.alvo : alerta.alvo - cotacao;
  return Math.max(0, (falta / cotacao) * 100);
}

/** "Falta 2,2%" ou "No alvo". */
export function rotuloDistancia(alerta: Pick<AlertaCambio, 'alvo' | 'direcao'>, cotacao: number): string {
  const distancia = distanciaAlvo(alerta, cotacao);
  return distancia === 0 ? 'No alvo' : `Falta ${formatarPct(distancia, 1)}`;
}

/** Passo do stepper do alvo: R$ 0,05 (moedas com cotação acima de R$ 1). */
export const PASSO_ALVO = 0.05;

export function passoAlvo(alvo: number, direcao: 1 | -1): number {
  return Math.max(PASSO_ALVO, Math.round((alvo + direcao * PASSO_ALVO) * 100) / 100);
}

// Alvo com que o sheet abre: a sugestão (ponto de virada) quando existe; senão, 2%
// abaixo (ou acima) da cotação de hoje, num múltiplo de R$ 0,05.
export function alvoInicial(cotacao: number, direcao: DirecaoAlerta, sugestao?: number | null): number {
  if (sugestao && Number.isFinite(sugestao) && sugestao > 0) return Math.round(sugestao * 100) / 100;
  const bruto = cotacao * (direcao === 'abaixo' ? 0.98 : 1.02);
  return Math.max(PASSO_ALVO, Math.round(Math.round(bruto / PASSO_ALVO) * PASSO_ALVO * 100) / 100);
}
