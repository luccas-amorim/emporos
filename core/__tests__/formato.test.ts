import { formatarBRL, formatarCotacaoBR, formatarNumeroBR, formatarPct } from '@/core/formato';

describe('formatarNumeroBR', () => {
  it('usa ponto para milhar e vírgula para decimal', () => {
    expect(formatarNumeroBR(1396.6)).toBe('1.396,60');
    expect(formatarNumeroBR(1500)).toBe('1.500,00');
    expect(formatarNumeroBR(1234567.89)).toBe('1.234.567,89');
  });

  it('formata valores pequenos e negativos', () => {
    expect(formatarNumeroBR(0.5)).toBe('0,50');
    expect(formatarNumeroBR(-42.1)).toBe('-42,10');
  });

  it('respeita a quantidade de decimais', () => {
    expect(formatarNumeroBR(3.14159, 4)).toBe('3,1416');
    expect(formatarNumeroBR(10, 0)).toBe('10');
  });
});

describe('formatarBRL', () => {
  it('prefixa com R$', () => {
    expect(formatarBRL(4217.9)).toBe('R$ 4.217,90');
  });

  it('põe o sinal antes do símbolo em valores negativos', () => {
    expect(formatarBRL(-620.32)).toBe('-R$ 620,32');
  });
});

describe('formatarCotacaoBR', () => {
  it('usa 2 casas para cotações >= 1 e 4 casas para menores', () => {
    expect(formatarCotacaoBR(5.09)).toBe('R$ 5,09');
    expect(formatarCotacaoBR(0.0314)).toBe('R$ 0,0314');
  });
});

describe('formatarPct', () => {
  it('formata percentual com vírgula', () => {
    expect(formatarPct(12.5)).toBe('12,5%');
    expect(formatarPct(0.89, 2)).toBe('0,89%');
  });
});
