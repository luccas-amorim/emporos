// Textos e números da tela de Resultado, a partir da saída de calcularParidade.
// Tudo puro: a tela só monta o que sai daqui.

import type { CalculoInput, CalculoResultado, Cenario, Veredito } from '@/core/calculadora';
import { formatarBRL, formatarCotacaoBR, formatarMoeda, formatarPct, formatarPctCurto } from '@/core/formato';

/** Moeda da simulação, no formato que os textos precisam. */
export interface MoedaTexto {
  simbolo: string;
  /** "o dólar", "a libra". */
  nomeFrase: string;
}

/** Frase com um trecho em destaque (negrito na tela). */
export interface FraseDestacada {
  antes: string;
  destaque: string;
  depois: string;
}

export type Sentido = 'brasil' | 'exterior';

export function textoDaFrase(frase: FraseDestacada): string {
  return `${frase.antes}${frase.destaque}${frase.depois}`;
}

/** "Sony WH-1000XM6 · encomenda". */
export function contextoResultado(nomeProduto: string | undefined, cenario: Cenario): string {
  return `${nomeProduto?.trim() || 'Sua simulação'} · ${cenario === 'Encomenda' ? 'encomenda' : 'viagem'}`;
}

// Frase de apoio, logo abaixo do veredito.
export function fraseApoio(resultado: CalculoResultado, cenario: Cenario, parcelas: number): FraseDestacada {
  const diferenca = formatarBRL(resultado.economia);
  const comPct = `${diferenca} (${formatarPct(resultado.economiaPct, 0)})`;
  const parcelado = parcelas > 1;
  const viagem = cenario === 'Viagem';

  if (resultado.veredito === 'empate') {
    return {
      antes: 'A diferença é de só ',
      destaque: comPct,
      depois: '. Decida pelo prazo de entrega, pela garantia ou pela conveniência.',
    };
  }
  if (resultado.veredito === 'brasil') {
    return {
      antes: parcelado ? `Parcelado em ${parcelas}x, sai ` : 'À vista, sai ',
      destaque: `${diferenca} mais barato`,
      depois: ` que ${viagem ? 'comprar na viagem' : 'importar'}${parcelado ? ', em valor de hoje' : ''}.`,
    };
  }
  return {
    antes: viagem ? 'Comprando na viagem, você economiza ' : 'Importando, você economiza ',
    destaque: comPct,
    depois: parcelado ? ' sobre o parcelado no Brasil, em valor de hoje.' : ' sobre o preço no Brasil.',
  };
}

export interface Barra {
  sentido: Sentido;
  rotulo: string;
  valor: number;
  /** Largura relativa (0–1): a opção mais cara ocupa a barra inteira. */
  proporcao: number;
}

// As duas barras, com a opção vencedora em cima.
export function barrasComparacao(resultado: CalculoResultado, cenario: Cenario, parcelas: number): Barra[] {
  const maior = Math.max(resultado.custoBR, resultado.custoExt);
  const proporcao = (valor: number) => (maior > 0 ? valor / maior : 0);
  const brasil: Barra = {
    sentido: 'brasil',
    rotulo: parcelas > 1 ? 'No Brasil, parcelado' : 'No Brasil, à vista',
    valor: resultado.custoBR,
    proporcao: proporcao(resultado.custoBR),
  };
  const exterior: Barra = {
    sentido: 'exterior',
    rotulo: cenario === 'Viagem' ? 'Na viagem' : 'Importando',
    valor: resultado.custoExt,
    proporcao: proporcao(resultado.custoExt),
  };
  return resultado.veredito === 'exterior' ? [exterior, brasil] : [brasil, exterior];
}

export interface LinhaRecibo {
  rotulo: string;
  valor: number;
  /** Abatimento (tax free), mostrado em verde. */
  credito: boolean;
}

export function tituloRecibo(cenario: Cenario): string {
  return cenario === 'Viagem' ? 'Custo na viagem' : 'De onde vem o custo de importar';
}

// "De onde vem o custo de importar": cada linha com a regra aplicada.
export function linhasRecibo(entrada: CalculoInput, resultado: CalculoResultado, moeda: MoedaTexto): LinhaRecibo[] {
  const encomenda = entrada.cenario === 'Encomenda';
  const comFrete = encomenda && entrada.freteExt > 0;
  const valorMoeda = entrada.precoExt + (encomenda ? entrada.freteExt : 0);
  const taxa = entrada.cotacao * (1 + entrada.spread / 100);
  const taxaTexto = formatarCotacaoBR(taxa).replace('R$ ', '');

  return resultado.breakdown.map((item) => {
    let rotulo: string;
    switch (item.tipo) {
      case 'produto':
        rotulo = `Produto${comFrete ? ' + frete' : ''} · ${formatarMoeda(valorMoeda, moeda.simbolo)} × ${taxaTexto}`;
        break;
      case 'iof':
        rotulo = `IOF ${entrada.pgto === 'Dinheiro' ? 'espécie' : 'cartão'} ${formatarPctCurto((item.aliquota ?? 0) * 100)}`;
        break;
      case 'ii': {
        const aliquota = formatarPctCurto((item.aliquota ?? 0) * 100);
        rotulo =
          item.regraII === 'faixaAlta'
            ? `Imp. Importação ${aliquota} − US$ 30`
            : item.regraII === 'faixaBaixa'
              ? `Imp. Importação ${aliquota} até US$ 50`
              : `Imp. Importação ${aliquota}, fora do Remessa Conforme`;
        break;
      }
      case 'icms':
        rotulo = `ICMS ${formatarPctCurto((item.aliquota ?? 0) * 100)} por dentro`;
        break;
      case 'taxFree':
        rotulo = `Tax free recuperado ${formatarPctCurto((item.aliquota ?? 0) * 100)}`;
        break;
    }
    return { rotulo, valor: item.valor, credito: item.valor < 0 };
  });
}

// "Por que R$ X?": o valor presente das parcelas em uma frase. Null à vista.
export function explicacaoValorPresente(
  precoBR: number,
  parcelas: number,
  selicMensal: number,
  custoBR: number
): { titulo: string; texto: string } | null {
  if (parcelas <= 1) return null;
  const valorHoje = formatarBRL(custoBR);
  return {
    titulo: `Por que ${valorHoje}?`,
    texto:
      `Você paga ${parcelas} × ${formatarBRL(precoBR / parcelas)}. Enquanto as parcelas vencem, o dinheiro rende ` +
      `${formatarPct(selicMensal * 100, 2)} a.m. na Selic — hoje, isso vale ${valorHoje}.`,
  };
}

// Caixa "Ponto de virada". Null quando não dá para calcular.
export function textoPontoDeVirada(
  resultado: CalculoResultado,
  cotacaoHoje: number,
  moeda: MoedaTexto
): FraseDestacada | null {
  if (!Number.isFinite(resultado.pontoDeVirada) || resultado.pontoDeVirada <= 0) return null;
  const alvo = formatarCotacaoBR(resultado.pontoDeVirada);
  const hoje = `. Hoje: ${formatarCotacaoBR(cotacaoHoje)}.`;
  const inicio: Record<Veredito, string> = {
    exterior: `Importar continua valendo a pena com ${moeda.nomeFrase} até `,
    brasil: `Importar passa a valer a pena com ${moeda.nomeFrase} abaixo de `,
    empate: `As duas opções empatam com ${moeda.nomeFrase} a `,
  };
  return { antes: inicio[resultado.veredito], destaque: alvo, depois: hoje };
}

/** Cor do veredito: verde (Brasil), azul (importar) ou neutra (empate). */
export function sentidoDoVeredito(veredito: Veredito): Sentido | null {
  return veredito === 'empate' ? null : veredito;
}
