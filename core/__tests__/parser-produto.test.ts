import fs from 'fs';
import path from 'path';

import {
  decodificarEntidades,
  extrairDeShopify,
  extrairProduto,
  lerMeta,
  lerPreco,
  lojaDaUrl,
  moedaPeloDominio,
  normalizarUrl,
  urlJsonShopify,
} from '@/core/parser-produto';

const fixture = (nome: string) => fs.readFileSync(path.join(__dirname, 'fixtures', nome), 'utf8');

describe('normalizarUrl', () => {
  it('acha a URL dentro de um texto compartilhado', () => {
    expect(normalizarUrl('Olha esse fone: https://www.amazon.com/dp/B0F3PT1VBL?th=1 muito bom')).toBe(
      'https://www.amazon.com/dp/B0F3PT1VBL?th=1'
    );
  });

  it('completa o https de um domínio digitado', () => {
    expect(normalizarUrl('  amazon.com/dp/B0F3PT1VBL ')).toBe('https://amazon.com/dp/B0F3PT1VBL');
  });

  it('recusa o que não é link', () => {
    expect(normalizarUrl('fone sony')).toBeNull();
    expect(normalizarUrl('ftp://loja.com/x')).toBeNull();
    expect(normalizarUrl('https://localhost/x')).toBeNull();
    expect(normalizarUrl('')).toBeNull();
  });
});

describe('lojaDaUrl e moedaPeloDominio', () => {
  it('tira o www e deduz a moeda só quando o domínio não deixa dúvida', () => {
    expect(lojaDaUrl('https://www.amazon.co.uk/dp/1')).toBe('amazon.co.uk');
    expect(moedaPeloDominio('amazon.co.uk')).toBe('GBP');
    expect(moedaPeloDominio('zalando.de')).toBe('EUR');
    expect(moedaPeloDominio('amazon.co.jp')).toBe('JPY');
    expect(moedaPeloDominio('bestbuy.com')).toBe('USD');
    expect(moedaPeloDominio('loja.com.br')).toBeUndefined();
    expect(moedaPeloDominio('shop.io')).toBeUndefined();
  });
});

describe('lerPreco', () => {
  it('entende os formatos comuns de preço', () => {
    expect(lerPreco(399)).toBe(399);
    expect(lerPreco('399.00')).toBe(399);
    expect(lerPreco('1,299.00')).toBe(1299);
    expect(lerPreco('1.299,00')).toBe(1299);
    expect(lerPreco('1,299')).toBe(1299);
    expect(lerPreco('59,90')).toBe(59.9);
    expect(lerPreco('US$ 49.99')).toBe(49.99);
  });

  it('descarta zero, vazio e o que não é preço', () => {
    expect(lerPreco('0.00')).toBeUndefined();
    expect(lerPreco('')).toBeUndefined();
    expect(lerPreco(null)).toBeUndefined();
    expect(lerPreco(NaN)).toBeUndefined();
  });
});

describe('lerMeta e decodificarEntidades', () => {
  it('lê metas com os atributos em qualquer ordem e aspas simples', () => {
    const html = fixture('og-price.html');
    expect(lerMeta(html, 'og:price:amount')).toBe('1,299.00');
    expect(lerMeta(html, 'og:title')).toBe('Kindle Paperwhite');
    expect(lerMeta(html, 'og:image')).toBeUndefined();
  });

  it('decodifica entidades e espaços', () => {
    expect(decodificarEntidades('Mochila &#8211; Outdoor &amp; Trilha&#x21;  ')).toBe('Mochila – Outdoor & Trilha!');
  });
});

describe('extrairProduto', () => {
  it('1º JSON-LD: preço e moeda das ofertas, nome do og:title', () => {
    expect(extrairProduto(fixture('jsonld-produto.html'), 'https://www.loja.com/p/sony')).toEqual({
      nome: 'Sony WH-1000XM6 & estojo',
      imagem: 'https://cdn.loja.com/sony.jpg',
      loja: 'loja.com',
      preco: 399,
      moeda: 'USD',
      fonte: 'jsonld',
    });
  });

  it('JSON-LD em @graph, com AggregateOffer e JSON quebrado no meio', () => {
    expect(extrairProduto(fixture('jsonld-graph.html'), 'https://shop.example.de/asics')).toMatchObject({
      nome: 'Asics Gel-Kayano 31',
      imagem: 'https://img.example.de/asics.png',
      preco: 160,
      moeda: 'EUR',
      fonte: 'jsonld',
    });
  });

  it('2º metas og:price, com a moeda da meta', () => {
    expect(extrairProduto(fixture('og-price.html'), 'https://kindle.example.com/x')).toMatchObject({
      nome: 'Kindle Paperwhite',
      preco: 1299,
      moeda: 'GBP',
      fonte: 'meta',
    });
  });

  it('metas product:price sem moeda: a moeda vem do domínio, o nome do <title>', () => {
    expect(extrairProduto(fixture('product-price.html'), 'https://outdoor.de/mochila')).toMatchObject({
      nome: 'Mochila – Outdoor',
      preco: 59.9,
      moeda: 'EUR',
      fonte: 'meta',
    });
  });

  it('sem preço na página: devolve só o que achou', () => {
    const lido = extrairProduto(fixture('sem-preco.html'), 'https://loja.com.br/notebook');
    expect(lido).toEqual({ nome: 'Notebook Gamer X', imagem: undefined, loja: 'loja.com.br', moeda: undefined });
    expect(lido.preco).toBeUndefined();
  });

  it('HTML vazio ou estranho não lança', () => {
    expect(extrairProduto('', 'https://a.com/x')).toMatchObject({ loja: 'a.com' });
    expect(extrairProduto('<meta property="og:price:amount">', 'nada')).toMatchObject({ loja: '' });
  });
});

describe('Shopify', () => {
  it('3º reconhece a página da Shopify e monta a URL do JSON do produto', () => {
    const html = fixture('shopify.html');
    expect(urlJsonShopify('https://loja.myshop.com/products/camiseta-basica?variant=1', html)).toBe(
      'https://loja.myshop.com/products/camiseta-basica.json'
    );
    expect(urlJsonShopify('https://loja.myshop.com/collections/x', html)).toBeNull();
    expect(urlJsonShopify('https://loja.com/products/x', '<html></html>')).toBeNull();
  });

  it('lê o preço da primeira variante e a moeda da meta', () => {
    const html = fixture('shopify.html');
    const base = extrairProduto(html, 'https://loja.myshop.com/products/camiseta-basica');
    expect(base.preco).toBeUndefined();
    const json = JSON.parse(fixture('shopify.json'));
    expect(extrairDeShopify(json, base, html)).toMatchObject({
      nome: 'Camiseta Básica',
      preco: 29.5,
      moeda: 'USD',
      imagem: 'https://cdn.shopify.com/camiseta.jpg',
      fonte: 'shopify',
    });
  });

  it('mantém o que tinha quando o JSON não serve', () => {
    const base = { loja: 'x.com', nome: 'A' };
    expect(extrairDeShopify({ erro: 1 }, base, '')).toBe(base);
    expect(extrairDeShopify({ product: { variants: [] } }, base, '')).toBe(base);
  });
});
