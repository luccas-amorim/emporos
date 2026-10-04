import { type AlertaCambio, atualizarAlertas, textoNotificacao, verificarAlertas } from '@/services/alertas';

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

describe('atualizarAlertas', () => {
  const agora = new Date('2026-10-03T12:00:00.000Z');
  const cotacoes = { USD: 5.1, EUR: 5.8 };

  it('dispara e marca como notificado o alerta que atingiu o alvo', () => {
    const queda = alerta({ id: 'a', moeda: 'USD', alvo: 5.2, direcao: 'abaixo' });
    const { alertas, disparados } = atualizarAlertas([queda], cotacoes, agora);

    expect(disparados.map((a) => a.id)).toEqual(['a']);
    expect(alertas[0].notificadoEm).toBe(agora.toISOString());
  });

  it('não repete a notificação enquanto a cotação segue no alvo', () => {
    const jaAvisado = alerta({ moeda: 'USD', alvo: 5.2, direcao: 'abaixo', notificadoEm: '2026-10-02T00:00:00.000Z' });
    const { alertas, disparados } = atualizarAlertas([jaAvisado], cotacoes, agora);

    expect(disparados).toEqual([]);
    expect(alertas[0].notificadoEm).toBe('2026-10-02T00:00:00.000Z');
  });

  it('rearma o alerta quando a cotação sai do alvo, para avisar de novo depois', () => {
    const jaAvisado = alerta({ moeda: 'USD', alvo: 5.0, direcao: 'abaixo', notificadoEm: '2026-10-02T00:00:00.000Z' });
    const { alertas, disparados } = atualizarAlertas([jaAvisado], cotacoes, agora);

    expect(disparados).toEqual([]);
    expect(alertas[0].notificadoEm).toBeUndefined();
  });

  it('mantém como está o alerta de moeda sem cotação', () => {
    const semCotacao = alerta({ moeda: 'GBP', alvo: 7, direcao: 'abaixo', notificadoEm: '2026-10-02T00:00:00.000Z' });
    const { alertas, disparados } = atualizarAlertas([semCotacao], cotacoes, agora);

    expect(disparados).toEqual([]);
    expect(alertas[0]).toEqual(semCotacao);
  });

  it('informa se algo mudou, para evitar gravações desnecessárias', () => {
    const fora = alerta({ moeda: 'USD', alvo: 5.0, direcao: 'abaixo' });
    expect(atualizarAlertas([fora], cotacoes, agora).mudou).toBe(false);

    const dentro = alerta({ moeda: 'USD', alvo: 5.2, direcao: 'abaixo' });
    expect(atualizarAlertas([dentro], cotacoes, agora).mudou).toBe(true);
  });
});

describe('textoNotificacao', () => {
  it('descreve a queda com o nome da moeda, a cotação e o alvo', () => {
    const queda = alerta({ moeda: 'USD', alvo: 5.2, direcao: 'abaixo' });
    expect(textoNotificacao(queda, 5.1)).toEqual({
      titulo: '🎯 Dólar Americano caiu até o seu alvo',
      corpo: 'A cotação está em R$ 5,10 (alvo: R$ 5,20). Bom momento para simular a compra.',
    });
  });

  it('descreve a alta', () => {
    const alta = alerta({ moeda: 'EUR', alvo: 5.7, direcao: 'acima' });
    expect(textoNotificacao(alta, 5.8).titulo).toBe('🎯 Euro subiu até o seu alvo');
  });
});
