import type { FlagCode } from '@/components/flag-icon';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'ARS' | 'CLP';

export interface Currency {
  code: CurrencyCode;
  nome: string;
  bandeira: FlagCode;
}

export const MOEDAS: Currency[] = [
  { code: 'USD', nome: 'Dólar Americano', bandeira: 'US' },
  { code: 'EUR', nome: 'Euro', bandeira: 'EU' },
  { code: 'GBP', nome: 'Libra Esterlina', bandeira: 'GB' },
  { code: 'JPY', nome: 'Iene Japonês', bandeira: 'JP' },
  { code: 'ARS', nome: 'Peso Argentino', bandeira: 'AR' },
  { code: 'CLP', nome: 'Peso Chileno', bandeira: 'CL' },
];

export function moedaPorCodigo(code: CurrencyCode): Currency {
  return MOEDAS.find((m) => m.code === code)!;
}

// Par exibido no status box: a moeda selecionada sempre em primeiro; a segunda é a
// outra do par USD/EUR (se USD está selecionado mostra EUR ao lado, e vice-versa —
// elas apenas trocam de posição quando a seleção muda, sem quebrar a jornada).
export function parStatus(selecionada: CurrencyCode): [CurrencyCode, CurrencyCode] {
  return [selecionada, selecionada === 'USD' ? 'EUR' : 'USD'];
}
