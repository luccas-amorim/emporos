import {
  paramsRecalculo,
  pontoDeViradaSalvo,
  type SimulacaoSalva,
  ultimaSimulacaoNaMoeda,
} from '@/hooks/use-historico-simulacoes';

const base: SimulacaoSalva = {
  id: '1',
  data: '2026-10-02T12:00:00.000Z',
  precoBR: 1500,
  parcelasBR: 10,
  precoExt: 250.5,
  moeda: 'EUR',
  pgto: 'Cartao',
  spread: 2,
  valeImportar: true,
  custoBR: 1400,
  custoExt: 1300,
  economia: 100,
};

describe('paramsRecalculo', () => {
  it('leva o tax free da simulação de viagem de volta para a Home', () => {
    const params = paramsRecalculo({ ...base, cenario: 'Viagem', taxFreePct: 12 });
    expect(params.taxFree).toBe('12');
    expect(params.cenario).toBe('Viagem');
  });

  it('preenche todos os campos, inclusive os vazios, para não herdar valores da simulação anterior', () => {
    const params = paramsRecalculo({ ...base, cenario: 'Encomenda' });
    expect(params).toEqual({
      precoBR: '1500',
      parcelasBR: '10',
      precoExt: '250.5',
      freteExt: '',
      moeda: 'EUR',
      pgto: 'Cartao',
      spread: '2',
      cenario: 'Encomenda',
      taxFree: '',
      icms: '',
      certificado: 'sim',
      nomeProduto: '',
      link: '',
      observacao: '',
    });
  });

  it('leva o ICMS e o Remessa Conforme da encomenda de volta para a Home', () => {
    const params = paramsRecalculo({ ...base, cenario: 'Encomenda', icms: 0.2, siteCertificado: false });
    expect(params.icms).toBe('0.2');
    expect(params.certificado).toBe('nao');
  });

  it('trata simulações antigas sem cenário como viagem', () => {
    expect(paramsRecalculo(base).cenario).toBe('Viagem');
  });
});

describe('ultimaSimulacaoNaMoeda e pontoDeViradaSalvo', () => {
  const antigaSemCotacao: SimulacaoSalva = { ...base, id: 'a', moeda: 'USD' };
  const dolar: SimulacaoSalva = { ...base, id: 'b', moeda: 'USD', cotacao: 5.4, custoBR: 1400, custoExt: 1300 };
  const euro: SimulacaoSalva = { ...base, id: 'c', moeda: 'EUR', cotacao: 6.2 };

  it('pega a mais recente da moeda que tem cotação da época', () => {
    expect(ultimaSimulacaoNaMoeda([euro, antigaSemCotacao, dolar], 'USD')?.id).toBe('b');
    expect(ultimaSimulacaoNaMoeda([euro], 'GBP')).toBeNull();
  });

  it('calcula o ponto de virada com a cotação e os custos da época', () => {
    expect(pontoDeViradaSalvo(dolar)).toBeCloseTo((5.4 * 1400) / 1300, 10);
    expect(pontoDeViradaSalvo(antigaSemCotacao)).toBeNull();
  });
});
