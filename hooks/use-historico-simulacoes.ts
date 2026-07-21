import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { CurrencyCode } from '@/constants/currencies';
import type { Cenario, FormaPagamento } from '@/core/calculadora';

export interface SimulacaoSalva {
  id: string;
  data: string; // ISO 8601
  nomeProduto?: string;
  link?: string;
  observacao?: string;
  precoBR: number;
  parcelasBR: number;
  precoExt: number;
  moeda: CurrencyCode;
  pgto: FormaPagamento;
  spread: number;
  valeImportar: boolean;
  custoBR: number;
  custoExt: number;
  economia: number;
  // Campos adicionados depois do lançamento do histórico — opcionais para
  // manter compatibilidade com simulações já salvas no aparelho.
  cenario?: Cenario;
  freteExt?: number;
  cotacao?: number;
  selicAnual?: number;
}

const STORAGE_KEY = '@vale_importar:historico_simulacoes';
const LIMITE_HISTORICO = 50;

export function useHistoricoSimulacoes() {
  const [historico, setHistorico] = useState<SimulacaoSalva[]>([]);
  const [carregando, setCarregando] = useState(true);
  const carregouDoStorage = useRef(false);

  useEffect(() => {
    async function carregar() {
      try {
        const bruto = await AsyncStorage.getItem(STORAGE_KEY);
        if (bruto) setHistorico(JSON.parse(bruto));
      } catch (error) {
        console.error('❌ Erro ao carregar histórico:', error);
      } finally {
        carregouDoStorage.current = true;
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  // Persiste sempre que o histórico mudar, num efeito próprio — evita side effects
  // dentro do updater de setState (que pode rodar mais de uma vez) e evita sobrescrever
  // o storage com [] antes do carregamento inicial terminar.
  useEffect(() => {
    if (!carregouDoStorage.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(historico)).catch((error) =>
      console.error('❌ Erro ao salvar histórico:', error)
    );
  }, [historico]);

  const adicionarSimulacao = useCallback((simulacao: Omit<SimulacaoSalva, 'id' | 'data'>) => {
    const nova: SimulacaoSalva = {
      ...simulacao,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      data: new Date().toISOString(),
    };
    setHistorico((atual) => [nova, ...atual].slice(0, LIMITE_HISTORICO));
  }, []);

  const removerSimulacao = useCallback((id: string) => {
    setHistorico((atual) => atual.filter((item) => item.id !== id));
  }, []);

  const limparHistorico = useCallback(() => {
    setHistorico([]);
  }, []);

  return { historico, carregando, adicionarSimulacao, removerSimulacao, limparHistorico };
}
