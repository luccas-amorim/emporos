import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AlertaCambio } from '@/services/alertas';
import { CHAVES } from '@/services/armazenamento';
import { buscarCotacoesRede } from '@/services/cambio';
import { notificar } from '@/services/notificacoes';
import { verificarAlertasSalvos } from '@/services/tarefa-alertas';

jest.mock('@/services/cambio', () => ({ buscarCotacoesRede: jest.fn() }));
jest.mock('@/services/notificacoes', () => ({ notificacoesDisponiveis: false, notificar: jest.fn() }));

const buscarMock = buscarCotacoesRede as jest.Mock;
const notificarMock = notificar as jest.Mock;
const agora = new Date('2026-10-03T03:00:00.000Z');

function alerta(parcial: Partial<AlertaCambio>): AlertaCambio {
  return { id: '1', moeda: 'USD', alvo: 5.2, direcao: 'abaixo', criadoEm: '2026-10-01T00:00:00.000Z', ...parcial };
}

async function salvar(alertas: AlertaCambio[]) {
  await AsyncStorage.setItem(CHAVES.alertas, JSON.stringify(alertas));
}

async function lidos(): Promise<AlertaCambio[]> {
  return JSON.parse((await AsyncStorage.getItem(CHAVES.alertas)) ?? '[]');
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('verificarAlertasSalvos', () => {
  it('não consulta a rede quando não há alertas', async () => {
    expect(await verificarAlertasSalvos(agora)).toBe(0);
    expect(buscarMock).not.toHaveBeenCalled();
  });

  it('busca só as moedas dos alertas, notifica quem atingiu o alvo e grava o estado', async () => {
    await salvar([alerta({ id: 'a' }), alerta({ id: 'b', moeda: 'EUR', alvo: 5, direcao: 'abaixo' })]);
    buscarMock.mockResolvedValue({ USD: 5.1, EUR: 5.9 });

    expect(await verificarAlertasSalvos(agora)).toBe(1);
    expect(buscarMock).toHaveBeenCalledWith(['USD', 'EUR']);
    expect(notificarMock).toHaveBeenCalledTimes(1);
    expect(notificarMock.mock.calls[0][0]).toContain('Dólar Americano caiu');

    const [a, b] = await lidos();
    expect(a.notificadoEm).toBe(agora.toISOString());
    expect(b.notificadoEm).toBeUndefined();
  });

  it('não notifica de novo um alerta que já avisou', async () => {
    await salvar([alerta({ notificadoEm: '2026-10-02T00:00:00.000Z' })]);
    buscarMock.mockResolvedValue({ USD: 5.1 });

    expect(await verificarAlertasSalvos(agora)).toBe(0);
    expect(notificarMock).not.toHaveBeenCalled();
  });

  it('propaga a falha de rede para a tarefa registrar o erro', async () => {
    await salvar([alerta({})]);
    buscarMock.mockRejectedValue(new Error('sem rede'));

    await expect(verificarAlertasSalvos(agora)).rejects.toThrow('sem rede');
    expect((await lidos())[0].notificadoEm).toBeUndefined();
  });
});
