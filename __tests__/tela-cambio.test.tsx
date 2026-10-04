import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';

import Cambio from '@/app/(tabs)/cambio';
import { recarregarAlertas } from '@/hooks/use-alertas-cambio';
import { recarregarHistorico } from '@/hooks/use-historico-simulacoes';
import { CHAVES } from '@/services/armazenamento';

jest.mock('@/services/mercado', () => ({
  ...jest.requireActual('@/services/mercado'),
  carregarDadosMercado: jest.fn(async () => ({
    cotacoes: { USD: 5.42, EUR: 6.31, GBP: 7.2, JPY: 0.036, ARS: 0.004, CLP: 0.006 },
    selicAnual: 15,
    selicMensal: 0.0117,
    atualizadoEm: new Date().toISOString(),
    origem: 'rede',
  })),
  // média 5,56; última 5,42 (2,5% abaixo)
  carregarSerie90d: jest.fn(async () => ({
    pontos: [
      { data: new Date(2026, 6, 10).getTime(), valor: 5.6 },
      { data: new Date(2026, 8, 10).getTime(), valor: 5.66 },
      { data: new Date(2026, 9, 3).getTime(), valor: 5.42 },
    ],
    atualizadoEm: new Date().toISOString(),
    origem: 'rede',
  })),
}));

beforeEach(async () => {
  await AsyncStorage.clear();
  await recarregarAlertas();
  await recarregarHistorico();
  jest.clearAllMocks();
});

async function abrir() {
  await render(<Cambio />);
  await screen.findByText('R$ 5,42');
}

async function alertasSalvos() {
  return JSON.parse((await AsyncStorage.getItem(CHAVES.alertas)) ?? '[]');
}

describe('Câmbio', () => {
  it('mostra a cotação, a variação do dia e o insight comparativo, sem previsão', async () => {
    await abrir();
    expect(screen.getByText('−4,2% hoje')).toBeTruthy();
    expect(screen.getByText('média 5,56 · mín 5,42')).toBeTruthy();
    expect(screen.getByText('Abaixo da média')).toBeTruthy();
    expect(screen.getByText('O dólar está 2,5% abaixo da média de 90 dias.')).toBeTruthy();
    expect(screen.getByText(/Comparação com o passado, não previsão\./)).toBeTruthy();
    expect(screen.queryByText(/compre agora/i)).toBeNull();
  });

  it('cita a última simulação salva na moeda e sugere o ponto de virada dela', async () => {
    await AsyncStorage.setItem(
      CHAVES.historico,
      JSON.stringify([
        {
          id: 's1',
          data: '2026-10-01T12:00:00.000Z',
          nomeProduto: 'Sony',
          precoBR: 3799,
          parcelasBR: 10,
          precoExt: 399,
          moeda: 'USD',
          pgto: 'Cartao',
          spread: 2,
          valeImportar: false,
          custoBR: 3565.7,
          custoExt: 4281.55,
          economia: 715.85,
          cotacao: 5.42,
        },
      ])
    );
    await recarregarHistorico();
    await abrir();

    expect(screen.getByText(/No Sony que você simulou, são ~R\$ 111 a menos que na média\./)).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Novo alerta'));
    // 5,42 × 3.565,70 ÷ 4.281,55 = 4,51
    expect(screen.getByText('Sugestão: R$ 4,51')).toBeTruthy();
    expect(screen.getByLabelText('cotação alvo em reais: R$ 4,51')).toBeTruthy();
  });

  it('cria o primeiro alerta, pede permissão e liga a verificação em segundo plano', async () => {
    await abrir();
    await fireEvent.press(screen.getByLabelText('Novo alerta'));
    expect(screen.getByText('Avisar quando o dólar ficar abaixo de')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Diminuir cotação alvo em reais'));
    await fireEvent.press(screen.getByLabelText('Criar alerta'));

    await waitFor(() => expect(Notifications.requestPermissionsAsync).toHaveBeenCalled());
    await waitFor(() => expect(BackgroundTask.registerTaskAsync).toHaveBeenCalled());
    expect(await screen.findByText('USD abaixo de R$ 5,25')).toBeTruthy();
    expect(screen.getByText('Falta 3,1%')).toBeTruthy();
    expect(await alertasSalvos()).toMatchObject([{ moeda: 'USD', alvo: 5.25, direcao: 'abaixo', ativo: true }]);
  });

  it('mostra na hora e marca como avisado o alerta que já atingiu o alvo', async () => {
    await AsyncStorage.setItem(
      CHAVES.alertas,
      JSON.stringify([{ id: 'a', moeda: 'USD', alvo: 5.5, direcao: 'abaixo', criadoEm: '2026-10-01T00:00:00.000Z' }])
    );
    await recarregarAlertas();
    await abrir();

    expect(await screen.findByText('No alvo')).toBeTruthy();
    await waitFor(async () => expect((await alertasSalvos())[0].notificadoEm).toBeDefined());
  });

  it('desliga um alerta pelo switch sem apagá-lo', async () => {
    await AsyncStorage.setItem(
      CHAVES.alertas,
      JSON.stringify([{ id: 'a', moeda: 'EUR', alvo: 6.2, direcao: 'abaixo', criadoEm: '2026-10-01T00:00:00.000Z' }])
    );
    await recarregarAlertas();
    await abrir();

    await fireEvent(screen.getByLabelText('Alerta EUR abaixo de R$ 6,20 ligado'), 'valueChange', false);

    await waitFor(async () => expect((await alertasSalvos())[0].ativo).toBe(false));
    expect(screen.getByText('Desligado')).toBeTruthy();
  });

  it('edita e exclui um alerta tocando nele', async () => {
    await AsyncStorage.setItem(
      CHAVES.alertas,
      JSON.stringify([{ id: 'a', moeda: 'USD', alvo: 5.3, direcao: 'abaixo', criadoEm: '2026-10-01T00:00:00.000Z' }])
    );
    await recarregarAlertas();
    await abrir();

    await fireEvent.press(screen.getByLabelText('USD abaixo de R$ 5,30. Toque para editar.'));
    await fireEvent.press(screen.getByLabelText('Remover alerta'));

    await waitFor(async () => expect(await alertasSalvos()).toEqual([]));
  });
});
