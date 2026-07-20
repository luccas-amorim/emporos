import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { CurrencyCode } from '@/constants/currencies';
import type { AlertaCambio, DirecaoAlerta } from '@/services/alertas';

const STORAGE_KEY = '@paridade:alertas_cambio';
const LIMITE_ALERTAS = 20;

export function useAlertasCambio() {
  const [alertas, setAlertas] = useState<AlertaCambio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const carregou = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((bruto) => {
        if (bruto) setAlertas(JSON.parse(bruto));
      })
      .catch((error) => console.error('❌ Erro ao carregar alertas:', error))
      .finally(() => {
        carregou.current = true;
        setCarregando(false);
      });
  }, []);

  useEffect(() => {
    if (!carregou.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(alertas)).catch((error) =>
      console.error('❌ Erro ao salvar alertas:', error)
    );
  }, [alertas]);

  const adicionarAlerta = useCallback((moeda: CurrencyCode, alvo: number, direcao: DirecaoAlerta) => {
    const novo: AlertaCambio = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      moeda,
      alvo,
      direcao,
      criadoEm: new Date().toISOString(),
    };
    setAlertas((atual) => [novo, ...atual].slice(0, LIMITE_ALERTAS));
  }, []);

  const removerAlerta = useCallback((id: string) => {
    setAlertas((atual) => atual.filter((a) => a.id !== id));
  }, []);

  return { alertas, carregando, adicionarAlerta, removerAlerta };
}
