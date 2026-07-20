import { type AlertaCambio, verificarAlertas } from '@/services/alertas';

function alerta(parcial: Partial<AlertaCambio> & Pick<AlertaCambio, 'moeda' | 'alvo' | 'direcao'>): AlertaCambio {
  return { id: parcial.id ?? Math.random().toString(36), criadoEm: '2026-07-20T00:00:00.000Z', ...parcial };
}

describe('verificarAlertas', () => {
  const cotacoes = { USD: 5.1, EUR: 5.8 };

  it('dispara alerta de queda quando a cotação está no alvo ou abaixo', () => {
    const abaixo = alerta({ moeda: 'USD', alvo: 5.2, direcao: 'abaixo' });
    const aindaNao = alerta({ moeda: 'USD', alvo: 5.0, direcao: 'abaixo' });
    expect(verificarAlertas([abaixo, aindaNao], cotacoes)).toEqual([abaixo]);
  });

  it('dispara alerta de alta quando a cotação está no alvo ou acima', () => {
    const acima = alerta({ moeda: 'EUR', alvo: 5.7, direcao: 'acima' });
    const aindaNao = alerta({ moeda: 'EUR', alvo: 6.0, direcao: 'acima' });
    expect(verificarAlertas([acima, aindaNao], cotacoes)).toEqual([acima]);
  });

  it('dispara no valor exato do alvo', () => {
    const exato = alerta({ moeda: 'USD', alvo: 5.1, direcao: 'abaixo' });
    expect(verificarAlertas([exato], cotacoes)).toEqual([exato]);
  });

  it('ignora alertas de moedas sem cotação disponível', () => {
    const semCotacao = alerta({ moeda: 'GBP', alvo: 7.0, direcao: 'abaixo' });
    expect(verificarAlertas([semCotacao], cotacoes)).toEqual([]);
  });

  it('retorna vazio sem alertas cadastrados', () => {
    expect(verificarAlertas([], cotacoes)).toEqual([]);
  });
});
