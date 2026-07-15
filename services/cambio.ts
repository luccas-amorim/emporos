export interface Cotacoes {
  cotacaoDolar: number;
  cotacaoEuro: number;
}

const FALLBACK: Cotacoes = { cotacaoDolar: 6.0, cotacaoEuro: 6.5 };

async function buscarCotacao(from: 'USD' | 'EUR'): Promise<number | null> {
  const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=BRL`);
  const data = await res.json();
  return data?.rates?.BRL ?? null;
}

export async function buscarCotacoes(): Promise<Cotacoes> {
  try {
    const [dolar, euro] = await Promise.all([buscarCotacao('USD'), buscarCotacao('EUR')]);
    return {
      cotacaoDolar: dolar ?? FALLBACK.cotacaoDolar,
      cotacaoEuro: euro ?? FALLBACK.cotacaoEuro,
    };
  } catch (error) {
    console.error('❌ Erro API Câmbio:', error);
    return FALLBACK;
  }
}
