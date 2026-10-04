// Regras fiscais usadas no cálculo, num lugar só e com data de revisão.
//
// Ao mudar qualquer valor: confira a fonte, atualize `revisadoEm` e o CHANGELOG. A data
// aparece para o usuário junto do resultado, para ele saber de quando são as regras.

export interface Fonte {
  regra: string;
  norma: string;
  url: string;
}

export const REGRAS_FISCAIS = {
  /** Data (AAAA-MM-DD) da última conferência de todas as regras abaixo. */
  revisadoEm: '2026-10-03',

  iof: {
    /** Compras no exterior com cartão de crédito, débito ou pré-pago. */
    cartao: 0.035,
    /** Compra de moeda estrangeira em espécie. */
    especie: 0.035,
  },

  /** Encomendas de sites certificados no Programa Remessa Conforme (pessoa física). */
  remessaConforme: {
    limiteFaixaBaixaUSD: 50,
    aliquotaFaixaBaixa: 0,
    aliquotaFaixaAlta: 0.6,
    descontoFaixaAltaUSD: 30,
    /** Acima deste valor a compra sai do regime de tributação simplificada. */
    limiteRegimeUSD: 3000,
  },

  /** Encomendas de sites fora do Remessa Conforme: alíquota cheia, sem desconto. */
  aliquotaForaRemessaConforme: 0.6,

  /** ICMS sobre importação: varia por estado, cobrado "por dentro". */
  icms: {
    opcoes: [0.17, 0.2],
    padrao: 0.17,
  },

  /** Cota de isenção de bagagem (chegada por via aérea ou marítima). */
  bagagem: {
    cotaUSD: 1000,
    aliquotaExcedente: 0.5,
  },
} as const;

export type AliquotaICMS = (typeof REGRAS_FISCAIS.icms.opcoes)[number];

export const FONTES_FISCAIS: Fonte[] = [
  {
    regra: 'IOF de 3,5% (cartão e espécie)',
    norma: 'Decreto nº 6.306/2007, com redação do Decreto nº 12.499/2025',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/D12499.htm',
  },
  {
    regra: 'Remessa Conforme: II 0% até US$ 50; 60% − US$ 30 acima',
    norma: 'Portaria MF nº 1.342/2026',
    url: 'https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/remessas-postal-e-expressa/preciso-pagar-impostos-nas-compras-internacionais/quanto-pagarei-de-imposto',
  },
  {
    regra: 'ICMS de 17% a 20%, conforme o estado',
    norma: 'Tabela do Comsefaz',
    url: 'https://comsefaz.org.br/novo/informacoes-fiscais/',
  },
  {
    regra: 'Cota de bagagem de US$ 1.000; 50% sobre o excedente',
    norma: 'Receita Federal — Guia do Viajante',
    url: 'https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/viagens-internacionais/guia-do-viajante',
  },
];

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "out/2026" a partir de "2026-10-03". */
export function rotuloRevisao(revisadoEm: string = REGRAS_FISCAIS.revisadoEm): string {
  const [ano, mes] = revisadoEm.split('-');
  return `${MESES[Number(mes) - 1]}/${ano}`;
}
