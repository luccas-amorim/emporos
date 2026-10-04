import { vereditoDeCustos } from '@/core/calculadora';
import {
  entradaDoRegistro,
  historicoDesatualizado,
  type MercadoHoje,
  migrarHistorico,
  recalcularSimulacao,
  resumoMudancas,
  rotuloData,
  rotuloVereditoCurto,
  type SimulacaoSalva,
  VERSAO_HISTORICO,
} from '@/core/historico';

const NOMES = { USD: 'o dólar', EUR: 'o euro', GBP: 'a libra', JPY: 'o iene', ARS: 'o peso argentino', CLP: 'o peso chileno' };

const mercado = (usd: number, eur = 6.3): MercadoHoje => ({
  cotacoes: { USD: usd, EUR: eur, GBP: 7, JPY: 0.035, ARS: 0.004, CLP: 0.006 },
  selicMensal: 0.0117,
});

// Encomenda de US$ 300 contra R$ 2.500 à vista: a 5,40 o Brasil vence; a 4,00, importar.
const switch2: SimulacaoSalva = {
  id: 's',
  data: '2026-09-12T12:00:00.000Z',
  nomeProduto: 'Nintendo Switch 2',
  precoBR: 2500,
  parcelasBR: 1,
  precoExt: 300,
  moeda: 'USD',
  pgto: 'Cartao',
  spread: 2,
  valeImportar: false,
  custoBR: 2500,
  custoExt: 3000,
  economia: 500,
  cenario: 'Encomenda',
  icms: 0.17,
  siteCertificado: true,
  cotacao: 5.4,
};

describe('vereditoDeCustos', () => {
  it('usa o mesmo limite de empate do cálculo', () => {
    expect(vereditoDeCustos(1000, 1200)).toBe('brasil');
    expect(vereditoDeCustos(1200, 1000)).toBe('exterior');
    expect(vereditoDeCustos(1000, 1005)).toBe('empate');
  });
});

describe('migrarHistorico', () => {
  it('converte a lista solta da v1 sem perder nenhum registro', () => {
    const v1 = [
      switch2,
      { ...switch2, id: 'antiga', cenario: undefined, icms: undefined, cotacao: undefined, valeImportar: true, custoBR: 900, custoExt: 700 },
    ];
    const migrado = migrarHistorico(v1);
    expect(migrado.versao).toBe(VERSAO_HISTORICO);
    expect(migrado.simulacoes).toHaveLength(2);
    expect(migrado.simulacoes[0]).toEqual({ ...switch2, vereditoOriginal: 'brasil' });
    expect(migrado.simulacoes[1]).toMatchObject({ id: 'antiga', vereditoOriginal: 'exterior', precoBR: 2500 });
  });

  it('mantém o vereditoOriginal de quem já está na v2', () => {
    const v2 = { versao: 2, simulacoes: [{ ...switch2, vereditoOriginal: 'empate' }] };
    expect(migrarHistorico(v2).simulacoes[0].vereditoOriginal).toBe('empate');
    expect(historicoDesatualizado(v2)).toBe(false);
    expect(historicoDesatualizado([switch2])).toBe(true);
  });

  it('descarta só itens que não são simulações', () => {
    expect(migrarHistorico([switch2, null, 3, { foo: 1 }]).simulacoes.map((s) => s.id)).toEqual(['s']);
  });

  it('lança em formato desconhecido, para não sobrescrever o que está salvo', () => {
    expect(() => migrarHistorico({ qualquer: 'coisa' })).toThrow();
    expect(() => migrarHistorico('texto')).toThrow();
  });
});

describe('entradaDoRegistro', () => {
  it('usa a cotação e a Selic de hoje e as regras fiscais vigentes', () => {
    const entrada = entradaDoRegistro(switch2, mercado(5.0));
    expect(entrada).toMatchObject({ cotacao: 5.0, cotacaoUSD: 5.0, selicMensal: 0.0117, cenario: 'Encomenda', icms: 0.17 });
    expect(entrada.iofCartao).toBe(0.035);
  });

  it('trata simulações antigas sem cenário como viagem, sem frete', () => {
    const antiga = { ...switch2, cenario: undefined, freteExt: 20, taxFreePct: 10 };
    expect(entradaDoRegistro(antiga, mercado(5))).toMatchObject({ cenario: 'Viagem', freteExt: 0, taxFreePct: 10 });
  });
});

describe('recalcularSimulacao', () => {
  it('marca como mudou quando o veredito inverte com o câmbio de hoje', () => {
    const hoje = recalcularSimulacao(switch2, mercado(4.0));
    expect(hoje.vereditoOriginal).toBe('brasil');
    expect(hoje.vereditoAtual).toBe('exterior');
    expect(hoje.mudou).toBe(true);
  });

  it('não marca quando o veredito se mantém', () => {
    const hoje = recalcularSimulacao(switch2, mercado(5.6));
    expect(hoje.vereditoAtual).toBe('brasil');
    expect(hoje.mudou).toBe(false);
  });

  it('empate não conta como inversão', () => {
    const empatado = { ...switch2, vereditoOriginal: 'empate' as const };
    expect(recalcularSimulacao(empatado, mercado(4.0)).mudou).toBe(false);
  });
});

describe('resumoMudancas', () => {
  it('conta a história de uma decisão que mudou', () => {
    const r = resumoMudancas([recalcularSimulacao(switch2, mercado(4.0))], (m) => NOMES[m]);
    expect(r).toEqual({
      titulo: '1 decisão mudou',
      sentido: 'exterior',
      texto: 'Com o dólar a R$ 4,00, Nintendo Switch 2 agora vale importar.',
    });
  });

  it('resume várias mudanças e some quando nada mudou', () => {
    const outra = { ...switch2, id: 't', nomeProduto: 'Kindle' };
    const lista = [recalcularSimulacao(switch2, mercado(4.0)), recalcularSimulacao(outra, mercado(4.0))];
    expect(resumoMudancas(lista, (m) => NOMES[m])?.titulo).toBe('2 decisões mudaram');
    expect(resumoMudancas([recalcularSimulacao(switch2, mercado(5.6))], (m) => NOMES[m])).toBeNull();
  });
});

describe('rótulos do card', () => {
  it('resume veredito e diferença em reais inteiros', () => {
    expect(rotuloVereditoCurto('brasil', 715.85)).toBe('Brasil · R$ 716');
    expect(rotuloVereditoCurto('exterior', 1234.4)).toBe('Importar · R$ 1.234');
    expect(rotuloVereditoCurto('empate', 3)).toBe('Tanto faz · R$ 3');
  });

  it('mostra a data de forma curta', () => {
    const agora = new Date(2026, 9, 4, 12);
    expect(rotuloData(new Date(2026, 9, 4, 8).toISOString(), agora)).toBe('hoje');
    expect(rotuloData(new Date(2026, 9, 3, 8).toISOString(), agora)).toBe('ontem');
    expect(rotuloData(new Date(2026, 8, 12, 8).toISOString(), agora)).toBe('12 set');
    expect(rotuloData(new Date(2025, 11, 1, 8).toISOString(), agora)).toBe('1 dez 2025');
  });
});
