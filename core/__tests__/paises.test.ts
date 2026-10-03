import { filtrarPaises, PAISES, paisesOrdenados, paisPorCodigo } from '@/constants/paises';

describe('catálogo de países', () => {
  it('devolve a lista completa em ordem alfabética', () => {
    const todos = paisesOrdenados();
    expect(todos).toHaveLength(PAISES.length);
    const nomes = todos.map((p) => p.nome);
    expect(nomes).toEqual([...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR')));
  });

  it('todo país aponta para uma moeda suportada pelo app', () => {
    const suportadas = ['USD', 'EUR', 'GBP', 'JPY', 'ARS', 'CLP'];
    for (const pais of PAISES) expect(suportadas).toContain(pais.moeda);
  });

  it('não tem códigos duplicados', () => {
    const codigos = PAISES.map((p) => p.codigo);
    expect(new Set(codigos).size).toBe(codigos.length);
  });

  it('encontra país por código', () => {
    expect(paisPorCodigo('JP')?.nome).toBe('Japão');
    expect(paisPorCodigo('XX')).toBeUndefined();
  });
});

describe('filtrarPaises', () => {
  const lista = paisesOrdenados();

  it('ignora acentos e caixa na busca', () => {
    expect(filtrarPaises(lista, 'japao').map((p) => p.codigo)).toContain('JP');
    expect(filtrarPaises(lista, 'ESPANHA').map((p) => p.codigo)).toContain('ES');
    expect(filtrarPaises(lista, 'áustria').map((p) => p.codigo)).toContain('AT');
    expect(filtrarPaises(lista, 'italia').map((p) => p.codigo)).toContain('IT');
  });

  it('busca também pela sigla da moeda', () => {
    const porMoeda = filtrarPaises(lista, 'JPY');
    expect(porMoeda.length).toBeGreaterThan(0);
    expect(porMoeda.every((p) => p.moeda === 'JPY')).toBe(true);
  });

  it('devolve tudo com termo vazio e nada sem correspondência', () => {
    expect(filtrarPaises(lista, '   ')).toHaveLength(lista.length);
    expect(filtrarPaises(lista, 'zzzz')).toHaveLength(0);
  });
});
