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

export type TipoItemBreakdown = 'produto' | 'iof' | 'ii' | 'icms' | 'taxFree';
/** Regra de Imposto de Importação aplicada à encomenda. */
export type RegraII = 'faixaBaixa' | 'faixaAlta' | 'foraRemessaConforme';

export interface ItemBreakdown {
  tipo: TipoItemBreakdown;
  label: string;
  valor: number;
  /** Alíquota aplicada (IOF, II, ICMS, tax free), quando houver. */
  aliquota?: number;
  regraII?: RegraII;
}

export type Veredito = 'brasil' | 'exterior' | 'empate';

/** Abaixo desta diferença (% sobre a opção mais cara), o resultado é "Tanto faz.". */
export const LIMITE_EMPATE_PCT = 1;

export interface CalculoResultado {
  valeImportar: boolean;
  /** Como valeImportar, mas com empate quando a diferença é menor que LIMITE_EMPATE_PCT. */
  veredito: Veredito;
  custoBR: number;
  custoExt: number;
  economia: number;
  economiaPct: number; // % de economia sobre a opção mais cara
  breakdown: ItemBreakdown[];
  /** Situações que o cálculo não cobre e o usuário precisa saber. */
  avisos: string[];
  msg: string;
  /**
   * Cotação comercial da moeda em que as duas opções empatam (ver calcularPontoDeVirada).
   * Infinity quando não há custo no exterior.
   */
  pontoDeVirada: number;
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

  breakdown.push({
    tipo: 'produto',
    label: `Produto${cenario === 'Encomenda' && freteExt > 0 ? ' + frete' : ''} (câmbio + spread)`,
    valor: valorPagamento,
  });
  breakdown.push({ tipo: 'iof', label: `IOF (${rotuloAliquota(iofFinal)})`, valor: valorIOF, aliquota: iofFinal });

  let custoExt = valorPagamento + valorIOF;
  const emUSD = (valorBRL: number) => (cotacaoUSD > 0 ? valorBRL / cotacaoUSD : Infinity);

  if (cenario === 'Encomenda') {
    // Tributos incidem sobre o valor aduaneiro (produto + frete) pela cotação comercial,
    // sem IOF, pois são cobrados em reais.
    const valorAduaneiro = valorMoedaExt * cotacao;
    const valorUSD = emUSD(valorAduaneiro);

    let impostoImportacao: number;
    let rotuloII: string;
    let regraII: RegraII;
    let aliquotaII: number;
    if (!siteCertificado) {
      regraII = 'foraRemessaConforme';
      aliquotaII = REGRAS_FISCAIS.aliquotaForaRemessaConforme;
      impostoImportacao = valorAduaneiro * aliquotaII;
      rotuloII = `${rotuloAliquota(aliquotaII)}, site fora do Remessa Conforme`;
    } else if (valorUSD <= rc.limiteFaixaBaixaUSD) {
      regraII = 'faixaBaixa';
      aliquotaII = rc.aliquotaFaixaBaixa;
      impostoImportacao = valorAduaneiro * aliquotaII;
      rotuloII = `${rotuloAliquota(aliquotaII)} até US$ ${rc.limiteFaixaBaixaUSD}`;
    } else {
      regraII = 'faixaAlta';
      aliquotaII = rc.aliquotaFaixaAlta;
      impostoImportacao = Math.max(0, valorAduaneiro * aliquotaII - rc.descontoFaixaAltaUSD * cotacaoUSD);
      rotuloII = `${rotuloAliquota(aliquotaII)} − US$ ${rc.descontoFaixaAltaUSD}`;
    }

    const baseICMS = valorAduaneiro + impostoImportacao;
    const valorICMS = (baseICMS / (1 - aliquotaICMS)) * aliquotaICMS;

    breakdown.push({
      tipo: 'ii',
      label: `Imposto de Importação (${rotuloII})`,
      valor: impostoImportacao,
      aliquota: aliquotaII,
      regraII,
    });
    breakdown.push({
      tipo: 'icms',
      label: `ICMS (${rotuloAliquota(aliquotaICMS)}, por dentro)`,
      valor: valorICMS,
      aliquota: aliquotaICMS,
    });

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
      tipo: 'taxFree',
      label: `Reembolso tax free (−${taxFreePct.toFixed(1).replace('.', ',')}%)`,
      valor: -reembolso,
      aliquota: taxFreePct / 100,
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
  const economiaPct = maisCaro > 0 ? (Math.abs(diff) / maisCaro) * 100 : 0;
  const veredito = vereditoDeCustos(custoBR, custoExt);

  return {
    valeImportar: diff > 0,
    veredito,
    custoBR,
    custoExt,
    economia: Math.abs(diff),
    economiaPct,
    breakdown,
    avisos,
    msg: TEXTO_VEREDITO[veredito],
    pontoDeVirada: custoExt > 0 ? (cotacao * custoBR) / custoExt : Infinity,
  };
}

/** Veredito a partir dos dois custos (também usado nas simulações salvas). */
export function vereditoDeCustos(custoBR: number, custoExt: number): Veredito {
  const maisCaro = Math.max(custoBR, custoExt);
  const pct = maisCaro > 0 ? (Math.abs(custoBR - custoExt) / maisCaro) * 100 : 0;
  if (pct < LIMITE_EMPATE_PCT) return 'empate';
  return custoBR > custoExt ? 'exterior' : 'brasil';
}

export const TEXTO_VEREDITO: Record<Veredito, string> = {
  brasil: 'Compre no Brasil.',
  exterior: 'Vale importar.',
  empate: 'Tanto faz.',
};

// Ponto de virada: a cotação comercial da moeda em que importar e comprar no Brasil
// custam o mesmo. O custo de importar é linear na cotação — câmbio, IOF, II, ICMS por
// dentro e tax free são proporcionais ao valor convertido —, e as faixas do Remessa
// Conforme e a cota de bagagem são definidas em US$, então não mudam se o real se
// valorizar ou desvalorizar contra todas as moedas na mesma proporção. Logo:
//   custoExt(k · cotação) = k · custoExt(cotação)  →  k* = custoBR ÷ custoExt.
// (O desconto de US$ 30 também escala com a cotação do dólar; o excedente da cota de
// bagagem não entra no cálculo, só no aviso.)
export function calcularPontoDeVirada(input: CalculoInput): number {
  return calcularParidade(input).pontoDeVirada;
}

// Alíquota (0,035) como texto curto ("3,5%"; "60%" sem casas quando inteira).
export function rotuloAliquota(aliquota: number): string {
  const v = Math.round(aliquota * 1000) / 10;
  return formatarPct(v, Number.isInteger(v) ? 0 : 1);
}
