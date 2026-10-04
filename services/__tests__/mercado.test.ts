import AsyncStorage from '@react-native-async-storage/async-storage';

import { CHAVES } from '@/services/armazenamento';
import { buscarCotacoesRede } from '@/services/cambio';
import { carregarDadosMercado, descreverIdade } from '@/services/mercado';
import { buscarSelicRede } from '@/services/selic';

const CODIGOS = ['USD', 'EUR'] as const;

function mockFetchOk(rotas: Record<string, unknown>) {
  global.fetch = jest.fn(async (url: RequestInfo | URL) => {
    const chave = Object.keys(rotas).find((k) => String(url).includes(k));
    if (!chave) throw new Error(`URL inesperada: ${url}`);
    return { ok: true, json: async () => rotas[chave] } as Response;
  }) as jest.Mock;
}

const RESPOSTA_CAMBIO = {
  USDBRL: { bid: '5.00', ask: '5.10' },
  EURBRL: { bid: '5.80', ask: '5.90' },
};
const RESPOSTA_SELIC = [{ data: '05/08/2026', valor: '14.25' }];

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.restoreAllMocks();
});

describe('buscarCotacoesRede', () => {
  it('usa a média entre bid e ask', async () => {
    mockFetchOk({ awesomeapi: RESPOSTA_CAMBIO });
    const valores = await buscarCotacoesRede([...CODIGOS]);
    expect(valores.USD).toBeCloseTo(5.05, 5);
    expect(valores.EUR).toBeCloseTo(5.85, 5);
  });

  it('lança quando a resposta vem malformada', async () => {
    mockFetchOk({ awesomeapi: { USDBRL: { bid: 'abc' } } });
    await expect(buscarCotacoesRede([...CODIGOS])).rejects.toThrow(/bid\/ask/);
  });

  it('lança em erro HTTP', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 500 }) as Response) as jest.Mock;
    await expect(buscarCotacoesRede([...CODIGOS])).rejects.toThrow(/HTTP 500/);
  });
});

describe('buscarSelicRede', () => {
  it('converte a taxa anual para mensal equivalente', async () => {
    mockFetchOk({ bcb: RESPOSTA_SELIC });
    const selic = await buscarSelicRede();
    expect(selic.selicAnual).toBe(14.25);
    expect(selic.selicMensal).toBeCloseTo(Math.pow(1.1425, 1 / 12) - 1, 8);
  });

  it('lança em resposta vazia', async () => {
    mockFetchOk({ bcb: [] });
    await expect(buscarSelicRede()).rejects.toThrow(/vazia/);
  });
});

describe('carregarDadosMercado', () => {
  it('retorna origem rede e grava cache quando tudo funciona', async () => {
    mockFetchOk({ awesomeapi: RESPOSTA_CAMBIO, bcb: RESPOSTA_SELIC });

    const dados = await carregarDadosMercado([...CODIGOS]);
    expect(dados.origem).toBe('rede');
    expect(dados.cotacoes.USD).toBeCloseTo(5.05, 5);

    const cache = JSON.parse((await AsyncStorage.getItem(CHAVES.dadosMercado))!);
    expect(cache.cotacoes.USD).toBeCloseTo(5.05, 5);
  });

  it('cai no cache quando a rede falha', async () => {
    mockFetchOk({ awesomeapi: RESPOSTA_CAMBIO, bcb: RESPOSTA_SELIC });
    await carregarDadosMercado([...CODIGOS]);

    global.fetch = jest.fn(async () => {
      throw new Error('offline');
    }) as jest.Mock;

    const dados = await carregarDadosMercado([...CODIGOS]);
    expect(dados.origem).toBe('cache');
    expect(dados.cotacoes.USD).toBeCloseTo(5.05, 5);
  });

  it('cai no padrão quando não há rede nem cache', async () => {
    global.fetch = jest.fn(async () => {
      throw new Error('offline');
    }) as jest.Mock;

    const dados = await carregarDadosMercado([...CODIGOS]);
    expect(dados.origem).toBe('padrao');
    expect(dados.cotacoes.USD).toBeGreaterThan(0);
  });

  it('mistura dado fresco com cache em falha parcial', async () => {
    mockFetchOk({ awesomeapi: RESPOSTA_CAMBIO, bcb: RESPOSTA_SELIC });
    await carregarDadosMercado([...CODIGOS]);

    // Agora só o câmbio funciona; a Selic falha.
    global.fetch = jest.fn(async (url: RequestInfo | URL) => {
      if (String(url).includes('awesomeapi')) {
        return { ok: true, json: async () => RESPOSTA_CAMBIO } as Response;
      }
      throw new Error('bcb fora do ar');
    }) as jest.Mock;

    const dados = await carregarDadosMercado([...CODIGOS]);
    expect(dados.origem).toBe('cache');
    expect(dados.selicAnual).toBe(14.25); // veio do cache
    expect(dados.cotacoes.USD).toBeCloseTo(5.05, 5); // veio da rede
  });
});

describe('descreverIdade', () => {
  it('descreve idades em minutos, horas e dias', () => {
    const agora = Date.now();
    expect(descreverIdade(new Date(agora - 30_000).toISOString())).toBe('agora mesmo');
    expect(descreverIdade(new Date(agora - 5 * 60_000).toISOString())).toBe('há 5 min');
    expect(descreverIdade(new Date(agora - 3 * 3_600_000).toISOString())).toBe('há 3 h');
    expect(descreverIdade(new Date(agora - 49 * 3_600_000).toISOString())).toBe('há 2 dias');
  });
});
