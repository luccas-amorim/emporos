import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CurrencyCode } from '@/constants/currencies';
import { CHAVES, lerComMigracao } from '@/services/armazenamento';
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

// Último recurso, usado apenas se nunca houve uma busca bem-sucedida neste aparelho.
const PADRAO: Omit<DadosMercado, 'origem'> = {
  cotacoes: { USD: 5.1, EUR: 5.8, GBP: 6.9, JPY: 0.031, ARS: 0.0035, CLP: 0.0055 },
  selicAnual: 14.25,
  selicMensal: taxaMensalEquivalente(14.25),
  atualizadoEm: '2026-07-15T00:00:00.000Z',
};

async function lerCache(): Promise<Omit<DadosMercado, 'origem'> | null> {
  try {
    const bruto = await lerComMigracao(CHAVES.dadosMercado);
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
    AsyncStorage.setItem(CHAVES.dadosMercado, JSON.stringify(frescos)).catch(() => {});
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

/** Depois disso, a cotação de rede também é tratada como velha (pill em âmbar). */
export const IDADE_MAXIMA_COTACAO_MIN = 60;

// A cotação em uso merece atenção: veio do cache ou da referência, ou é antiga.
export function cotacaoDesatualizada(dados: DadosMercado, agora: Date = new Date()): boolean {
  if (dados.origem !== 'rede') return true;
  return agora.getTime() - new Date(dados.atualizadoEm).getTime() > IDADE_MAXIMA_COTACAO_MIN * 60000;
}

// "de hoje às 7:40", "de ontem às 22:05", "de 02/10 às 9:00" (horário do aparelho).
export function descreverHorario(iso: string, agora: Date = new Date()): string {
  const data = new Date(iso);
  const hora = `${data.getHours()}:${String(data.getMinutes()).padStart(2, '0')}`;
  const dia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dias = Math.round((dia(agora) - dia(data)) / 86400000);
  if (dias === 0) return `de hoje às ${hora}`;
  if (dias === 1) return `de ontem às ${hora}`;
  const dd = String(data.getDate()).padStart(2, '0');
  const mm = String(data.getMonth() + 1).padStart(2, '0');
  return `de ${dd}/${mm} às ${hora}`;
}
