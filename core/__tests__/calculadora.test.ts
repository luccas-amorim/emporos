import { REGRAS_FISCAIS } from '@/constants/regras-fiscais';
import {
  calcularParidade,
  calcularPontoDeVirada,
  type CalculoInput,
  parseNumeroLocal,
  rotuloAliquota,
} from '@/core/calculadora';
import { taxaMensalEquivalente } from '@/services/selic';

describe('parseNumeroLocal', () => {
  it('lê números simples sem separador', () => {
    expect(parseNumeroLocal('1500')).toBe(1500);
  });

  it('lê formato brasileiro com milhar e decimal (1.500,00)', () => {
    expect(parseNumeroLocal('1.500,00')).toBe(1500);
    expect(parseNumeroLocal('1.500,50')).toBe(1500.5);
  });

  it('lê decimal com vírgula sem separador de milhar (1500,50)', () => {
    expect(parseNumeroLocal('1500,50')).toBe(1500.5);
  });

  it('lê formato internacional com milhar e decimal (1,500.00)', () => {
    expect(parseNumeroLocal('1,500.00')).toBe(1500);
  });

  it('lê decimal com ponto sem separador de milhar (1500.50)', () => {
    expect(parseNumeroLocal('1500.50')).toBe(1500.5);
  });

  it('retorna 0 para texto vazio ou inválido', () => {
    expect(parseNumeroLocal('')).toBe(0);
    expect(parseNumeroLocal('   ')).toBe(0);
    expect(parseNumeroLocal('abc')).toBe(0);
  });
});

describe('rotuloAliquota', () => {
  it('mostra alíquotas inteiras sem casas e as demais com uma', () => {
    expect(rotuloAliquota(0.6)).toBe('60%');
    expect(rotuloAliquota(0.17)).toBe('17%');
    expect(rotuloAliquota(0.035)).toBe('3,5%');
    expect(rotuloAliquota(0)).toBe('0%');
  });
});

const baseViagem: CalculoInput = {
  precoBR: 5000,
  parcelasBR: 12,
  precoExt: 800,
  freteExt: 0,
  taxFreePct: 0,
  cenario: 'Viagem',
  cotacao: 5.0,
  cotacaoUSD: 5.0,
  spread: 2.0,
  pgto: 'Cartao',
  selicMensal: taxaMensalEquivalente(11.25),
  iofCartao: REGRAS_FISCAIS.iof.cartao,
  iofDinheiro: REGRAS_FISCAIS.iof.especie,
  icms: 0.17,
  siteCertificado: true,
};

describe('calcularParidade — cenário Viagem', () => {
  // Cenário do docs/WHITEPAPER.md: smartphone R$5.000 em 12x vs US$800 no cartão.
  it('reproduz o exemplo do whitepaper (vale importar)', () => {
    const resultado = calcularParidade(baseViagem);

    // 800 × 5,10 × 1,035
    expect(resultado.custoExt).toBeCloseTo(4222.8, 1);
    expect(resultado.valeImportar).toBe(true);
    expect(resultado.economia).toBeCloseTo(resultado.custoBR - resultado.custoExt, 5);
    expect(resultado.economia).toBeGreaterThan(400);
  });

  it('não aplica imposto de importação nem ICMS em viagem', () => {
    const resultado = calcularParidade(baseViagem);
    const labels = resultado.breakdown.map((item) => item.label).join(' | ');
    expect(labels).not.toMatch(/Importação|ICMS/);
  });

  it('ignora frete no cenário Viagem', () => {
    const comFrete = calcularParidade({ ...baseViagem, freteExt: 100 });
    const semFrete = calcularParidade(baseViagem);
    expect(comFrete.custoExt).toBeCloseTo(semFrete.custoExt, 5);
  });

  it('compra à vista no Brasil não é descontada a valor presente', () => {
    const resultado = calcularParidade({ ...baseViagem, precoBR: 1000, parcelasBR: 1, precoExt: 100, spread: 0 });
    expect(resultado.custoBR).toBe(1000);
  });

  it('usa o IOF de cada forma de pagamento', () => {
    const base = { ...baseViagem, precoBR: 1000, parcelasBR: 1, precoExt: 100, spread: 0 };
    const noCartao = calcularParidade({ ...base, pgto: 'Cartao' as const, iofCartao: 0.035, iofDinheiro: 0.01 });
    const noDinheiro = calcularParidade({ ...base, pgto: 'Dinheiro' as const, iofCartao: 0.035, iofDinheiro: 0.01 });

    expect(noCartao.custoExt).toBeCloseTo(100 * 5.0 * 1.035, 5);
    expect(noDinheiro.custoExt).toBeCloseTo(100 * 5.0 * 1.01, 5);
  });

  it('avisa quando o produto passa da cota de bagagem, sem incluir o imposto', () => {
    // US$ 1.200 > cota de US$ 1.000
    const acima = calcularParidade({ ...baseViagem, precoExt: 1200 });
    const dentro = calcularParidade({ ...baseViagem, precoExt: 900 });

    expect(acima.avisos.join(' ')).toMatch(/cota de isenção/);
    expect(dentro.avisos).toEqual([]);
    expect(acima.custoExt).toBeCloseTo(1200 * 5.1 * 1.035, 5);
  });
});

describe('calcularParidade — cenário Encomenda (Remessa Conforme)', () => {
  const baseEncomenda: CalculoInput = {
    ...baseViagem,
    cenario: 'Encomenda',
    spread: 0,
    parcelasBR: 1,
  };
  const linha = (resultado: ReturnType<typeof calcularParidade>, trecho: string) =>
    resultado.breakdown.find((i) => i.label.includes(trecho))!;

  it('zera o II até US$ 50 e cobra só o ICMS por dentro', () => {
    // US$40 → aduaneiro R$200; II 0; ICMS 17% = (200/0,83)*0,17
    const resultado = calcularParidade({ ...baseEncomenda, precoExt: 40 });

    expect(linha(resultado, 'Importação').valor).toBe(0);
    expect(linha(resultado, 'Importação').label).toContain('0% até US$ 50');
    expect(linha(resultado, 'ICMS').valor).toBeCloseTo((200 / 0.83) * 0.17, 5);
    // pagamento 200 + IOF 3,5% (7) + II 0 + ICMS
    expect(resultado.custoExt).toBeCloseTo(200 + 7 + (200 / 0.83) * 0.17, 5);
  });

  it('aplica II de 60% com desconto de US$ 30 acima de US$ 50', () => {
    // US$100 → aduaneiro R$500; II = 0,6*500 − 30*5 = R$150; ICMS = (650/0,83)*0,17
    const resultado = calcularParidade({ ...baseEncomenda, precoExt: 100 });

    expect(linha(resultado, 'Importação').valor).toBeCloseTo(150, 5);
    expect(linha(resultado, 'Importação').label).toContain('60% − US$ 30');
    expect(linha(resultado, 'ICMS').valor).toBeCloseTo((650 / 0.83) * 0.17, 5);
  });

  it('usa a alíquota de ICMS informada (20% em alguns estados)', () => {
    const resultado = calcularParidade({ ...baseEncomenda, precoExt: 100, icms: 0.2 });
    expect(linha(resultado, 'ICMS').valor).toBeCloseTo((650 / 0.8) * 0.2, 5);
    expect(linha(resultado, 'ICMS').label).toContain('20%');
  });

  it('cobra 60% sem desconto quando o site não está no Remessa Conforme', () => {
    // mesmo abaixo de US$ 50: US$40 → aduaneiro R$200; II = R$120
    const resultado = calcularParidade({ ...baseEncomenda, precoExt: 40, siteCertificado: false });
    expect(linha(resultado, 'Importação').valor).toBeCloseTo(120, 5);
    expect(linha(resultado, 'Importação').label).toContain('fora do Remessa Conforme');
    expect(linha(resultado, 'ICMS').valor).toBeCloseTo((320 / 0.83) * 0.17, 5);
  });

  it('inclui o frete no valor aduaneiro e no limite de US$ 50', () => {
    // produto US$40 + frete US$20 = US$60 → cruza o limite
    const resultado = calcularParidade({ ...baseEncomenda, precoExt: 40, freteExt: 20 });
    // aduaneiro R$300; II = 0,6*300 − 150 = R$30
    expect(linha(resultado, 'Importação').valor).toBeCloseTo(30, 5);
  });

  it('usa a cotação do dólar para o limite quando a moeda não é USD', () => {
    // produto 60 EUR × 6,0 = R$360 → em USD (cotação 5,0) = US$72 → faixa alta
    const resultado = calcularParidade({ ...baseEncomenda, precoExt: 60, cotacao: 6.0, cotacaoUSD: 5.0 });
    expect(linha(resultado, 'Importação').valor).toBeCloseTo(0.6 * 360 - 30 * 5.0, 5);
  });

  it('nunca deixa o II negativo logo acima do limite', () => {
    // US$51 → 0,6*255 − 150 = 3 (positivo); o piso em 0 cobre descontos maiores que o imposto
    const resultado = calcularParidade({ ...baseEncomenda, precoExt: 51 });
    expect(linha(resultado, 'Importação').valor).toBeGreaterThanOrEqual(0);
  });

  it('avisa quando a compra passa do limite do regime simplificado', () => {
    const acima = calcularParidade({ ...baseEncomenda, precoExt: 3500 });
    const dentro = calcularParidade({ ...baseEncomenda, precoExt: 2500 });
    expect(acima.avisos.join(' ')).toMatch(/US\$ 3\.000/);
    expect(dentro.avisos).toEqual([]);
  });

  it('a soma do breakdown bate com o custo externo total', () => {
    const resultado = calcularParidade({ ...baseEncomenda, precoExt: 100, freteExt: 10, spread: 2 });
    const soma = resultado.breakdown.reduce((acc, item) => acc + item.valor, 0);
    expect(soma).toBeCloseTo(resultado.custoExt, 5);
  });
});

describe('calcularParidade — tax free (informado pelo usuário)', () => {
  const base = { ...baseViagem, precoBR: 5000, parcelasBR: 1, precoExt: 1000, spread: 0, iofCartao: 0 };

  it('abate o percentual informado do custo no exterior', () => {
    const sem = calcularParidade({ ...base, taxFreePct: 0 });
    const com = calcularParidade({ ...base, taxFreePct: 12 });
    // 1000 × 12% × cotação 5,0 = R$ 600 de volta
    expect(sem.custoExt - com.custoExt).toBeCloseTo(600, 5);
  });

  it('registra o reembolso como valor negativo no breakdown', () => {
    const resultado = calcularParidade({ ...base, taxFreePct: 12 });
    const linha = resultado.breakdown.find((i) => i.label.includes('tax free'))!;
    expect(linha.valor).toBeLessThan(0);
    expect(linha.label).toContain('12,0%');
  });

  it('a soma do breakdown continua batendo com o custo total', () => {
    const resultado = calcularParidade({ ...base, taxFreePct: 12, spread: 2, iofCartao: 0.035 });
    const soma = resultado.breakdown.reduce((acc, i) => acc + i.valor, 0);
    expect(soma).toBeCloseTo(resultado.custoExt, 5);
  });

  it('não incide sobre o frete, apenas sobre o produto', () => {
    const semFrete = calcularParidade({ ...base, taxFreePct: 10, freteExt: 0 });
    const comFrete = calcularParidade({ ...base, taxFreePct: 10, freteExt: 200 });
    const reembolso = (r: typeof semFrete) => r.breakdown.find((i) => i.label.includes('tax free'))!.valor;
    expect(reembolso(comFrete)).toBeCloseTo(reembolso(semFrete), 5);
  });

  it('é ignorado no cenário Encomenda', () => {
    const encomenda = { ...base, cenario: 'Encomenda' as const, taxFreePct: 12 };
    const resultado = calcularParidade(encomenda);
    expect(resultado.breakdown.some((i) => i.label.includes('tax free'))).toBe(false);
  });

  it('não altera nada quando o usuário não informa a taxa', () => {
    const resultado = calcularParidade({ ...base, taxFreePct: 0 });
    expect(resultado.breakdown.some((i) => i.label.includes('tax free'))).toBe(false);
  });
});

describe('calcularParidade — economia percentual', () => {
  it('calcula o percentual sobre a opção mais cara', () => {
    const resultado = calcularParidade({ ...baseViagem, precoBR: 1000, parcelasBR: 1, precoExt: 100, spread: 0, iofCartao: 0 });
    // custoExt = 500; custoBR = 1000 → economia 500 = 50% de 1000
    expect(resultado.economiaPct).toBeCloseTo(50, 5);
  });

  it('retorna 0% quando ambos os custos são zero', () => {
    const resultado = calcularParidade({ ...baseViagem, precoBR: 0, parcelasBR: 1, precoExt: 0 });
    expect(resultado.economiaPct).toBe(0);
  });
});

describe('calcularParidade — veredito', () => {
  const base = { ...baseViagem, parcelasBR: 1, spread: 0, iofCartao: 0 };

  it('diz "Compre no Brasil." quando o Brasil sai mais barato', () => {
    const r = calcularParidade({ ...base, precoBR: 400, precoExt: 100 });
    expect(r.veredito).toBe('brasil');
    expect(r.msg).toBe('Compre no Brasil.');
  });

  it('diz "Vale importar." quando importar sai mais barato', () => {
    const r = calcularParidade({ ...base, precoBR: 1000, precoExt: 100 });
    expect(r.veredito).toBe('exterior');
    expect(r.msg).toBe('Vale importar.');
  });

  it('diz "Tanto faz." quando a diferença fica abaixo de 1%', () => {
    // custoExt = 500; custoBR = 503 → 0,6%
    const r = calcularParidade({ ...base, precoBR: 503, precoExt: 100 });
    expect(r.veredito).toBe('empate');
    expect(r.msg).toBe('Tanto faz.');
    // valeImportar continua refletindo o lado mais barato (histórico salvo)
    expect(r.valeImportar).toBe(true);
  });

  it('classifica cada linha do detalhamento pelo tipo', () => {
    const r = calcularParidade({ ...baseViagem, cenario: 'Encomenda', precoExt: 100, parcelasBR: 1 });
    expect(r.breakdown.map((i) => i.tipo)).toEqual(['produto', 'iof', 'ii', 'icms']);
    expect(r.breakdown[2]).toMatchObject({ regraII: 'faixaAlta', aliquota: 0.6 });
  });
});

describe('calcularPontoDeVirada', () => {
  // Na cotação de equilíbrio, as duas opções custam o mesmo. O real se move contra
  // todas as moedas na mesma proporção: o dólar escala junto com a moeda da compra.
  function custosNaCotacao(input: CalculoInput, cotacao: number) {
    const k = cotacao / input.cotacao;
    return calcularParidade({ ...input, cotacao, cotacaoUSD: input.cotacaoUSD * k });
  }

  function confereEquilibrio(input: CalculoInput) {
    const ponto = calcularPontoDeVirada(input);
    const naVirada = custosNaCotacao(input, ponto);
    expect(naVirada.custoExt).toBeCloseTo(naVirada.custoBR, 6);
    return ponto;
  }

  const encomenda: CalculoInput = { ...baseViagem, cenario: 'Encomenda', precoBR: 3799, parcelasBR: 10, precoExt: 399 };

  it('encomenda no Remessa Conforme (faixa com desconto de US$ 30)', () => {
    const ponto = confereEquilibrio(encomenda);
    // Brasil mais barato hoje → a virada fica abaixo da cotação atual
    expect(calcularParidade(encomenda).valeImportar).toBe(false);
    expect(ponto).toBeLessThan(encomenda.cotacao);
  });

  it('encomenda até US$ 50 (II zero)', () => {
    confereEquilibrio({ ...encomenda, precoExt: 40, precoBR: 300 });
  });

  it('encomenda fora do Remessa Conforme', () => {
    confereEquilibrio({ ...encomenda, siteCertificado: false });
  });

  it('encomenda em euro, com o limite de US$ 50 lido pela cotação do dólar', () => {
    confereEquilibrio({ ...encomenda, cotacao: 6.2, cotacaoUSD: 5.4, precoExt: 300 });
  });

  it('viagem dentro da cota, com tax free', () => {
    const viagem = { ...baseViagem, taxFreePct: 8 };
    const ponto = confereEquilibrio(viagem);
    // importar vale hoje → a virada fica acima da cotação atual
    expect(ponto).toBeGreaterThan(viagem.cotacao);
  });

  it('viagem acima da cota: o excedente não entra no custo, e a relação continua proporcional', () => {
    const acima = { ...baseViagem, precoExt: 1500 };
    expect(calcularParidade(acima).avisos.join(' ')).toMatch(/cota de isenção/);
    confereEquilibrio(acima);
  });

  it('sem parcelamento, compara com o preço cheio do Brasil', () => {
    const aVista = { ...baseViagem, parcelasBR: 1, precoBR: 4500 };
    const r = calcularParidade(aVista);
    expect(r.pontoDeVirada).toBeCloseTo((aVista.cotacao * 4500) / r.custoExt, 8);
    confereEquilibrio(aVista);
  });

  it('é infinito quando não há custo no exterior', () => {
    expect(calcularPontoDeVirada({ ...baseViagem, precoExt: 0 })).toBe(Infinity);
  });
});
