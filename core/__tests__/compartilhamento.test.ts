import { textoCompartilhamento } from '@/core/compartilhamento';

const base = { valeImportar: true, custoBR: 1000, custoExt: 800, economia: 200, economiaPct: 20 };

describe('textoCompartilhamento', () => {
  it('resume o veredito e os valores em reais', () => {
    expect(textoCompartilhamento({ ...base, nomeProduto: 'Fone' })).toBe(
      'Simulei Fone no Vale importar?: vale mais a pena importar! ' +
        'Brasil: R$ 1.000,00 × Exterior: R$ 800,00 (diferença de R$ 200,00, 20,0%).'
    );
  });

  it('usa "um produto" quando não há nome', () => {
    expect(textoCompartilhamento({ ...base, nomeProduto: '  ' })).toMatch(/^Simulei um produto/);
  });

  it('diz para comprar no Brasil quando importar não compensa', () => {
    expect(textoCompartilhamento({ ...base, valeImportar: false })).toMatch(/vale mais a pena comprar no Brasil!/);
  });
});
