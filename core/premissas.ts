// Premissas da comparação: o que raramente muda entre uma simulação e outra e, por
// isso, vira chips com valor padrão na tela Comparar (o ajuste fica num sheet).

import { REGRAS_FISCAIS } from '@/constants/regras-fiscais';
import { type Cenario, type FormaPagamento, rotuloAliquota } from '@/core/calculadora';
import { formatarNumeroBR, formatarPctCurto } from '@/core/formato';

export interface Premissas {
  cenario: Cenario;
  siteCertificado: boolean;
  icms: number;
  pgto: FormaPagamento;
  /** Spread em % (2 = 2%). */
  spread: number;
}

export const SPREAD_PADRAO = 2; // média de Wise/Nomad/C6
export const PASSO_SPREAD = 0.5;
export const SPREAD_MAXIMO = 10;

export const PREMISSAS_PADRAO: Premissas = {
  cenario: 'Encomenda',
  siteCertificado: true,
  icms: REGRAS_FISCAIS.icms.padrao,
  pgto: 'Cartao',
  spread: SPREAD_PADRAO,
};

/** Spread após um toque no stepper, preso entre 0 e SPREAD_MAXIMO. */
export function passoSpread(atual: number, direcao: 1 | -1): number {
  const proximo = Math.round((atual + direcao * PASSO_SPREAD) * 10) / 10;
  return Math.min(SPREAD_MAXIMO, Math.max(0, proximo));
}

export function rotuloPagamento(pgto: FormaPagamento): string {
  const aliquota = pgto === 'Dinheiro' ? REGRAS_FISCAIS.iof.especie : REGRAS_FISCAIS.iof.cartao;
  return `${pgto === 'Dinheiro' ? 'Espécie' : 'Cartão'} · ${rotuloAliquota(aliquota)}`;
}

// Chips da tela Comparar, na ordem do protótipo. Em Viagem, as premissas de
// encomenda (Remessa Conforme e ICMS) não se aplicam e saem.
export function rotulosPremissas(p: Premissas): string[] {
  const iof = rotuloAliquota(p.pgto === 'Dinheiro' ? REGRAS_FISCAIS.iof.especie : REGRAS_FISCAIS.iof.cartao);
  const pagamento = `${p.pgto === 'Dinheiro' ? 'Espécie' : 'Cartão'} · IOF ${iof}`;
  const spread = `Spread ${formatarPctCurto(p.spread)}`;
  if (p.cenario === 'Viagem') return ['Viagem', pagamento, spread];
  return [
    'Encomenda',
    p.siteCertificado ? 'Remessa Conforme' : 'Fora do Remessa Conforme',
    `ICMS ${rotuloAliquota(p.icms)}`,
    pagamento,
    spread,
  ];
}

export interface SituacaoCota {
  dentro: boolean;
  rotulo: string;
}

// Compra de viagem contra a cota de bagagem (em US$). Null sem preço ou cotação.
export function situacaoCota(precoExt: number, cotacao: number, cotacaoUSD: number): SituacaoCota | null {
  if (precoExt <= 0 || cotacao <= 0 || cotacaoUSD <= 0) return null;
  const { cotaUSD } = REGRAS_FISCAIS.bagagem;
  const emUSD = (precoExt * cotacao) / cotacaoUSD;
  const dentro = emUSD <= cotaUSD;
  return { dentro, rotulo: `${dentro ? 'Dentro' : 'Acima'} da cota de US$ ${formatarNumeroBR(cotaUSD, 0)}` };
}
