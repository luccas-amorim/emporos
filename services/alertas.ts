import { type CurrencyCode, moedaPorCodigo } from '@/constants/currencies';
import { formatarCotacaoBR } from '@/core/formato';

export type DirecaoAlerta = 'abaixo' | 'acima';

export interface AlertaCambio {
  id: string;
  moeda: CurrencyCode;
  alvo: number; // cotação em BRL
  direcao: DirecaoAlerta;
  criadoEm: string; // ISO 8601
  /** Quando o alerta avisou pela última vez; vazio enquanto não atingiu o alvo. */
  notificadoEm?: string;
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
    if (cotacao === undefined) return alerta;

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
    titulo: `🎯 ${moedaPorCodigo(alerta.moeda).nome} ${verbo} até o seu alvo`,
    corpo: `A cotação está em ${formatarCotacaoBR(cotacao)} (alvo: ${formatarCotacaoBR(alerta.alvo)}). Bom momento para simular a compra.`,
  };
}
