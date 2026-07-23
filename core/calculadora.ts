export type FormaPagamento = 'Cartao' | 'Dinheiro';
export type Cenario = 'Viagem' | 'Encomenda';

export interface CalculoInput {
  precoBR: number;
  parcelasBR: number;
  precoExt: number;
  freteExt: number; // frete na mesma moeda do produto (0 quando não se aplica)
  /**
   * Percentual de tax free que o usuário espera recuperar (0–100), informado por ele
   * conforme a loja/operadora do destino. Só se aplica ao cenário Viagem.
   */
  taxFreePct: number;
  cenario: Cenario;
  cotacao: number; // cotação comercial da moeda escolhida (BRL por 1 unidade)
  cotacaoUSD: number; // usada para o limite de US$50 da Remessa Conforme
  spread: number;
  pgto: FormaPagamento;
  selicMensal: number;
  iofCartao: number;
  iofDinheiro: number;
}

export interface ItemBreakdown {
  label: string;
  valor: number;
}

export interface CalculoResultado {
  valeImportar: boolean;
  custoBR: number;
  custoExt: number;
  economia: number;
  economiaPct: number; // % de economia sobre a opção mais cara
  breakdown: ItemBreakdown[];
  msg: string;
}

// Remessa Conforme (encomendas internacionais), regras vigentes:
// - até US$ 50: Imposto de Importação de 20%
// - acima de US$ 50: II de 60% com desconto fixo de US$ 20
// - ICMS de 20% "por dentro" sobre (valor aduaneiro + II) em qualquer faixa
export const LIMITE_REMESSA_USD = 50;
export const II_ALIQUOTA_BAIXA = 0.2;
export const II_ALIQUOTA_ALTA = 0.6;
export const II_DESCONTO_USD = 20;
export const ICMS_ALIQUOTA = 0.2;

// Aceita tanto "1500,50" / "1.500,00" (formato BR) quanto "1500.50" / "1,500.00" (formato
// internacional): o último separador (, ou .) da string é tratado como decimal, o resto
// como separador de milhar. Um simples replace(',', '.') quebra em "1.500,00" (vira 1.5).
export function parseNumeroLocal(texto: string): number {
  const limpo = texto.trim();
  if (!limpo) return 0;

  const ultimaVirgula = limpo.lastIndexOf(',');
  const ultimoPonto = limpo.lastIndexOf('.');
  const posDecimal = Math.max(ultimaVirgula, ultimoPonto);

  const normalizado =
    posDecimal === -1
      ? limpo
      : `${limpo.slice(0, posDecimal).replace(/[.,]/g, '')}.${limpo.slice(posDecimal + 1).replace(/[.,]/g, '')}`;

  const valor = parseFloat(normalizado);
  return Number.isNaN(valor) ? 0 : valor;
}

// Decreto nº 11.153/2022: redução gradual do IOF sobre operações com cartão no exterior.
export function getIOFPorAno(ano: number = new Date().getFullYear()): number {
  if (ano === 2024) return 0.0438;
  if (ano === 2025) return 0.0338;
  if (ano === 2026) return 0.0238;
  if (ano === 2027) return 0.0138;
  if (ano >= 2028) return 0.0;
  return 0.0438;
}

export function calcularParidade(input: CalculoInput): CalculoResultado {
  const {
    precoBR,
    parcelasBR,
    precoExt,
    freteExt,
    taxFreePct,
    cenario,
    cotacao,
    cotacaoUSD,
    spread,
    pgto,
    selicMensal,
    iofCartao,
    iofDinheiro,
  } = input;

  const cotacaoFinal = cotacao * (1 + spread / 100);
  const iofFinal = pgto === 'Dinheiro' ? iofDinheiro : iofCartao;

  const breakdown: ItemBreakdown[] = [];

  // Pagamento internacional (produto + frete) — IOF incide sobre a operação de câmbio.
  const valorMoedaExt = precoExt + (cenario === 'Encomenda' ? freteExt : 0);
  const valorPagamento = valorMoedaExt * cotacaoFinal;
  const valorIOF = valorPagamento * iofFinal;

  breakdown.push({ label: `Produto${cenario === 'Encomenda' && freteExt > 0 ? ' + frete' : ''} (câmbio + spread)`, valor: valorPagamento });
  breakdown.push({ label: `IOF (${(iofFinal * 100).toFixed(2).replace('.', ',')}%)`, valor: valorIOF });

  let custoExt = valorPagamento + valorIOF;

  if (cenario === 'Encomenda') {
    // Tributos da Remessa Conforme incidem sobre o valor aduaneiro (produto + frete),
    // sem IOF, pois são cobrados em reais.
    const valorAduaneiro = valorMoedaExt * cotacao;
    const valorUSD = cotacaoUSD > 0 ? (valorMoedaExt * cotacao) / cotacaoUSD : Infinity;

    const impostoImportacao =
      valorUSD <= LIMITE_REMESSA_USD
        ? valorAduaneiro * II_ALIQUOTA_BAIXA
        : Math.max(0, valorAduaneiro * II_ALIQUOTA_ALTA - II_DESCONTO_USD * cotacaoUSD);

    const baseICMS = valorAduaneiro + impostoImportacao;
    const icms = (baseICMS / (1 - ICMS_ALIQUOTA)) * ICMS_ALIQUOTA;

    breakdown.push({
      label: `Imposto de Importação (${valorUSD <= LIMITE_REMESSA_USD ? '20%' : '60% − US$ 20'})`,
      valor: impostoImportacao,
    });
    breakdown.push({ label: `ICMS (${ICMS_ALIQUOTA * 100}%, por dentro)`, valor: icms });


    custoExt += impostoImportacao + icms;
  }

  // Tax free: só existe em compra presencial (Viagem). O turista paga o preço cheio,
  // com IOF, e recupera parte do imposto local depois — por isso entra como abatimento
  // no fim, e não reduzindo a base do IOF. Incide apenas sobre o produto.
  if (cenario === 'Viagem' && taxFreePct > 0) {
    const reembolso = precoExt * (taxFreePct / 100) * cotacaoFinal;
    breakdown.push({
      label: `Reembolso tax free (−${taxFreePct.toFixed(1).replace('.', ',')}%)`,
      valor: -reembolso,
    });
    custoExt -= reembolso;
  }

  let custoBR = precoBR;
  if (parcelasBR > 1) {
    const valorParcela = precoBR / parcelasBR;
    custoBR = valorParcela * ((1 - Math.pow(1 + selicMensal, -parcelasBR)) / selicMensal);
  }

  const diff = custoBR - custoExt;
  const maisCaro = Math.max(custoBR, custoExt);

  return {
    valeImportar: diff > 0,
    custoBR,
    custoExt,
    economia: Math.abs(diff),
    economiaPct: maisCaro > 0 ? (Math.abs(diff) / maisCaro) * 100 : 0,
    breakdown,
    msg: diff > 0 ? '✈️ COMPRE NO EXTERIOR' : 'COMPRE NO BRASIL',
  };
}
