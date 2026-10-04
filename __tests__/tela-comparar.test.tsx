import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';

import Comparar from '@/app/(tabs)/index';
import Resultado from '@/app/resultado';
import { recarregarAlertas } from '@/hooks/use-alertas-cambio';
import { recarregarHistorico } from '@/hooks/use-historico-simulacoes';
import { definirSimulacaoAtual } from '@/hooks/use-simulacao-atual';
import { CHAVES } from '@/services/armazenamento';
import { lerProduto } from '@/services/produto';

jest.mock('expo-clipboard', () => ({ getStringAsync: jest.fn(async () => '') }));
jest.mock('@/services/produto', () => ({ lerProduto: jest.fn() }));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({})),
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
}));

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
  await recarregarHistorico();
  await recarregarAlertas();
  definirSimulacaoAtual(null);
  paramsMock.mockReturnValue({});
  mockPush.mockClear();
  (lerProduto as jest.Mock).mockReset();
});

async function abrirComparar() {
  const tela = await render(<Comparar />);
  await screen.findByText(/USD 5,00 ·/);
  return tela;
}

async function preencherEComparar(precoBR: string, precoExt: string) {
  await fireEvent.changeText(screen.getByLabelText('Preço total no Brasil em reais'), precoBR);
  await fireEvent.changeText(screen.getByLabelText('Preço no exterior em Dólar Americano'), precoExt);
  await fireEvent.press(screen.getByLabelText('Calcular comparação'));
}

async function ajustarPremissas(...rotulos: string[]) {
  await fireEvent.press(screen.getByLabelText('Ajustar premissas'));
  for (const rotulo of rotulos) await fireEvent.press(screen.getByLabelText(rotulo));
  await fireEvent.press(screen.getByLabelText('Aplicar'));
}

// O Resultado é outra rota: depois do "Comparar", desmonta a tela e abre a dele.
async function abrirResultado(tela: Awaited<ReturnType<typeof render>>) {
  expect(mockPush).toHaveBeenCalledWith('/resultado');
  await tela.unmount();
  await render(<Resultado />);
}

describe('Colar link', () => {
  const colar = (texto: string) => (Clipboard.getStringAsync as jest.Mock).mockResolvedValueOnce(texto);

  it('cola o link, lê a página e preenche nome, preço e moeda', async () => {
    colar('Olha: https://www.loja.de/p/asics');
    (lerProduto as jest.Mock).mockResolvedValueOnce({
      status: 'ok',
      url: 'https://www.loja.de/p/asics',
      produto: { nome: 'Asics Gel-Kayano 31', preco: 160, moeda: 'EUR', loja: 'loja.de', fonte: 'jsonld' },
    });
    await abrirComparar();

    await fireEvent.press(screen.getByLabelText('Colar link do produto'));

    expect(await screen.findByText('do link')).toBeTruthy();
    expect(lerProduto).toHaveBeenCalledWith('https://www.loja.de/p/asics');
    expect(screen.getByLabelText('Link do produto (opcional)').props.value).toBe('https://www.loja.de/p/asics');
    expect(screen.getByLabelText('Nome do produto (opcional)').props.value).toBe('Asics Gel-Kayano 31');
    expect(screen.getByLabelText('Preço no exterior em Euro').props.value).toBe('160');
    expect(screen.getByText('loja.de · Remessa Conforme')).toBeTruthy();
  });

  it('quando não dá para ler o preço, avisa sem bloquear e mantém o link', async () => {
    colar('https://www.bestbuy.com/site/6539');
    (lerProduto as jest.Mock).mockResolvedValueOnce({ status: 'falhou', url: 'https://www.bestbuy.com/site/6539' });
    await abrirComparar();

    await fireEvent.press(screen.getByLabelText('Colar link do produto'));

    expect(await screen.findByText(/Não conseguimos ler o preço desta página/)).toBeTruthy();
    expect(screen.getByLabelText('Link do produto (opcional)').props.value).toBe('https://www.bestbuy.com/site/6539');

    await preencherEComparar('1000', '100');
    expect(abriuResultado()).toBeTruthy();
  });

  it('texto que não é link vai para o campo, sem buscar nada', async () => {
    colar('fone sony');
    await abrirComparar();
    await fireEvent.press(screen.getByLabelText('Colar link do produto'));
    await waitFor(() => expect(screen.getByLabelText('Link do produto (opcional)').props.value).toBe('fone sony'));
    expect(lerProduto).not.toHaveBeenCalled();
  });
});

function abriuResultado() {
  return mockPush.mock.calls.some(([rota]) => rota === '/resultado');
}

describe('Comparar', () => {
  it('fica desabilitado, com a dica, enquanto faltam os preços', async () => {
    await abrirComparar();
    expect(screen.getByText('Preencha os dois preços para comparar.')).toBeTruthy();
    expect(screen.getByLabelText('Calcular comparação').props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('calcula uma encomenda com as regras vigentes e abre o Resultado', async () => {
    const tela = await abrirComparar();

    // US$ 100 × 5,10 = 510; IOF 3,5%; II 60% − US$ 30 = 150; ICMS 17% por dentro
    await preencherEComparar('1000', '100');
    await abrirResultado(tela);

    expect(screen.getByText('Vale importar.')).toBeTruthy();
    expect(screen.getByText('Produto · US$ 100 × 5,10')).toBeTruthy();
    expect(screen.getByText('Imp. Importação 60% − US$ 30')).toBeTruthy();
    expect(screen.getByText('150,00')).toBeTruthy();
    expect(screen.getByText('ICMS 17% por dentro')).toBeTruthy();
    expect(screen.getByText('IOF cartão 3,5%')).toBeTruthy();
    expect(screen.getByText(/Regras fiscais de/)).toBeTruthy();
    expect(screen.getByText('Ponto de virada')).toBeTruthy();
  });

  it('usa o ICMS escolhido nas premissas e o salva para os próximos usos', async () => {
    const tela = await abrirComparar();

    await ajustarPremissas('ICMS de 20%');
    expect(screen.getByText('ICMS 20%')).toBeTruthy();
    await preencherEComparar('1000', '100');
    await abrirResultado(tela);

    expect(screen.getByText('ICMS 20% por dentro')).toBeTruthy();
    expect(await AsyncStorage.getItem(CHAVES.icms)).toBe('0.2');
  });

  it('cobra 60% sem desconto em site fora do Remessa Conforme', async () => {
    const tela = await abrirComparar();

    await ajustarPremissas('Site fora do Remessa Conforme');
    expect(screen.getByText('Fora do Remessa Conforme')).toBeTruthy();
    await preencherEComparar('1000', '40');
    await abrirResultado(tela);

    expect(screen.getByText('Imp. Importação 60%, fora do Remessa Conforme')).toBeTruthy();
  });

  it('descarta as premissas quando o sheet fecha sem aplicar', async () => {
    await abrirComparar();
    await fireEvent.press(screen.getByLabelText('Ajustar premissas'));
    await fireEvent.press(screen.getByLabelText('Pagamento em dinheiro'));
    await fireEvent.press(screen.getByLabelText('Fechar'));

    await waitFor(() => expect(screen.queryByLabelText('Aplicar')).toBeNull());
    expect(screen.getByText('Cartão · IOF 3,5%')).toBeTruthy();
  });

  it('lembra as premissas aplicadas', async () => {
    const primeira = await abrirComparar();
    await ajustarPremissas('Pagamento em dinheiro', 'Aumentar spread bancário em porcentagem');
    expect(JSON.parse((await AsyncStorage.getItem(CHAVES.premissas)) ?? '{}')).toMatchObject({
      pgto: 'Dinheiro',
      spread: 2.5,
    });
    await primeira.unmount();

    await abrirComparar();
    expect(await screen.findByText('Espécie · IOF 3,5%')).toBeTruthy();
    expect(screen.getByText('Spread 2,5%')).toBeTruthy();
  });

  it('salva a simulação no histórico só quando o usuário toca em Salvar', async () => {
    const tela = await abrirComparar();

    await fireEvent.changeText(screen.getByLabelText('Nome do produto (opcional)'), 'Fone');
    await preencherEComparar('1000', '100');
    await abrirResultado(tela);
    expect(await AsyncStorage.getItem(CHAVES.historico)).toBeNull();

    await fireEvent.press(screen.getByLabelText('Salvar no histórico'));

    await waitFor(async () => {
      const salvo = JSON.parse((await AsyncStorage.getItem(CHAVES.historico)) ?? '{}').simulacoes ?? [];
      expect(salvo).toHaveLength(1);
      expect(salvo[0]).toMatchObject({ nomeProduto: 'Fone', precoBR: 1000, precoExt: 100, icms: 0.17, siteCertificado: true });
    });
    expect(screen.getByLabelText('Simulação salva no histórico')).toBeTruthy();
  });

  it('cria um alerta no ponto de virada a partir do Resultado da encomenda', async () => {
    const tela = await abrirComparar();
    await fireEvent.changeText(screen.getByLabelText('Nome do produto (opcional)'), 'Fone');
    await preencherEComparar('500', '100');
    await abrirResultado(tela);
    expect(screen.getByText('Compre no Brasil.')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Criar alerta para quando o dólar cair'));
    expect(screen.getByText(/É o ponto de virada do Fone/)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Criar alerta'));

    await waitFor(async () => {
      const alertas = JSON.parse((await AsyncStorage.getItem(CHAVES.alertas)) ?? '[]');
      expect(alertas).toHaveLength(1);
      expect(alertas[0]).toMatchObject({ moeda: 'USD', direcao: 'abaixo' });
      expect(alertas[0].alvo).toBeLessThan(5);
    });
    expect(screen.getByLabelText('Alerta do dólar criado')).toBeTruthy();
  });

  it('em viagem, mostra a cota e avisa quando o preço passa dela', async () => {
    const tela = await abrirComparar();

    await ajustarPremissas('Cenário compra em viagem');
    await fireEvent.changeText(screen.getByLabelText('Preço no exterior em Dólar Americano'), '1200');
    expect(screen.getByText('Acima da cota de US$ 1.000')).toBeTruthy();
    expect(screen.getByLabelText('Percentual de tax free que você espera recuperar')).toBeTruthy();

    await preencherEComparar('9000', '1200');
    await abrirResultado(tela);

    expect(screen.getByText(/Passa da cota de isenção de US\$ 1\.000/)).toBeTruthy();
    expect(screen.getByText('Custo na viagem')).toBeTruthy();
  });

  it('edita as parcelas no sheet do card "No Brasil"', async () => {
    await abrirComparar();
    await fireEvent.changeText(screen.getByLabelText('Preço total no Brasil em reais'), '1000');
    await fireEvent.press(screen.getByLabelText('Editar parcelas'));
    for (let i = 0; i < 9; i++) await fireEvent.press(screen.getByLabelText('Aumentar número de parcelas'));
    await fireEvent.press(screen.getByLabelText('Pronto'));

    expect(screen.getByText('10x de R$ 100,00')).toBeTruthy();
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
    await abrirComparar();

    expect(screen.getByLabelText('Preço total no Brasil em reais').props.value).toBe('2500');
    expect(screen.getByText('10x de R$ 250,00')).toBeTruthy();
    expect(screen.getByLabelText('Percentual de tax free que você espera recuperar').props.value).toBe('12');
    expect(screen.getByLabelText('Nome do produto (opcional)').props.value).toBe('Câmera');
    expect(screen.getByText('Spread 1,5%')).toBeTruthy();
  });
});
