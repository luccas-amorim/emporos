import type { CurrencyCode } from '@/constants/currencies';

export type DirecaoAlerta = 'abaixo' | 'acima';

export interface AlertaCambio {
  id: string;
  moeda: CurrencyCode;
  alvo: number; // cotação em BRL
  direcao: DirecaoAlerta;
  criadoEm: string; // ISO 8601
}

// Retorna os alertas satisfeitos pelas cotações atuais. Puro para ser testável;
// o disparo (banner em foreground hoje, push via EAS no futuro) fica na UI.
export function verificarAlertas(
  alertas: AlertaCambio[],
  cotacoes: Partial<Record<CurrencyCode, number>>
): AlertaCambio[] {
  return alertas.filter((alerta) => {
    const cotacao = cotacoes[alerta.moeda];
    if (cotacao === undefined) return false;
    return alerta.direcao === 'abaixo' ? cotacao <= alerta.alvo : cotacao >= alerta.alvo;
  });
}
