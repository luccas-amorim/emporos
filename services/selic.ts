export interface Selic {
  selicAnual: number;
  selicMensal: number;
}

const FALLBACK: Selic = { selicAnual: 11.25, selicMensal: 0.0089 };

export function taxaMensalEquivalente(taxaAnualPercentual: number): number {
  return Math.pow(1 + taxaAnualPercentual / 100, 1 / 12) - 1;
}

export async function buscarSelic(): Promise<Selic> {
  try {
    const res = await fetch(
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json'
    );
    const dados = await res.json();

    if (Array.isArray(dados) && dados.length > 0) {
      const selicAnual = parseFloat(dados[0].valor);
      return { selicAnual, selicMensal: taxaMensalEquivalente(selicAnual) };
    }
    return FALLBACK;
  } catch (error) {
    console.error('❌ Erro API Selic:', error);
    return FALLBACK;
  }
}
