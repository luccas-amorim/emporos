export type FormaPagamento = 'Cartao' | 'Dinheiro';

export interface CalculoInput {
  precoBR: number;
  parcelasBR: number;
  precoExt: number;
  cotacao: number; // cotação comercial já resolvida da moeda escolhida (BRL por 1 unidade)
  spread: number;
  pgto: FormaPagamento;
  selicMensal: number;
  iofCartao: number;
  iofDinheiro: number;
}

export interface CalculoResultado {
  valeImportar: boolean;
  custoBR: number;
  custoExt: number;
  economia: number;
  msg: string;
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
  const { precoBR, parcelasBR, precoExt, cotacao, spread, pgto, selicMensal, iofCartao, iofDinheiro } = input;

  const cotacaoFinal = cotacao * (1 + spread / 100);
  const iofFinal = pgto === 'Dinheiro' ? iofDinheiro : iofCartao;

  const custoExt = precoExt * cotacaoFinal * (1 + iofFinal);

  let custoBR = precoBR;
  if (parcelasBR > 1) {
    const valorParcela = precoBR / parcelasBR;
    custoBR = valorParcela * ((1 - Math.pow(1 + selicMensal, -parcelasBR)) / selicMensal);
  }

  const diff = custoBR - custoExt;

  return {
    valeImportar: diff > 0,
    custoBR,
    custoExt,
    economia: Math.abs(diff),
    msg: diff > 0 ? '✈️ COMPRE NO EXTERIOR' : 'COMPRE NO BRASIL',
  };
}
