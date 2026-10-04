import AsyncStorage from '@react-native-async-storage/async-storage';

import { CHAVES, lerComMigracao } from '@/services/armazenamento';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('lerComMigracao', () => {
  it('lê a chave nova quando ela já existe, sem tocar na antiga', async () => {
    await AsyncStorage.setItem(CHAVES.tema, 'escuro');
    await AsyncStorage.setItem('@paridade:tema', 'claro');

    expect(await lerComMigracao(CHAVES.tema)).toBe('escuro');
    expect(await AsyncStorage.getItem('@paridade:tema')).toBe('claro');
  });

  it('migra o valor da chave antiga para a nova e apaga a antiga', async () => {
    await AsyncStorage.setItem('@vale_importar:historico_simulacoes', '[{"id":"1"}]');

    expect(await lerComMigracao(CHAVES.historico)).toBe('[{"id":"1"}]');
    expect(await AsyncStorage.getItem(CHAVES.historico)).toBe('[{"id":"1"}]');
    expect(await AsyncStorage.getItem('@vale_importar:historico_simulacoes')).toBeNull();
  });

  it('devolve null quando não há valor em nenhuma das chaves', async () => {
    expect(await lerComMigracao(CHAVES.moeda)).toBeNull();
  });

  it('usa o prefixo @emporos: em todas as chaves', () => {
    for (const chave of Object.values(CHAVES)) expect(chave.startsWith('@emporos:')).toBe(true);
  });
});
