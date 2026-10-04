import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import Historico from '@/app/(tabs)/historico';
import { recarregarHistorico } from '@/hooks/use-historico-simulacoes';
import { CHAVES } from '@/services/armazenamento';

const mockPush = jest.fn();
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return {
    useRouter: () => ({ push: mockPush, back: jest.fn() }),
    useFocusEffect: (efeito: () => void) => useEffect(efeito, [efeito]),
  };
});

// Dólar de hoje a R$ 4,00: a encomenda de US$ 300 contra R$ 2.500 vira "importar".
jest.mock('@/services/mercado', () => ({
  ...jest.requireActual('@/services/mercado'),
  carregarDadosMercado: jest.fn(async () => ({
    cotacoes: { USD: 4, EUR: 6.3, GBP: 7, JPY: 0.035, ARS: 0.004, CLP: 0.006 },
    selicAnual: 15,
    selicMensal: 0.0117,
    atualizadoEm: new Date().toISOString(),
    origem: 'rede',
  })),
}));

const SWITCH = {
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
const KINDLE = { ...SWITCH, id: 'k', nomeProduto: 'Kindle', precoBR: 1000, precoExt: 100, custoBR: 1000, custoExt: 700, economia: 300, valeImportar: true };

async function salvo() {
  return JSON.parse((await AsyncStorage.getItem(CHAVES.historico)) ?? 'null');
}

async function abrirCom(conteudo: unknown) {
  await AsyncStorage.setItem(CHAVES.historico, typeof conteudo === 'string' ? conteudo : JSON.stringify(conteudo));
  await recarregarHistorico();
  await render(<Historico />);
}

beforeEach(async () => {
  await AsyncStorage.clear();
  await recarregarHistorico();
  mockPush.mockClear();
});

describe('Histórico', () => {
  it('migra o histórico antigo para a v2 sem perder registros', async () => {
    await abrirCom([SWITCH, KINDLE]);
    await screen.findByText('Nintendo Switch 2');

    const migrado = await salvo();
    expect(migrado.versao).toBe(2);
    expect(migrado.simulacoes.map((s: { id: string }) => s.id)).toEqual(['s', 'k']);
    expect(migrado.simulacoes[0]).toMatchObject({ ...SWITCH, vereditoOriginal: 'brasil' });
  });

  it('recalcula com o câmbio de hoje e destaca a decisão que mudou', async () => {
    await abrirCom([SWITCH, KINDLE]);

    expect(await screen.findByText('1 decisão mudou')).toBeTruthy();
    expect(screen.getByText('Com o dólar a R$ 4,00, Nintendo Switch 2 agora vale importar.')).toBeTruthy();
    expect(screen.getByText('Mudou')).toBeTruthy();
    expect(screen.getByText('Na época')).toBeTruthy();
    expect(screen.getByText('Brasil · R$ 500')).toBeTruthy();
    expect(screen.getByText('Recalculado com o câmbio de hoje')).toBeTruthy();
  });

  it('abre o Resultado recalculado, já marcado como salvo', async () => {
    await abrirCom([SWITCH]);
    await fireEvent.press(await screen.findByLabelText(/^Nintendo Switch 2, Encomenda · USD/));
    expect(mockPush).toHaveBeenCalledWith('/resultado');
  });

  it('exclui uma simulação pelo menu de ações', async () => {
    await abrirCom([SWITCH, KINDLE]);
    await fireEvent.press(await screen.findByLabelText('Mais ações: Kindle'));
    await fireEvent.press(screen.getByLabelText('Excluir esta simulação'));

    await waitFor(async () => expect((await salvo()).simulacoes.map((s: { id: string }) => s.id)).toEqual(['s']));
  });

  it('limpa tudo só depois de confirmar', async () => {
    await abrirCom([SWITCH, KINDLE]);
    await fireEvent.press(await screen.findByLabelText('Limpar todo o histórico'));
    expect(screen.getByText('Apagar 2 simulações')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Confirmar limpeza do histórico'));

    await waitFor(async () => expect((await salvo()).simulacoes).toEqual([]));
    expect(await screen.findByText(/Nenhuma simulação salva ainda/)).toBeTruthy();
  });

  it('guarda uma cópia do histórico ilegível antes de qualquer gravação', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await abrirCom('{isso não é json');
    await waitFor(async () =>
      expect(await AsyncStorage.getItem(`${CHAVES.historico}_ilegivel`)).toBe('{isso não é json')
    );
  });
});
