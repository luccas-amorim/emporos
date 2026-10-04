import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { type AlertaCambio, atualizarAlertas, textoNotificacao } from '@/services/alertas';
import { CHAVES, lerComMigracao } from '@/services/armazenamento';
import { buscarCotacoesRede } from '@/services/cambio';
import { notificacoesDisponiveis, notificar } from '@/services/notificacoes';

// Verificação periódica dos alertas de câmbio com o app fechado. O intervalo é um
// mínimo: o sistema decide quando rodar (no iOS, em geral em janelas como a madrugada).

export const TAREFA_ALERTAS = 'emporos-verificar-alertas';
const INTERVALO_MINIMO_MINUTOS = 60;

// Lê os alertas salvos, busca a cotação das moedas envolvidas, notifica os que
// atingiram o alvo e grava o novo estado. Devolve quantos foram notificados.
export async function verificarAlertasSalvos(agora: Date = new Date()): Promise<number> {
  const bruto = await lerComMigracao(CHAVES.alertas);
  const alertas: AlertaCambio[] = bruto ? JSON.parse(bruto) : [];
  if (alertas.length === 0) return 0;

  const moedas = [...new Set(alertas.map((alerta) => alerta.moeda))];
  const cotacoes = await buscarCotacoesRede(moedas);
  const { alertas: atualizados, disparados, mudou } = atualizarAlertas(alertas, cotacoes, agora);

  for (const alerta of disparados) {
    const { titulo, corpo } = textoNotificacao(alerta, cotacoes[alerta.moeda]);
    await notificar(titulo, corpo);
  }
  if (mudou) await AsyncStorage.setItem(CHAVES.alertas, JSON.stringify(atualizados));
  return disparados.length;
}

// A tarefa precisa ser definida no carregamento do módulo (escopo global), antes de o
// sistema acordar o app para executá-la. Importado em app/_layout.tsx.
if (notificacoesDisponiveis && !TaskManager.isTaskDefined(TAREFA_ALERTAS)) {
  TaskManager.defineTask(TAREFA_ALERTAS, async () => {
    try {
      await verificarAlertasSalvos();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

// Liga a verificação periódica enquanto houver alertas e desliga quando não houver.
export async function sincronizarTarefaAlertas(haAlertas: boolean): Promise<void> {
  if (!notificacoesDisponiveis) return;
  if ((await BackgroundTask.getStatusAsync()) !== BackgroundTask.BackgroundTaskStatus.Available) return;

  const registrada = await TaskManager.isTaskRegisteredAsync(TAREFA_ALERTAS);
  if (haAlertas && !registrada) {
    await BackgroundTask.registerTaskAsync(TAREFA_ALERTAS, { minimumInterval: INTERVALO_MINIMO_MINUTOS });
  } else if (!haAlertas && registrada) {
    await BackgroundTask.unregisterTaskAsync(TAREFA_ALERTAS);
  }
}
