// Leitura do produto a partir do HTML da página da loja, feita no próprio aparelho.
// Ordem: JSON-LD (Product.offers) → metas de preço (og:price / product:price) → JSON de
// produto da Shopify. Nada aqui é garantido: lojas mudam o HTML e algumas bloqueiam
// a leitura. Por isso tudo devolve null em vez de lançar, e o preenchimento manual
// continua sendo o caminho de primeira classe.

import { type CurrencyCode, ehCodigoMoeda } from '@/constants/currencies';
import { parseNumeroLocal } from '@/core/calculadora';

export interface ProdutoLido {
  nome?: string;
  preco?: number;
  moeda?: CurrencyCode;
  imagem?: string;
  /** Domínio da loja, sem "www." ("amazon.com"). */
  loja: string;
  /** De onde veio o preço. */
  fonte?: 'jsonld' | 'meta' | 'shopify';
}

// Partes de uma URL http(s). Sem o `URL` global: no Hermes ele não é completo em todas
// as versões do React Native.
const PARTES_URL = /^(https?):\/\/([^/?#:\s]+)(:\d+)?([^?#\s]*)/i;

export function partesDaUrl(url: string): { origem: string; host: string; caminho: string } | null {
  const m = url.match(PARTES_URL);
  if (!m || !m[2].includes('.')) return null;
  return { origem: `${m[1].toLowerCase()}://${m[2].toLowerCase()}${m[3] ?? ''}`, host: m[2].toLowerCase(), caminho: m[4] || '/' };
}

// "Olha isso: https://loja.com/p/1" → "https://loja.com/p/1"; "loja.com/p" → "https://loja.com/p".
export function normalizarUrl(texto: string): string | null {
  const limpo = texto.trim();
  const explicita = limpo.match(/https?:\/\/[^\s<>"']+/i);
  const candidata = explicita ? explicita[0] : /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(limpo) ? `https://${limpo}` : null;
  return candidata && partesDaUrl(candidata) ? candidata : null;
}

export function lojaDaUrl(url: string): string {
  return partesDaUrl(url)?.host.replace(/^www\./, '') ?? '';
}

// Moeda pelo domínio, quando a página não diz: só os casos sem ambiguidade.
const MOEDA_POR_SUFIXO: [RegExp, CurrencyCode][] = [
  [/\.co\.uk$|\.uk$/, 'GBP'],
  [/\.(de|fr|es|it|nl|pt|ie|at|be|fi)$/, 'EUR'],
  [/\.co\.jp$|\.jp$/, 'JPY'],
  [/\.com\.ar$/, 'ARS'],
  [/\.cl$/, 'CLP'],
  [/\.com$|\.us$/, 'USD'],
];

export function moedaPeloDominio(loja: string): CurrencyCode | undefined {
  return MOEDA_POR_SUFIXO.find(([padrao]) => padrao.test(loja))?.[1];
}

/** Lê um preço de JSON-LD ou meta: aceita número, "399.00", "1,299.00", "1.299,00", "1,299". */
export function lerPreco(valor: unknown): number | undefined {
  if (typeof valor === 'number') return Number.isFinite(valor) && valor > 0 ? valor : undefined;
  if (typeof valor !== 'string') return undefined;
  const texto = valor.replace(/[^\d.,]/g, '');
  if (!texto) return undefined;
  // Só separador de milhar, sem centavos ("1,299" ou "1.299").
  const preco = /^\d{1,3}([.,]\d{3})+$/.test(texto) ? Number(texto.replace(/[.,]/g, '')) : parseNumeroLocal(texto);
  return preco > 0 ? preco : undefined;
}

const ENTIDADES: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };

export function decodificarEntidades(texto: string): string {
  return texto
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, nome) => ENTIDADES[nome.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}

function atributo(tag: string, nome: string): string | undefined {
  const m = tag.match(new RegExp(`\\b${nome}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[1] ?? m[2]) : undefined;
}

// Lê <meta property|name="chave" content="..."> com os atributos em qualquer ordem.
export function lerMeta(html: string, chave: string): string | undefined {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const nome = atributo(tag, 'property') ?? atributo(tag, 'name') ?? atributo(tag, 'itemprop');
    if (nome?.toLowerCase() === chave.toLowerCase()) {
      const conteudo = atributo(tag, 'content');
      if (conteudo !== undefined) return decodificarEntidades(conteudo);
    }
  }
  return undefined;
}

function ehProduto(no: Record<string, unknown>): boolean {
  const tipo = no['@type'];
  return tipo === 'Product' || (Array.isArray(tipo) && tipo.includes('Product'));
}

// Todos os nós de um JSON-LD, incluindo @graph e listas.
function nos(valor: unknown): Record<string, unknown>[] {
  if (Array.isArray(valor)) return valor.flatMap(nos);
  if (!valor || typeof valor !== 'object') return [];
  const no = valor as Record<string, unknown>;
  return [no, ...nos(no['@graph'])];
}

interface Oferta {
  preco?: number;
  moeda?: string;
}

function lerOferta(ofertas: unknown): Oferta {
  const lista = Array.isArray(ofertas) ? ofertas : [ofertas];
  for (const o of lista) {
    if (!o || typeof o !== 'object') continue;
    const oferta = o as Record<string, unknown>;
    const spec = oferta.priceSpecification as Record<string, unknown> | undefined;
    const preco = lerPreco(oferta.price ?? oferta.lowPrice ?? spec?.price);
    if (preco) return { preco, moeda: String(oferta.priceCurrency ?? spec?.priceCurrency ?? '') || undefined };
  }
  return {};
}

function lerJsonLd(html: string): { nome?: string; imagem?: string } & Oferta {
  const blocos = html.match(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const bloco of blocos) {
    const conteudo = bloco.replace(/^<script\b[^>]*>/i, '').replace(/<\/script>$/i, '');
    let json: unknown;
    try {
      json = JSON.parse(conteudo.trim());
    } catch {
      continue;
    }
    const produto = nos(json).find(ehProduto);
    if (!produto) continue;
    const imagem = Array.isArray(produto.image) ? produto.image[0] : produto.image;
    return {
      nome: typeof produto.name === 'string' ? decodificarEntidades(produto.name) : undefined,
      imagem: typeof imagem === 'string' ? imagem : (imagem as { url?: string } | undefined)?.url,
      ...lerOferta(produto.offers),
    };
  }
  return {};
}

function moedaValida(codigo: string | undefined): CurrencyCode | undefined {
  const c = codigo?.trim().toUpperCase();
  return ehCodigoMoeda(c) ? c : undefined;
}

export function extrairProduto(html: string, url: string): ProdutoLido {
  const loja = lojaDaUrl(url);
  const jsonld = lerJsonLd(html);
  const titulo = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const nome = lerMeta(html, 'og:title') ?? jsonld.nome ?? (titulo ? decodificarEntidades(titulo) : undefined);
  const imagem = lerMeta(html, 'og:image') ?? jsonld.imagem;

  if (jsonld.preco) {
    return {
      nome,
      imagem,
      loja,
      preco: jsonld.preco,
      moeda: moedaValida(jsonld.moeda) ?? moedaPeloDominio(loja),
      fonte: 'jsonld',
    };
  }

  const precoMeta = lerPreco(lerMeta(html, 'og:price:amount') ?? lerMeta(html, 'product:price:amount'));
  if (precoMeta) {
    const moedaMeta = lerMeta(html, 'og:price:currency') ?? lerMeta(html, 'product:price:currency');
    return { nome, imagem, loja, preco: precoMeta, moeda: moedaValida(moedaMeta) ?? moedaPeloDominio(loja), fonte: 'meta' };
  }

  return { nome, imagem, loja, moeda: moedaPeloDominio(loja) };
}

/** Página de produto da Shopify? Vale tentar o /products/<handle>.json. */
export function urlJsonShopify(url: string, html: string): string | null {
  const partes = partesDaUrl(url);
  const handle = partes?.caminho.match(/\/products\/([^/?#.]+)/)?.[1];
  const pareceShopify = /cdn\.shopify\.com|Shopify\.theme|shopify-section/i.test(html);
  return partes && handle && pareceShopify ? `${partes.origem}/products/${handle}.json` : null;
}

// JSON de produto da Shopify: { product: { title, variants: [{ price }], image: { src } } }.
// Não traz a moeda; ela vem das metas da página ou do domínio.
export function extrairDeShopify(json: unknown, base: ProdutoLido, html: string): ProdutoLido {
  const produto = (json as { product?: Record<string, unknown> })?.product;
  if (!produto) return base;
  const variantes = Array.isArray(produto.variants) ? (produto.variants as Record<string, unknown>[]) : [];
  const preco = lerPreco(variantes[0]?.price);
  if (!preco) return base;
  const moeda = lerMeta(html, 'og:price:currency') ?? lerMeta(html, 'product:price:currency');
  return {
    ...base,
    nome: base.nome ?? (typeof produto.title === 'string' ? produto.title : undefined),
    imagem: base.imagem ?? (produto.image as { src?: string } | undefined)?.src,
    preco,
    moeda: moedaValida(moeda) ?? base.moeda,
    fonte: 'shopify',
  };
}
