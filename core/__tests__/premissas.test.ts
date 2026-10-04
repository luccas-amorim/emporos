import {
  PREMISSAS_PADRAO,
  passoSpread,
  rotuloPagamento,
  rotulosPremissas,
  SPREAD_MAXIMO,
  situacaoCota,
} from '@/core/premissas';

describe('rotulosPremissas', () => {
  it('lista as premissas da encomenda na ordem dos chips', () => {
    expect(rotulosPremissas({ ...PREMISSAS_PADRAO, icms: 0.2 })).toEqual([
      'Encomenda',
      'Remessa Conforme',
      'ICMS 20%',
      'Cartão · IOF 3,5%',
      'Spread 2%',
    ]);
  });

  it('marca site fora do programa, espécie e spread fracionado', () => {
    expect(rotulosPremissas({ ...PREMISSAS_PADRAO, siteCertificado: false, pgto: 'Dinheiro', spread: 1.5 })).toEqual([
      'Encomenda',
      'Fora do Remessa Conforme',
      'ICMS 17%',
      'Espécie · IOF 3,5%',
      'Spread 1,5%',
    ]);
  });

  it('em viagem, tira as premissas que só valem para encomenda', () => {
    expect(rotulosPremissas({ ...PREMISSAS_PADRAO, cenario: 'Viagem' })).toEqual([
      'Viagem',
      'Cartão · IOF 3,5%',
      'Spread 2%',
    ]);
  });
});

describe('rotuloPagamento', () => {
  it('mostra o IOF de cada forma de pagamento', () => {
    expect(rotuloPagamento('Cartao')).toBe('Cartão · 3,5%');
    expect(rotuloPagamento('Dinheiro')).toBe('Espécie · 3,5%');
  });
});

describe('passoSpread', () => {
  it('anda de 0,5 em 0,5 e fica entre 0 e o máximo', () => {
    expect(passoSpread(2, 1)).toBe(2.5);
    expect(passoSpread(2, -1)).toBe(1.5);
    expect(passoSpread(0, -1)).toBe(0);
    expect(passoSpread(SPREAD_MAXIMO, 1)).toBe(SPREAD_MAXIMO);
    expect(passoSpread(0.1 + 0.2, 1)).toBe(0.8);
  });
});

describe('situacaoCota', () => {
  it('compara o preço em dólar com a cota de bagagem', () => {
    // € 160 × 6,31 ÷ 5,42 ≈ US$ 186
    expect(situacaoCota(160, 6.31, 5.42)).toEqual({ dentro: true, rotulo: 'Dentro da cota de US$ 1.000' });
    expect(situacaoCota(1200, 5.42, 5.42)).toEqual({ dentro: false, rotulo: 'Acima da cota de US$ 1.000' });
  });

  it('fica de fora sem preço ou cotação', () => {
    expect(situacaoCota(0, 5, 5)).toBeNull();
    expect(situacaoCota(100, 0, 5)).toBeNull();
  });
});
