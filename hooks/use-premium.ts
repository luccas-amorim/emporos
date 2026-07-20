import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = '@paridade:premium_desbloqueado';

// Gate da versão completa. Hoje o desbloqueio é apenas um flag local; quando o IAP
// for integrado (expo-in-app-purchases / RevenueCat), a compra confirmada chama
// desbloquear() e o restante do app não precisa mudar.
export function usePremium() {
  const [premium, setPremium] = useState(false);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((valor) => setPremium(valor === '1'))
      .catch(() => {})
      .finally(() => setCarregado(true));
  }, []);

  const desbloquear = useCallback(() => {
    setPremium(true);
    AsyncStorage.setItem(STORAGE_KEY, '1').catch(() => {});
  }, []);

  return { premium, carregado, desbloquear };
}
