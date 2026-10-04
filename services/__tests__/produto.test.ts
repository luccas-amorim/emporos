import fs from 'fs';
import path from 'path';

import { lerProduto } from '@/services/produto';

const fixture = (nome: string) =>
  fs.readFileSync(path.join(__dirname, '..', '..', 'core', '__tests__', 'fixtures', nome), 'utf8');

function respostas(rotas: Record<string, { ok?: boolean; corpo: string }>) {
  global.fetch = jest.fn(async (url: RequestInfo | URL) => {
    const chave = Object.keys(rotas).find((k) => String(url).includes(k));
    if (!chave) throw new Error(`URL inesperada: ${url}`);
    const { ok = true, corpo } = rotas[chave];
    return { ok, status: ok ? 200 : 403, text: async () => corpo, json: async () => JSON.parse(corpo) } as Response;
  }) as jest.Mock;
}

afterEach(() => jest.restoreAllMocks());

describe('lerProduto', () => {
  it('lê nome, preço e moeda de uma página com JSON-LD', async () => {
    respostas({ 'loja.com/p/sony': { corpo: fixture('jsonld-produto.html') } });
    const lido = await lerProduto('olha: https://www.loja.com/p/sony');
    expect(lido).toMatchObject({
      status: 'ok',
      url: 'https://www.loja.com/p/sony',
      produto: { nome: 'Sony WH-1000XM6 & estojo', preco: 399, moeda: 'USD', loja: 'loja.com' },
    });
  });

  it('cai para o JSON da Shopify quando a página não traz o preço', async () => {
    respostas({
      'products/camiseta.json': { corpo: fixture('shopify.json') },
      'products/camiseta': { corpo: fixture('shopify.html') },
    });
    const lido = await lerProduto('https://loja.myshop.com/products/camiseta');
    expect(lido).toMatchObject({ status: 'ok', produto: { preco: 29.5, moeda: 'USD', fonte: 'shopify' } });
  });

  it('falha em silêncio quando a loja bloqueia, sem lançar', async () => {
    respostas({ bestbuy: { ok: false, corpo: '' } });
    expect(await lerProduto('https://www.bestbuy.com/site/6539')).toEqual({
      status: 'falhou',
      url: 'https://www.bestbuy.com/site/6539',
    });
  });

  it('falha sem rede, devolvendo o que der quando a página não tem preço', async () => {
    global.fetch = jest.fn(async () => {
      throw new Error('offline');
    }) as jest.Mock;
    expect((await lerProduto('https://loja.com/x')).status).toBe('falhou');

    respostas({ 'loja.com.br': { corpo: fixture('sem-preco.html') } });
    expect(await lerProduto('https://loja.com.br/notebook')).toMatchObject({
      status: 'falhou',
      produto: { nome: 'Notebook Gamer X' },
    });
  });

  it('não busca nada quando o texto não é um link', async () => {
    global.fetch = jest.fn() as jest.Mock;
    expect(await lerProduto('fone sony')).toEqual({ status: 'falhou', url: null });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('desiste depois do tempo limite', async () => {
    global.fetch = jest.fn(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise((_, rejeitar) => init?.signal?.addEventListener('abort', () => rejeitar(new Error('abortado'))))
    ) as jest.Mock;
    expect((await lerProduto('https://lenta.com/p', 20)).status).toBe('falhou');
  });
});
