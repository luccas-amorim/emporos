import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export const LIMITE_CALCULOS_GRATIS = 5;

const STORAGE_KEY = '@paridade:calculos_usados';

// Conta os cálculos feitos na versão gratuita. O contador vive no aparelho: quem
// desinstalar e reinstalar zera — trade-off aceito (blindar exigiria servidor).
export function useContadorCalculos() {
  const [usados, setUsados] = useState(0);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((valor) => {
        const n = parseInt(valor ?? '0', 10);
        if (!Number.isNaN(n)) setUsados(n);
      })
      .catch(() => {})
      .finally(() => setCarregado(true));
  }, []);

  const registrar = useCallback(() => {
    setUsados((atual) => {
      const novo = atual + 1;
      AsyncStorage.setItem(STORAGE_KEY, String(novo)).catch(() => {});
      return novo;
    });
  }, []);

  return {
    usados,
    carregado,
    registrar,
    restantes: Math.max(0, LIMITE_CALCULOS_GRATIS - usados),
    atingiuLimite: usados >= LIMITE_CALCULOS_GRATIS,
  };
}
