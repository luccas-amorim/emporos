import type { CurrencyCode } from '@/constants/currencies';

// AwesomeAPI (economia.awesomeapi.com.br): pública, gratuita, sem chave, e traz
// cotação comercial (bid/ask) bem mais próxima de tempo real do que o fechamento
// diário do BCE. Suporta todas as moedas que precisarmos numa única chamada.
const AWESOME_API_BASE = 'https://economia.awesomeapi.com.br/json/last';

// Lança em caso de falha de rede/formato — o fallback (cache ou padrão) é
// responsabilidade de services/mercado.ts, que sabe a idade de cada dado.
export async function buscarCotacoesRede(codigos: CurrencyCode[]): Promise<Record<CurrencyCode, number>> {
  const pares = codigos.map((codigo) => `${codigo}-BRL`).join(',');
  const res = await fetch(`${AWESOME_API_BASE}/${pares}`);
  if (!res.ok) throw new Error(`Câmbio: HTTP ${res.status}`);

  const data = await res.json();
  const valores = {} as Record<CurrencyCode, number>;

  for (const codigo of codigos) {
    const par = data?.[`${codigo}BRL`];
    const bid = par?.bid ? parseFloat(par.bid) : NaN;
    const ask = par?.ask ? parseFloat(par.ask) : NaN;
    if (Number.isNaN(bid) || Number.isNaN(ask)) {
      throw new Error(`Câmbio: resposta sem bid/ask para ${codigo}`);
    }
    valores[codigo] = (bid + ask) / 2;
  }

  return valores;
}
