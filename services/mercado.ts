import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CurrencyCode } from '@/constants/currencies';
import { buscarCotacoesRede } from '@/services/cambio';
import { buscarSelicRede, taxaMensalEquivalente } from '@/services/selic';

export type OrigemDados = 'rede' | 'cache' | 'padrao';

export interface DadosMercado {
  cotacoes: Record<CurrencyCode, number>;
  selicAnual: number;
  selicMensal: number;
  atualizadoEm: string; // ISO 8601
  origem: OrigemDados;
}

const CACHE_KEY = '@paridade:dados_mercado';

// Último recurso, usado apenas se nunca houve uma busca bem-sucedida neste aparelho.
const PADRAO: Omit<DadosMercado, 'origem'> = {
  cotacoes: { USD: 5.1, EUR: 5.8, GBP: 6.9, JPY: 0.031, ARS: 0.0035, CLP: 0.0055 },
  selicAnual: 14.25,
  selicMensal: taxaMensalEquivalente(14.25),
  atualizadoEm: '2026-07-15T00:00:00.000Z',
};

async function lerCache(): Promise<Omit<DadosMercado, 'origem'> | null> {
  try {
    const bruto = await AsyncStorage.getItem(CACHE_KEY);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

export async function carregarDadosMercado(codigos: CurrencyCode[]): Promise<DadosMercado> {
  const [resCotacoes, resSelic] = await Promise.allSettled([buscarCotacoesRede(codigos), buscarSelicRede()]);

  if (resCotacoes.status === 'fulfilled' && resSelic.status === 'fulfilled') {
    const frescos: Omit<DadosMercado, 'origem'> = {
      cotacoes: resCotacoes.value,
      selicAnual: resSelic.value.selicAnual,
      selicMensal: resSelic.value.selicMensal,
      atualizadoEm: new Date().toISOString(),
    };
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(frescos)).catch(() => {});
    return { ...frescos, origem: 'rede' };
  }

  if (resCotacoes.status === 'rejected') console.error('❌ Erro API Câmbio:', resCotacoes.reason);
  if (resSelic.status === 'rejected') console.error('❌ Erro API Selic:', resSelic.reason);

  // Falha parcial ou total: completa com a última carga boa. O timestamp exibido é o do
  // cache (o dado mais antigo em uso), para nunca sugerir que tudo está fresco.
  const cache = await lerCache();
  const base = cache ?? PADRAO;

  return {
    cotacoes: resCotacoes.status === 'fulfilled' ? resCotacoes.value : base.cotacoes,
    selicAnual: resSelic.status === 'fulfilled' ? resSelic.value.selicAnual : base.selicAnual,
    selicMensal: resSelic.status === 'fulfilled' ? resSelic.value.selicMensal : base.selicMensal,
    atualizadoEm: base.atualizadoEm,
    origem: cache ? 'cache' : 'padrao',
  };
}

export function descreverIdade(atualizadoEmISO: string): string {
  const ms = Date.now() - new Date(atualizadoEmISO).getTime();
  const minutos = Math.floor(ms / 60000);
  if (minutos < 1) return 'agora mesmo';
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `há ${dias} dia${dias > 1 ? 's' : ''}`;
}
