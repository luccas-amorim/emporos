import { calcularParidade, getIOFPorAno } from '@/core/calculadora';
import { taxaMensalEquivalente } from '@/services/selic';

describe('getIOFPorAno', () => {
  it('segue o cronograma do Decreto nº 11.153/2022', () => {
    expect(getIOFPorAno(2024)).toBeCloseTo(0.0438);
    expect(getIOFPorAno(2025)).toBeCloseTo(0.0338);
    expect(getIOFPorAno(2026)).toBeCloseTo(0.0238);
    expect(getIOFPorAno(2027)).toBeCloseTo(0.0138);
    expect(getIOFPorAno(2028)).toBe(0);
    expect(getIOFPorAno(2030)).toBe(0);
  });

  it('usa o fallback de 4.38% para anos fora do cronograma conhecido', () => {
    expect(getIOFPorAno(2023)).toBeCloseTo(0.0438);
  });
});

describe('calcularParidade', () => {
  // Cenário do docs/WHITEPAPER.md: smartphone R$5.000 em 12x vs US$800 no cartão.
  it('reproduz o exemplo do whitepaper (vale importar)', () => {
    const selicMensal = taxaMensalEquivalente(11.25);

    const resultado = calcularParidade({
      precoBR: 5000,
      parcelasBR: 12,
      precoExt: 800,
      cotacao: 5.0,
      spread: 2.0,
      pgto: 'Cartao',
      selicMensal,
      iofCartao: getIOFPorAno(2025),
      iofDinheiro: 0.011,
    });

    expect(resultado.custoExt).toBeCloseTo(4217.9, 1);
    expect(resultado.valeImportar).toBe(true);
    expect(resultado.economia).toBeCloseTo(resultado.custoBR - resultado.custoExt, 5);
    expect(resultado.economia).toBeGreaterThan(400);
  });

  it('compra à vista no Brasil não é descontada a valor presente', () => {
    const resultado = calcularParidade({
      precoBR: 1000,
      parcelasBR: 1,
      precoExt: 100,
      cotacao: 5.0,
      spread: 0,
      pgto: 'Cartao',
      selicMensal: 0.01,
      iofCartao: 0.0338,
      iofDinheiro: 0.011,
    });

    expect(resultado.custoBR).toBe(1000);
  });

  it('usa o IOF de dinheiro em espécie quando o pagamento é em Dinheiro', () => {
    const base = {
      precoBR: 1000,
      parcelasBR: 1,
      precoExt: 100,
      cotacao: 5.0,
      spread: 0,
      selicMensal: 0.01,
      iofCartao: 0.0338,
      iofDinheiro: 0.011,
    };

    const noCartao = calcularParidade({ ...base, pgto: 'Cartao' });
    const noDinheiro = calcularParidade({ ...base, pgto: 'Dinheiro' });

    expect(noCartao.custoExt).toBeCloseTo(100 * 5.0 * 1.0338, 5);
    expect(noDinheiro.custoExt).toBeCloseTo(100 * 5.0 * 1.011, 5);
  });
});
