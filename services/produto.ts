import { extrairDeShopify, extrairProduto, normalizarUrl, type ProdutoLido, urlJsonShopify } from '@/core/parser-produto';

// "Colar link": o próprio celular baixa a página da loja e tenta ler nome e preço. A
// requisição vai do aparelho direto para a loja, sem passar por nenhum servidor nosso.
// Nunca lança: qualquer falha vira { status: 'falhou' } e a tela segue para o
// preenchimento manual.

export type LeituraProduto =
  | { status: 'ok'; url: string; produto: ProdutoLido & { preco: number } }
  | { status: 'falhou'; url: string | null; produto?: ProdutoLido };

const TEMPO_LIMITE_MS = 8000;

async function buscar(url: string, aceita: string, sinal: AbortSignal): Promise<Response | null> {
  try {
    const res = await fetch(url, { headers: { Accept: aceita }, signal: sinal });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

export async function lerProduto(texto: string, tempoLimiteMs = TEMPO_LIMITE_MS): Promise<LeituraProduto> {
  const url = normalizarUrl(texto);
  if (!url) return { status: 'falhou', url: null };

  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), tempoLimiteMs);
  try {
    const pagina = await buscar(url, 'text/html,application/xhtml+xml', controle.signal);
    if (!pagina) return { status: 'falhou', url };
    const html = await pagina.text();

    let produto = extrairProduto(html, url);
    const jsonShopify = produto.preco ? null : urlJsonShopify(url, html);
    if (jsonShopify) {
      const res = await buscar(jsonShopify, 'application/json', controle.signal);
      if (res) produto = extrairDeShopify(await res.json().catch(() => null), produto, html);
    }

    return produto.preco ? { status: 'ok', url, produto: { ...produto, preco: produto.preco } } : { status: 'falhou', url, produto };
  } catch {
    return { status: 'falhou', url };
  } finally {
    clearTimeout(relogio);
  }
}
