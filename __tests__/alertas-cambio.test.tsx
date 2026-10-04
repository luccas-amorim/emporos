import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';

import { AlertasCambio } from '@/components/alertas-cambio';
import { CHAVES } from '@/services/armazenamento';

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('AlertasCambio', () => {
  it('ao criar o primeiro alerta, pede permissão e liga a verificação em segundo plano', async () => {
    await render(<AlertasCambio cotacoes={{ USD: 5.3 }} />);
    await screen.findByText(/vamos pedir permissão/);

    await fireEvent.changeText(screen.getByLabelText('Cotação alvo em reais'), '5,10');
    await fireEvent.press(screen.getByLabelText('Criar alerta'));

    await waitFor(() => expect(Notifications.requestPermissionsAsync).toHaveBeenCalled());
    await waitFor(() => expect(BackgroundTask.registerTaskAsync).toHaveBeenCalled());
    expect(await screen.findByText(/Verificamos a cotação em segundo plano/)).toBeTruthy();
  });

  it('mostra na hora e marca como avisado o alerta que já atingiu o alvo', async () => {
    await AsyncStorage.setItem(
      CHAVES.alertas,
      JSON.stringify([{ id: 'a', moeda: 'USD', alvo: 5.2, direcao: 'abaixo', criadoEm: '2026-10-01T00:00:00.000Z' }])
    );
    await render(<AlertasCambio cotacoes={{ USD: 5.1 }} />);

    expect(await screen.findByText(/USD caiu até seu alvo/)).toBeTruthy();
    await waitFor(async () => {
      const salvos = JSON.parse((await AsyncStorage.getItem(CHAVES.alertas)) ?? '[]');
      expect(salvos[0].notificadoEm).toBeDefined();
    });
  });
});
