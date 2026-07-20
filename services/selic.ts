export interface Selic {
  selicAnual: number;
  selicMensal: number;
}

export function taxaMensalEquivalente(taxaAnualPercentual: number): number {
  return Math.pow(1 + taxaAnualPercentual / 100, 1 / 12) - 1;
}

// Lança em caso de falha — o fallback fica em services/mercado.ts.
export async function buscarSelicRede(): Promise<Selic> {
  const res = await fetch(
    'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json'
  );
  if (!res.ok) throw new Error(`Selic: HTTP ${res.status}`);

  const dados = await res.json();
  if (!Array.isArray(dados) || dados.length === 0) {
    throw new Error('Selic: resposta vazia');
  }

  const selicAnual = parseFloat(dados[0].valor);
  if (Number.isNaN(selicAnual)) throw new Error('Selic: valor inválido');

  return { selicAnual, selicMensal: taxaMensalEquivalente(selicAnual) };
}
