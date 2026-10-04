import { useSyncExternalStore } from 'react';

import type { CurrencyCode } from '@/constants/currencies';
import type { CalculoInput, CalculoResultado } from '@/core/calculadora';
import type { RegistroSimulacao } from '@/hooks/use-formulario-calculo';
import type { DadosMercado } from '@/services/mercado';

// A comparação que a tela de Resultado mostra. Comparar (ou o Histórico) monta e
// empurra a rota; o Resultado lê daqui, sem passar objetos grandes por parâmetro.
export interface SimulacaoAtual {
  entrada: CalculoInput;
  registro: RegistroSimulacao;
  resultado: CalculoResultado;
  dados: DadosMercado;
  moeda: CurrencyCode;
  /** Id no histórico, quando a simulação já está salva. */
  salvaComo?: string;
}

let atual: SimulacaoAtual | null = null;
const ouvintes = new Set<() => void>();

export function definirSimulacaoAtual(simulacao: SimulacaoAtual | null) {
  atual = simulacao;
  ouvintes.forEach((ouvinte) => ouvinte());
}

export function marcarSimulacaoSalva(id: string) {
  if (atual) definirSimulacaoAtual({ ...atual, salvaComo: id });
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

export function useSimulacaoAtual(): SimulacaoAtual | null {
  return useSyncExternalStore(assinar, () => atual);
}
