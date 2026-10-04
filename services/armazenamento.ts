import AsyncStorage from '@react-native-async-storage/async-storage';

// Chaves do AsyncStorage, todas sob o prefixo do projeto.
export const CHAVES = {
  tema: '@emporos:tema',
  onboarding: '@emporos:onboarding_visto',
  moeda: '@emporos:moeda_selecionada',
  historico: '@emporos:historico_simulacoes',
  alertas: '@emporos:alertas_cambio',
  dadosMercado: '@emporos:dados_mercado',
} as const;

export type Chave = (typeof CHAVES)[keyof typeof CHAVES];

// Nomes anteriores ao rename para emporos (v2.2.0). Pode sair quando ninguém mais
// tiver uma instalação anterior a essa versão.
const CHAVES_ANTIGAS: Record<Chave, string> = {
  [CHAVES.tema]: '@paridade:tema',
  [CHAVES.onboarding]: '@paridade:onboarding_visto',
  [CHAVES.moeda]: '@paridade:moeda_selecionada',
  [CHAVES.historico]: '@vale_importar:historico_simulacoes',
  [CHAVES.alertas]: '@paridade:alertas_cambio',
  [CHAVES.dadosMercado]: '@paridade:dados_mercado',
};

// Lê a chave; se ela ainda não existe, traz o valor da chave antiga (e apaga a antiga).
// Migrar na leitura evita corrida com quem lê o storage logo na abertura do app.
export async function lerComMigracao(chave: Chave): Promise<string | null> {
  const atual = await AsyncStorage.getItem(chave);
  if (atual !== null) return atual;

  const antiga = CHAVES_ANTIGAS[chave];
  const valorAntigo = await AsyncStorage.getItem(antiga);
  if (valorAntigo === null) return null;

  await AsyncStorage.setItem(chave, valorAntigo);
  await AsyncStorage.removeItem(antiga);
  return valorAntigo;
}
