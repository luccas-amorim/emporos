import {
  type AlertaCambio,
  alvoInicial,
  atualizarAlertas,
  distanciaAlvo,
  passoAlvo,
  rotuloAlerta,
  rotuloDistancia,
  textoNotificacao,
  verificarAlertas,
} from '@/services/alertas';

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
      titulo: 'Dólar Americano caiu até o seu alvo',
      corpo: 'A cotação está em R$ 5,10 (alvo: R$ 5,20). Abra o app para refazer a comparação com a cotação de hoje.',
    });
  });

  it('descreve a alta', () => {
    const alta = alerta({ moeda: 'EUR', alvo: 5.7, direcao: 'acima' });
    expect(textoNotificacao(alta, 5.8).titulo).toBe('Euro subiu até o seu alvo');
  });
});

describe('alertas desligados', () => {
  const cotacoes = { USD: 5.1 };

  it('não disparam nem mudam, mas continuam na lista', () => {
    const desligado = alerta({ moeda: 'USD', alvo: 5.2, direcao: 'abaixo', ativo: false });
    expect(verificarAlertas([desligado], cotacoes)).toEqual([]);
    const { alertas, disparados, mudou } = atualizarAlertas([desligado], cotacoes, new Date());
    expect(disparados).toEqual([]);
    expect(mudou).toBe(false);
    expect(alertas).toEqual([desligado]);
  });

  it('alertas antigos, sem o campo, contam como ligados', () => {
    const antigo = alerta({ moeda: 'USD', alvo: 5.2, direcao: 'abaixo' });
    expect(verificarAlertas([antigo], cotacoes)).toEqual([antigo]);
  });
});

describe('rotulos da lista de alertas', () => {
  it('descreve o alvo e quanto falta', () => {
    const queda = alerta({ moeda: 'USD', alvo: 5.3, direcao: 'abaixo' });
    expect(rotuloAlerta(queda)).toBe('USD abaixo de R$ 5,30');
    expect(distanciaAlvo(queda, 5.42)).toBeCloseTo(2.214, 3);
    expect(rotuloDistancia(queda, 5.42)).toBe('Falta 2,2%');
    expect(rotuloDistancia(queda, 5.25)).toBe('No alvo');
  });

  it('funciona para alertas de alta', () => {
    const alta = alerta({ moeda: 'EUR', alvo: 6.5, direcao: 'acima' });
    expect(rotuloAlerta(alta)).toBe('EUR acima de R$ 6,50');
    expect(rotuloDistancia(alta, 6.2)).toBe('Falta 4,8%');
  });
});

describe('stepper do alvo', () => {
  it('anda de R$ 0,05 sem erro de ponto flutuante e não passa de zero', () => {
    expect(passoAlvo(5.3, 1)).toBe(5.35);
    expect(passoAlvo(5.3, -1)).toBe(5.25);
    expect(passoAlvo(0.05, -1)).toBe(0.05);
  });

  it('abre na sugestão ou perto da cotação de hoje', () => {
    expect(alvoInicial(5.42, 'abaixo', 4.514)).toBe(4.51);
    expect(alvoInicial(5.42, 'abaixo')).toBe(5.3);
    expect(alvoInicial(5.42, 'acima')).toBe(5.55);
    expect(alvoInicial(5.42, 'abaixo', Infinity)).toBe(5.3);
  });
});
