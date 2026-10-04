import type { CurrencyCode } from '@/constants/currencies';
import type { PontoSerie } from '@/core/cambio';

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

const AWESOME_API_DIARIO = 'https://economia.awesomeapi.com.br/json/daily';

// Série diária (dias úteis) da AwesomeAPI, em ordem cronológica. A API devolve da mais
// recente para a mais antiga; cada item tem bid/ask e o timestamp em segundos.
export async function buscarSerieRede(codigo: CurrencyCode, dias = 90): Promise<PontoSerie[]> {
  const res = await fetch(`${AWESOME_API_DIARIO}/${codigo}-BRL/${dias}`);
  if (!res.ok) throw new Error(`Série: HTTP ${res.status}`);

  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Série: resposta inesperada');

  const pontos: PontoSerie[] = [];
  for (const item of data) {
    const bid = parseFloat(item?.bid);
    const ask = parseFloat(item?.ask);
    const segundos = Number(item?.timestamp);
    if (Number.isNaN(bid) || Number.isNaN(ask) || !Number.isFinite(segundos)) continue;
    pontos.push({ data: segundos * 1000, valor: (bid + ask) / 2 });
  }
  if (pontos.length < 2) throw new Error('Série: poucos pontos');
  return pontos.sort((a, b) => a.data - b.data);
}
