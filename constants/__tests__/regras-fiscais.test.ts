import { FONTES_FISCAIS, REGRAS_FISCAIS, rotuloRevisao } from '@/constants/regras-fiscais';

describe('regras fiscais', () => {
  it('tem data de revisão válida e não futura', () => {
    expect(REGRAS_FISCAIS.revisadoEm).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(REGRAS_FISCAIS.revisadoEm).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('formata a revisão como mês/ano', () => {
    expect(rotuloRevisao('2026-10-03')).toBe('out/2026');
    expect(rotuloRevisao('2027-01-15')).toBe('jan/2027');
  });

  it('mantém as alíquotas entre 0 e 1', () => {
    const aliquotas = [
      REGRAS_FISCAIS.iof.cartao,
      REGRAS_FISCAIS.iof.especie,
      REGRAS_FISCAIS.remessaConforme.aliquotaFaixaBaixa,
      REGRAS_FISCAIS.remessaConforme.aliquotaFaixaAlta,
      REGRAS_FISCAIS.aliquotaForaRemessaConforme,
      REGRAS_FISCAIS.bagagem.aliquotaExcedente,
      ...REGRAS_FISCAIS.icms.opcoes,
    ];
    for (const a of aliquotas) {
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(1);
    }
  });

  it('usa como padrão uma das opções de ICMS', () => {
    expect(REGRAS_FISCAIS.icms.opcoes).toContain(REGRAS_FISCAIS.icms.padrao);
  });

  it('cita uma fonte oficial com link para cada regra', () => {
    expect(FONTES_FISCAIS.length).toBeGreaterThanOrEqual(4);
    for (const fonte of FONTES_FISCAIS) expect(fonte.url).toMatch(/^https:\/\//);
  });
});
