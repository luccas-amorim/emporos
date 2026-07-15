export interface Cotacoes {
  cotacaoDolar: number;
  cotacaoEuro: number;
  usouFallback: boolean;
}

// api.frankfurter.app passou a redirecionar (301) para este domínio; chamamos
// direto para evitar depender do redirect ser seguido corretamente em toda plataforma.
const FRANKFURTER_BASE = 'https://api.frankfurter.dev/v1';

const FALLBACK = { cotacaoDolar: 6.0, cotacaoEuro: 6.5 };

async function buscarCotacao(from: 'USD' | 'EUR'): Promise<number | null> {
  const res = await fetch(`${FRANKFURTER_BASE}/latest?from=${from}&to=BRL`);
  const data = await res.json();
  return data?.rates?.BRL ?? null;
}

export async function buscarCotacoes(): Promise<Cotacoes> {
  try {
    const [dolar, euro] = await Promise.all([buscarCotacao('USD'), buscarCotacao('EUR')]);
    return {
      cotacaoDolar: dolar ?? FALLBACK.cotacaoDolar,
      cotacaoEuro: euro ?? FALLBACK.cotacaoEuro,
      usouFallback: dolar === null || euro === null,
    };
  } catch (error) {
    console.error('❌ Erro API Câmbio:', error);
    return { ...FALLBACK, usouFallback: true };
  }
}
