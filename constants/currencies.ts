import type { FlagCode } from '@/components/flag-icon';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'ARS' | 'CLP';

export interface Currency {
  code: CurrencyCode;
  nome: string;
  bandeira: FlagCode;
  premium: boolean; // moedas premium ficam disponíveis apenas na versão completa
}

export const MOEDAS: Currency[] = [
  { code: 'USD', nome: 'Dólar Americano', bandeira: 'US', premium: false },
  { code: 'EUR', nome: 'Euro', bandeira: 'EU', premium: false },
  { code: 'GBP', nome: 'Libra Esterlina', bandeira: 'GB', premium: true },
  { code: 'JPY', nome: 'Iene Japonês', bandeira: 'JP', premium: true },
  { code: 'ARS', nome: 'Peso Argentino', bandeira: 'AR', premium: true },
  { code: 'CLP', nome: 'Peso Chileno', bandeira: 'CL', premium: true },
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
