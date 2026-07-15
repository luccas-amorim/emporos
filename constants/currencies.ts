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
