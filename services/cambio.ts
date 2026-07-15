import type { CurrencyCode } from '@/constants/currencies';

export interface Cotacoes {
  valores: Record<CurrencyCode, number>;
  usouFallback: boolean;
}

// AwesomeAPI (economia.awesomeapi.com.br): pública, gratuita, sem chave, e traz
// cotação comercial (bid/ask) bem mais próxima de tempo real do que o fechamento
// diário do BCE. Suporta todas as moedas que precisarmos numa única chamada.
const AWESOME_API_BASE = 'https://economia.awesomeapi.com.br/json/last';

const FALLBACK: Record<CurrencyCode, number> = {
  USD: 6.0,
  EUR: 6.5,
  GBP: 7.5,
  JPY: 0.035,
  ARS: 0.0045,
  CLP: 0.0055,
};

export async function buscarCotacoes(codigos: CurrencyCode[]): Promise<Cotacoes> {
  const pares = codigos.map((codigo) => `${codigo}-BRL`).join(',');

  try {
    const res = await fetch(`${AWESOME_API_BASE}/${pares}`);
    const data = await res.json();

    const valores = {} as Record<CurrencyCode, number>;
    let algumFallback = false;

    for (const codigo of codigos) {
      const par = data?.[`${codigo}BRL`];
      const bid = par?.bid ? parseFloat(par.bid) : NaN;
      const ask = par?.ask ? parseFloat(par.ask) : NaN;

      if (!Number.isNaN(bid) && !Number.isNaN(ask)) {
        valores[codigo] = (bid + ask) / 2;
      } else {
        valores[codigo] = FALLBACK[codigo];
        algumFallback = true;
      }
    }

    return { valores, usouFallback: algumFallback };
  } catch (error) {
    console.error('❌ Erro API Câmbio:', error);
    return { valores: { ...FALLBACK }, usouFallback: true };
  }
}
