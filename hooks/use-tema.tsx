import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { Colors, type Paleta } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CHAVES, lerComMigracao } from '@/services/armazenamento';

export type PreferenciaTema = 'auto' | 'claro' | 'escuro';

interface TemaContexto {
  cores: Paleta;
  escuro: boolean;
  preferencia: PreferenciaTema;
  definirPreferencia: (p: PreferenciaTema) => void;
}

const Contexto = createContext<TemaContexto | null>(null);

export function TemaProvider({ children }: { children: React.ReactNode }) {
  const sistema = useColorScheme();
  const [preferencia, setPreferencia] = useState<PreferenciaTema>('auto');

  useEffect(() => {
    lerComMigracao(CHAVES.tema)
      .then((salva) => {
        if (salva === 'claro' || salva === 'escuro' || salva === 'auto') setPreferencia(salva);
      })
      .catch(() => {});
  }, []);

  const definirPreferencia = useCallback((p: PreferenciaTema) => {
    setPreferencia(p);
    AsyncStorage.setItem(CHAVES.tema, p).catch(() => {});
  }, []);

  const escuro = preferencia === 'auto' ? sistema === 'dark' : preferencia === 'escuro';

  return (
    <Contexto.Provider
      value={{ cores: escuro ? Colors.dark : Colors.light, escuro, preferencia, definirPreferencia }}>
      {children}
    </Contexto.Provider>
  );
}

export function useTema(): TemaContexto {
  // Ambos os hooks são chamados incondicionalmente (regra dos hooks); o do sistema
  // só é usado no fallback fora do provider (ex.: testes de componente isolado).
  const sistema = useColorScheme();
  const contexto = useContext(Contexto);
  if (contexto) return contexto;

  const escuro = sistema === 'dark';
  return {
    cores: escuro ? Colors.dark : Colors.light,
    escuro,
    preferencia: 'auto',
    definirPreferencia: () => {},
  };
}
