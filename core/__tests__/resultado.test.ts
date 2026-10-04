import { REGRAS_FISCAIS } from '@/constants/regras-fiscais';
import { calcularParidade, type CalculoInput } from '@/core/calculadora';
import {
  barrasComparacao,
  contextoResultado,
  explicacaoValorPresente,
  fraseApoio,
  linhasRecibo,
  textoDaFrase,
  textoPontoDeVirada,
  tituloRecibo,
} from '@/core/resultado';

const DOLAR = { simbolo: 'US$', nomeFrase: 'o dólar' };
const EURO = { simbolo: '€', nomeFrase: 'o euro' };

const encomenda: CalculoInput = {
  precoBR: 3799,
  parcelasBR: 10,
  precoExt: 399,
  freteExt: 0,
  taxFreePct: 0,
  cenario: 'Encomenda',
  cotacao: 5.42,
  cotacaoUSD: 5.42,
  spread: 2,
  pgto: 'Cartao',
  selicMensal: 0.0117,
  iofCartao: REGRAS_FISCAIS.iof.cartao,
  iofDinheiro: REGRAS_FISCAIS.iof.especie,
  icms: 0.2,
  siteCertificado: true,
};

const viagem: CalculoInput = {
  ...encomenda,
  cenario: 'Viagem',
  precoBR: 1299,
  parcelasBR: 6,
  precoExt: 160,
  cotacao: 6.31,
  cotacaoUSD: 5.42,
  taxFreePct: 8,
};

describe('contextoResultado', () => {
  it('junta o nome do produto e o cenário', () => {
    expect(contextoResultado('Sony WH-1000XM6', 'Encomenda')).toBe('Sony WH-1000XM6 · encomenda');
    expect(contextoResultado('  ', 'Viagem')).toBe('Sua simulação · viagem');
  });
});

describe('fraseApoio', () => {
  it('Brasil parcelado: diz quanto sai mais barato, em valor de hoje', () => {
    const r = calcularParidade(encomenda);
    expect(r.veredito).toBe('brasil');
    const frase = fraseApoio(r, 'Encomenda', 10);
    expect(frase.antes).toBe('Parcelado em 10x, sai ');
    expect(frase.destaque).toMatch(/^R\$ [\d.]+,\d{2} mais barato$/);
    expect(frase.depois).toBe(' que importar, em valor de hoje.');
  });

  it('Brasil à vista: não fala em valor de hoje', () => {
    const r = calcularParidade({ ...encomenda, parcelasBR: 1, precoBR: 3000 });
    expect(textoDaFrase(fraseApoio(r, 'Encomenda', 1))).toMatch(/^À vista, sai R\$ .* mais barato que importar\.$/);
  });

  it('viagem vencedora: economia em reais e em %', () => {
    const r = calcularParidade(viagem);
    expect(r.veredito).toBe('exterior');
    const frase = fraseApoio(r, 'Viagem', 6);
    expect(frase.antes).toBe('Comprando na viagem, você economiza ');
    expect(frase.destaque).toMatch(/^R\$ [\d.]+,\d{2} \(\d+%\)$/);
    expect(frase.depois).toBe(' sobre o parcelado no Brasil, em valor de hoje.');
  });

  it('empate: sugere decidir por outros critérios', () => {
    const r = { ...calcularParidade(encomenda), veredito: 'empate' as const };
    expect(textoDaFrase(fraseApoio(r, 'Encomenda', 10))).toMatch(/^A diferença é de só R\$/);
  });
});

describe('barrasComparacao', () => {
  it('põe a opção vencedora em cima e a mais cara com a barra cheia', () => {
    const r = calcularParidade(encomenda);
    const [primeira, segunda] = barrasComparacao(r, 'Encomenda', 10);
    expect(primeira).toMatchObject({ sentido: 'brasil', rotulo: 'No Brasil, parcelado' });
    expect(segunda).toMatchObject({ sentido: 'exterior', rotulo: 'Importando', proporcao: 1 });
    expect(primeira.proporcao).toBeCloseTo(r.custoBR / r.custoExt, 8);
  });

  it('em viagem, a barra do exterior se chama "Na viagem"', () => {
    const [primeira] = barrasComparacao(calcularParidade(viagem), 'Viagem', 6);
    expect(primeira).toMatchObject({ sentido: 'exterior', rotulo: 'Na viagem' });
  });
});

describe('linhasRecibo', () => {
  it('mostra a regra aplicada em cada linha da encomenda', () => {
    const r = calcularParidade(encomenda);
    const linhas = linhasRecibo(encomenda, r, DOLAR);
    expect(linhas.map((l) => l.rotulo)).toEqual([
      'Produto · US$ 399 × 5,53',
      'IOF cartão 3,5%',
      'Imp. Importação 60% − US$ 30',
      'ICMS 20% por dentro',
    ]);
    expect(linhas.every((l) => !l.credito)).toBe(true);
  });

  it('inclui o frete e as outras regras de II', () => {
    const comFrete = { ...encomenda, siteCertificado: false, freteExt: 10 };
    const fora = calcularParidade(comFrete);
    expect(linhasRecibo(comFrete, fora, DOLAR)[0].rotulo).toBe('Produto + frete · US$ 409 × 5,53');
    expect(linhasRecibo(comFrete, fora, DOLAR)[2].rotulo).toBe('Imp. Importação 60%, fora do Remessa Conforme');

    const baixo = { ...encomenda, precoExt: 40 };
    expect(linhasRecibo(baixo, calcularParidade(baixo), DOLAR)[2].rotulo).toBe('Imp. Importação 0% até US$ 50');
  });

  it('em viagem, mostra o tax free como crédito', () => {
    const linhas = linhasRecibo(viagem, calcularParidade(viagem), EURO);
    expect(linhas.map((l) => l.rotulo)).toEqual(['Produto · € 160 × 6,44', 'IOF cartão 3,5%', 'Tax free recuperado 8%']);
    expect(linhas[2].credito).toBe(true);
    expect(linhas[2].valor).toBeLessThan(0);
  });

  it('usa "espécie" no IOF de dinheiro', () => {
    const especie = { ...encomenda, pgto: 'Dinheiro' as const };
    expect(linhasRecibo(especie, calcularParidade(especie), DOLAR)[1].rotulo).toBe('IOF espécie 3,5%');
  });

  it('tem título próprio para cada cenário', () => {
    expect(tituloRecibo('Encomenda')).toBe('De onde vem o custo de importar');
    expect(tituloRecibo('Viagem')).toBe('Custo na viagem');
  });
});

describe('explicacaoValorPresente', () => {
  it('explica as parcelas trazidas a valor de hoje pela Selic', () => {
    expect(explicacaoValorPresente(3799, 10, 0.0117, 3565.7)).toEqual({
      titulo: 'Por que R$ 3.565,70?',
      texto:
        'Você paga 10 × R$ 379,90. Enquanto as parcelas vencem, o dinheiro rende 1,17% a.m. na Selic — hoje, isso vale R$ 3.565,70.',
    });
  });

  it('não aparece à vista', () => {
    expect(explicacaoValorPresente(3799, 1, 0.0117, 3799)).toBeNull();
  });
});

describe('textoPontoDeVirada', () => {
  it('Brasil vence: diz abaixo de quanto importar passa a valer', () => {
    const frase = textoPontoDeVirada(calcularParidade(encomenda), 5.42, DOLAR)!;
    expect(frase.antes).toBe('Importar passa a valer a pena com o dólar abaixo de ');
    expect(frase.destaque).toMatch(/^R\$ \d,\d{2}$/);
    expect(frase.depois).toBe('. Hoje: R$ 5,42.');
  });

  it('importar vence: diz até quanto continua valendo', () => {
    const frase = textoPontoDeVirada(calcularParidade(viagem), 6.31, EURO)!;
    expect(frase.antes).toBe('Importar continua valendo a pena com o euro até ');
  });

  it('some quando não há ponto de virada', () => {
    const r = { ...calcularParidade(encomenda), pontoDeVirada: Infinity };
    expect(textoPontoDeVirada(r, 5.42, DOLAR)).toBeNull();
  });
});
