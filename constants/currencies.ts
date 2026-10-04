import type { FlagCode } from '@/components/flag-icon';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'ARS' | 'CLP';

export interface Currency {
  code: CurrencyCode;
  nome: string;
  bandeira: FlagCode;
  /** Prefixo dos valores ("US$ 399"). */
  simbolo: string;
  /** Nome em frase, com artigo: "Importar passa a valer a pena com o dólar abaixo de…". */
  nomeFrase: string;
}

export const MOEDAS: Currency[] = [
  { code: 'USD', nome: 'Dólar Americano', bandeira: 'US', simbolo: 'US$', nomeFrase: 'o dólar' },
  { code: 'EUR', nome: 'Euro', bandeira: 'EU', simbolo: '€', nomeFrase: 'o euro' },
  { code: 'GBP', nome: 'Libra Esterlina', bandeira: 'GB', simbolo: '£', nomeFrase: 'a libra' },
  { code: 'JPY', nome: 'Iene Japonês', bandeira: 'JP', simbolo: '¥', nomeFrase: 'o iene' },
  { code: 'ARS', nome: 'Peso Argentino', bandeira: 'AR', simbolo: 'ARS', nomeFrase: 'o peso argentino' },
  { code: 'CLP', nome: 'Peso Chileno', bandeira: 'CL', simbolo: 'CLP', nomeFrase: 'o peso chileno' },
];

export const CODIGOS_MOEDA: CurrencyCode[] = MOEDAS.map((m) => m.code);

export function ehCodigoMoeda(valor: string | null | undefined): valor is CurrencyCode {
  return !!valor && (CODIGOS_MOEDA as string[]).includes(valor);
}

export function moedaPorCodigo(code: CurrencyCode): Currency {
  return MOEDAS.find((m) => m.code === code)!;
}

// Par exibido no status box: a moeda selecionada sempre em primeiro; a segunda é a
// outra do par USD/EUR (se USD está selecionado mostra EUR ao lado, e vice-versa —
// elas apenas trocam de posição quando a seleção muda, sem quebrar a jornada).
export function parStatus(selecionada: CurrencyCode): [CurrencyCode, CurrencyCode] {
  return [selecionada, selecionada === 'USD' ? 'EUR' : 'USD'];
}
