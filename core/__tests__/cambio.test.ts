import {
  desvioDaMedia,
  diferencaPelaMedia,
  fraseImpacto,
  geometriaGrafico,
  insightCambio,
  mediaMinMax,
  type PontoSerie,
  rotulosMeses,
  rotuloVariacao,
  variacaoDoDia,
} from '@/core/cambio';

const DIA = 86400000;
function serie(valores: number[], inicio = new Date(2026, 6, 1).getTime()): PontoSerie[] {
  return valores.map((valor, i) => ({ data: inicio + i * DIA, valor }));
}

describe('mediaMinMax', () => {
  it('calcula média, mínimo e máximo', () => {
    expect(mediaMinMax(serie([5.4, 5.6, 5.5, 5.7]))).toEqual({ media: 5.55, min: 5.4, max: 5.7 });
  });

  it('é nula sem pontos', () => {
    expect(mediaMinMax([])).toBeNull();
  });
});

describe('desvioDaMedia', () => {
  it('é negativo abaixo da média e positivo acima', () => {
    expect(desvioDaMedia(5.42, 5.56)).toBeCloseTo(-2.518, 3);
    expect(desvioDaMedia(5.7, 5.56)).toBeCloseTo(2.518, 3);
    expect(desvioDaMedia(5, 0)).toBe(0);
  });
});

describe('variacaoDoDia', () => {
  it('compara a última cotação com a anterior, mesmo fora de ordem', () => {
    const s = serie([5.5, 5.464, 5.42]).reverse();
    expect(variacaoDoDia(s)).toBeCloseTo(-0.805, 3);
    expect(rotuloVariacao(variacaoDoDia(s)!)).toBe('−0,8% hoje');
    expect(rotuloVariacao(0.3)).toBe('+0,3% hoje');
  });

  it('é nula com menos de dois pontos', () => {
    expect(variacaoDoDia(serie([5.4]))).toBeNull();
  });
});

describe('insightCambio', () => {
  it('abaixo da média, sem falar em comprar', () => {
    expect(insightCambio(5.42, 5.56, 'o dólar')).toEqual({
      abaixo: true,
      rotulo: 'Abaixo da média',
      titulo: 'O dólar está 2,5% abaixo da média de 90 dias.',
    });
  });

  it('acima da média', () => {
    expect(insightCambio(6.5, 6.2, 'o euro')).toMatchObject({
      abaixo: false,
      rotulo: 'Acima da média',
      titulo: 'O euro está 4,8% acima da média de 90 dias.',
    });
  });

  it('na média quando a diferença é desprezível', () => {
    expect(insightCambio(5.5601, 5.56, 'a libra').titulo).toBe('A libra está na média dos últimos 90 dias.');
  });
});

describe('diferencaPelaMedia e fraseImpacto', () => {
  it('escala o custo da simulação pela diferença entre hoje e a média', () => {
    // custo de R$ 4.281,55 calculado a 5,42: na média (5,56) custaria R$ 110,59 a mais
    const dif = diferencaPelaMedia(4281.55, 5.42, 5.42, 5.56);
    expect(dif).toBeCloseTo(-110.59, 2);
    expect(fraseImpacto('Sony WH-1000XM6', dif)).toBe('No Sony WH-1000XM6 que você simulou, são ~R$ 111 a menos que na média.');
  });

  it('usa a cotação da época quando ela difere da de hoje', () => {
    expect(diferencaPelaMedia(1000, 5, 5.5, 5.25)).toBeCloseTo(50, 8);
    expect(fraseImpacto(undefined, 50)).toBe('Na sua última simulação, são ~R$ 50 a mais que na média.');
  });

  it('é zero sem cotação da época', () => {
    expect(diferencaPelaMedia(1000, 0, 5, 5)).toBe(0);
  });
});

describe('geometriaGrafico', () => {
  it('põe o máximo no topo, o mínimo embaixo e o último ponto na borda direita', () => {
    const g = geometriaGrafico(serie([5.6, 5.4, 5.5]), 290, 100, 0)!;
    expect(g.pontos).toBe('0,0 145,100 290,50');
    expect(g.ultimo).toEqual({ x: 290, y: 50 });
    expect(g.yMedia).toBe(50);
  });

  it('respeita a folga vertical e tolera série constante', () => {
    const g = geometriaGrafico(serie([5, 5]), 100, 50, 5)!;
    expect(g.pontos).toBe('0,45 100,45');
  });

  it('aplica a folga horizontal, para o ponto final não ser cortado', () => {
    const g = geometriaGrafico(serie([5, 6]), 100, 50, 0, 5)!;
    expect(g.pontos).toBe('5,50 95,0');
    expect(g.ultimo.x).toBe(95);
  });

  it('é nula com menos de dois pontos', () => {
    expect(geometriaGrafico(serie([5]), 100, 50)).toBeNull();
  });
});

describe('rotulosMeses', () => {
  it('lista os meses cobertos, em ordem', () => {
    const inicio = new Date(2026, 6, 20).getTime();
    expect(rotulosMeses(serie(Array(80).fill(5.4), inicio))).toEqual(['jul', 'ago', 'set', 'out']);
  });
});
