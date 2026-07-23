import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = '@paridade:premium_desbloqueado';

interface PremiumContexto {
  premium: boolean;
  carregado: boolean;
  desbloquear: () => void;
  paywallVisivel: boolean;
  abrirPaywall: () => void;
  fecharPaywall: () => void;
}

// Contexto global: mantém o estado premium consistente entre as telas e permite abrir
// a paywall de qualquer lugar (Home, Histórico, seletor de moedas). Quando o IAP real
// for integrado, a compra confirmada chama desbloquear() e o resto do app não muda.
const Contexto = createContext<PremiumContexto | null>(null);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [premium, setPremium] = useState(false);
  const [carregado, setCarregado] = useState(false);
  const [paywallVisivel, setPaywallVisivel] = useState(false);

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

  const abrirPaywall = useCallback(() => setPaywallVisivel(true), []);
  const fecharPaywall = useCallback(() => setPaywallVisivel(false), []);

  return (
    <Contexto.Provider
      value={{ premium, carregado, desbloquear, paywallVisivel, abrirPaywall, fecharPaywall }}>
      {children}
    </Contexto.Provider>
  );
}

export function usePremium(): PremiumContexto {
  const ctx = useContext(Contexto);
  if (ctx) return ctx;
  // Fallback fora do provider (ex.: componente testado isoladamente): premium desligado.
  return {
    premium: false,
    carregado: true,
    desbloquear: () => {},
    paywallVisivel: false,
    abrirPaywall: () => {},
    fecharPaywall: () => {},
  };
}
