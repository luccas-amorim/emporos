import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';

import Home from '@/app/(tabs)/index';
import { CHAVES } from '@/services/armazenamento';

jest.mock('expo-router', () => ({ useLocalSearchParams: jest.fn(() => ({})) }));

jest.mock('@/services/mercado', () => ({
  ...jest.requireActual('@/services/mercado'),
  carregarDadosMercado: jest.fn(async () => ({
    cotacoes: { USD: 5, EUR: 6, GBP: 7, JPY: 0.03, ARS: 0.004, CLP: 0.005 },
    selicAnual: 12.68,
    selicMensal: 0.01,
    atualizadoEm: new Date().toISOString(),
    origem: 'rede',
  })),
}));

const paramsMock = useLocalSearchParams as jest.Mock;

beforeEach(async () => {
  await AsyncStorage.clear();
  paramsMock.mockReturnValue({});
});

async function preencherECalcular(precoBR: string, precoExt: string) {
  await fireEvent.changeText(screen.getByLabelText('Preço total no Brasil em reais'), precoBR);
  await fireEvent.changeText(screen.getByLabelText('Preço no exterior em Dólar Americano'), precoExt);
  await fireEvent.press(screen.getByLabelText('Calcular comparação'));
}

describe('Home', () => {
  it('calcula uma encomenda com as regras fiscais vigentes', async () => {
    await render(<Home />);
    await screen.findByText(/Cotação atualizada/);

    // US$ 100 × 5,10 = 510; IOF 3,5%; II 60% − US$ 30 = 150; ICMS 17% por dentro
    await preencherECalcular('1000', '100');

    expect(screen.getByText('✈️ COMPRE NO EXTERIOR')).toBeTruthy();
    expect(screen.getByText('Imposto de Importação (60% − US$ 30)')).toBeTruthy();
    expect(screen.getByText('R$ 150,00')).toBeTruthy();
    expect(screen.getByText('ICMS (17%, por dentro)')).toBeTruthy();
    expect(screen.getByText('IOF (3,5%)')).toBeTruthy();
    expect(screen.getByText(/Regras fiscais de/)).toBeTruthy();
  });

  it('usa o ICMS escolhido e o salva para os próximos usos', async () => {
    await render(<Home />);
    await screen.findByText(/Cotação atualizada/);

    await fireEvent.press(screen.getByLabelText('ICMS de 20%'));
    await preencherECalcular('1000', '100');

    expect(screen.getByText('ICMS (20%, por dentro)')).toBeTruthy();
    expect(await AsyncStorage.getItem(CHAVES.icms)).toBe('0.2');
  });

  it('cobra 60% sem desconto em site fora do Remessa Conforme', async () => {
    await render(<Home />);
    await screen.findByText(/Cotação atualizada/);

    await fireEvent.press(screen.getByLabelText('Site fora do Remessa Conforme'));
    await preencherECalcular('1000', '40');

    expect(screen.getByText('Imposto de Importação (60%, site fora do Remessa Conforme)')).toBeTruthy();
  });

  it('salva a simulação no histórico', async () => {
    await render(<Home />);
    await screen.findByText(/Cotação atualizada/);

    await fireEvent.changeText(screen.getByLabelText('Nome do produto (opcional)'), 'Fone');
    await preencherECalcular('1000', '100');

    const salvo = JSON.parse((await AsyncStorage.getItem(CHAVES.historico)) ?? '[]');
    expect(salvo).toHaveLength(1);
    expect(salvo[0]).toMatchObject({ nomeProduto: 'Fone', precoBR: 1000, precoExt: 100, icms: 0.17, siteCertificado: true });
  });

  it('avisa quando a viagem passa da cota de bagagem', async () => {
    await render(<Home />);
    await screen.findByText(/Cotação atualizada/);

    await fireEvent.press(screen.getByLabelText('Cenário compra em viagem'));
    await preencherECalcular('9000', '1200');

    expect(screen.getByText(/Passa da cota de isenção de US\$ 1\.000/)).toBeTruthy();
  });

  it('preenche o formulário a partir do "Recalcular hoje"', async () => {
    paramsMock.mockReturnValue({
      prefill: '1',
      precoBR: '2500',
      parcelasBR: '10',
      precoExt: '300',
      freteExt: '',
      moeda: 'USD',
      pgto: 'Cartao',
      spread: '1.5',
      cenario: 'Viagem',
      taxFree: '12',
      icms: '',
      certificado: 'sim',
      nomeProduto: 'Câmera',
      link: '',
      observacao: '',
    });
    await render(<Home />);
    await screen.findByText(/Cotação atualizada/);

    expect(screen.getByLabelText('Preço total no Brasil em reais').props.value).toBe('2500');
    expect(screen.getByLabelText('Número de parcelas').props.value).toBe('10');
    expect(screen.getByLabelText('Percentual de tax free que você espera recuperar').props.value).toBe('12');
    expect(screen.getByLabelText('Nome do produto (opcional)').props.value).toBe('Câmera');
  });
});
