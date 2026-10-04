import { REGRAS_FISCAIS } from '@/constants/regras-fiscais';
import { formatarNumeroBR, formatarPct } from '@/core/formato';

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
  /** Alíquota de ICMS do estado de destino (só Encomenda). */
  icms: number;
  /** Site certificado no Remessa Conforme (só Encomenda). */
  siteCertificado: boolean;
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
  /** Situações que o cálculo não cobre e o usuário precisa saber. */
  avisos: string[];
  msg: string;
}

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
    icms: aliquotaICMS,
    siteCertificado,
  } = input;
  const { remessaConforme: rc, bagagem } = REGRAS_FISCAIS;
  const avisos: string[] = [];

  const cotacaoFinal = cotacao * (1 + spread / 100);
  const iofFinal = pgto === 'Dinheiro' ? iofDinheiro : iofCartao;

  const breakdown: ItemBreakdown[] = [];

  // Pagamento internacional (produto + frete) — IOF incide sobre a operação de câmbio.
  const valorMoedaExt = precoExt + (cenario === 'Encomenda' ? freteExt : 0);
  const valorPagamento = valorMoedaExt * cotacaoFinal;
  const valorIOF = valorPagamento * iofFinal;

  breakdown.push({ label: `Produto${cenario === 'Encomenda' && freteExt > 0 ? ' + frete' : ''} (câmbio + spread)`, valor: valorPagamento });
  breakdown.push({ label: `IOF (${rotuloAliquota(iofFinal)})`, valor: valorIOF });

  let custoExt = valorPagamento + valorIOF;
  const emUSD = (valorBRL: number) => (cotacaoUSD > 0 ? valorBRL / cotacaoUSD : Infinity);

  if (cenario === 'Encomenda') {
    // Tributos incidem sobre o valor aduaneiro (produto + frete) pela cotação comercial,
    // sem IOF, pois são cobrados em reais.
    const valorAduaneiro = valorMoedaExt * cotacao;
    const valorUSD = emUSD(valorAduaneiro);

    let impostoImportacao: number;
    let rotuloII: string;
    if (!siteCertificado) {
      impostoImportacao = valorAduaneiro * REGRAS_FISCAIS.aliquotaForaRemessaConforme;
      rotuloII = `${rotuloAliquota(REGRAS_FISCAIS.aliquotaForaRemessaConforme)}, site fora do Remessa Conforme`;
    } else if (valorUSD <= rc.limiteFaixaBaixaUSD) {
      impostoImportacao = valorAduaneiro * rc.aliquotaFaixaBaixa;
      rotuloII = `${rotuloAliquota(rc.aliquotaFaixaBaixa)} até US$ ${rc.limiteFaixaBaixaUSD}`;
    } else {
      impostoImportacao = Math.max(
        0,
        valorAduaneiro * rc.aliquotaFaixaAlta - rc.descontoFaixaAltaUSD * cotacaoUSD
      );
      rotuloII = `${rotuloAliquota(rc.aliquotaFaixaAlta)} − US$ ${rc.descontoFaixaAltaUSD}`;
    }

    const baseICMS = valorAduaneiro + impostoImportacao;
    const valorICMS = (baseICMS / (1 - aliquotaICMS)) * aliquotaICMS;

    breakdown.push({ label: `Imposto de Importação (${rotuloII})`, valor: impostoImportacao });
    breakdown.push({ label: `ICMS (${rotuloAliquota(aliquotaICMS)}, por dentro)`, valor: valorICMS });

    custoExt += impostoImportacao + valorICMS;

    if (valorUSD > rc.limiteRegimeUSD) {
      avisos.push(
        `Acima de US$ ${formatarNumeroBR(rc.limiteRegimeUSD, 0)}, a encomenda sai do regime simplificado e segue a importação comum — este cálculo não vale para esse caso.`
      );
    }
  } else if (emUSD(precoExt * cotacao) > bagagem.cotaUSD) {
    avisos.push(
      `Passa da cota de isenção de US$ ${formatarNumeroBR(bagagem.cotaUSD, 0)} na bagagem: a Receita cobra ${rotuloAliquota(bagagem.aliquotaExcedente)} sobre o excedente, valor não incluído no cálculo.`
    );
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
    avisos,
    msg: diff > 0 ? '✈️ COMPRE NO EXTERIOR' : 'COMPRE NO BRASIL',
  };
}

// Alíquota (0,035) como texto curto ("3,5%"; "60%" sem casas quando inteira).
export function rotuloAliquota(aliquota: number): string {
  const v = Math.round(aliquota * 1000) / 10;
  return formatarPct(v, Number.isInteger(v) ? 0 : 1);
}
