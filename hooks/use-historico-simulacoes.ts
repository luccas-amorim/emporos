import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import type { FormaPagamento, Moeda } from '@/core/calculadora';

export interface SimulacaoSalva {
  id: string;
  data: string; // ISO 8601
  nomeProduto?: string;
  link?: string;
  precoBR: number;
  parcelasBR: number;
  precoExt: number;
  moeda: Moeda;
  pgto: FormaPagamento;
  spread: number;
  valeImportar: boolean;
  custoBR: number;
  custoExt: number;
  economia: number;
}

const STORAGE_KEY = '@vale_importar:historico_simulacoes';
const LIMITE_HISTORICO = 50;

export function useHistoricoSimulacoes() {
  const [historico, setHistorico] = useState<SimulacaoSalva[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const bruto = await AsyncStorage.getItem(STORAGE_KEY);
        if (bruto) setHistorico(JSON.parse(bruto));
      } catch (error) {
        console.error('❌ Erro ao carregar histórico:', error);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  const adicionarSimulacao = useCallback((simulacao: Omit<SimulacaoSalva, 'id' | 'data'>) => {
    setHistorico((atual) => {
      const nova: SimulacaoSalva = {
        ...simulacao,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        data: new Date().toISOString(),
      };
      const atualizado = [nova, ...atual].slice(0, LIMITE_HISTORICO);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(atualizado)).catch((error) =>
        console.error('❌ Erro ao salvar histórico:', error)
      );
      return atualizado;
    });
  }, []);

  const limparHistorico = useCallback(() => {
    setHistorico([]);
    AsyncStorage.removeItem(STORAGE_KEY).catch((error) =>
      console.error('❌ Erro ao limpar histórico:', error)
    );
  }, []);

  return { historico, carregando, adicionarSimulacao, limparHistorico };
}
