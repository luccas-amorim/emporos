import { useCallback, useEffect, useState } from 'react';

import type { CurrencyCode } from '@/constants/currencies';
import { carregarSerie90d, type SerieMercado } from '@/services/mercado';

// Série de 90 dias da moeda (cache de um dia em services/mercado). `ativo` evita buscar
// enquanto a tela ou o sheet que precisa dela não está à vista.
export function useSerieCambio(moeda: CurrencyCode, ativo = true) {
  const [serie, setSerie] = useState<SerieMercado | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const nova = await carregarSerie90d(moeda);
    setSerie(nova);
    setCarregando(false);
  }, [moeda]);

  useEffect(() => {
    if (!ativo) return;
    let vivo = true;
    setCarregando(true);
    carregarSerie90d(moeda).then((nova) => {
      if (!vivo) return;
      setSerie(nova);
      setCarregando(false);
    });
    return () => {
      vivo = false;
    };
  }, [moeda, ativo]);

  return { serie, carregando, recarregar: carregar };
}
