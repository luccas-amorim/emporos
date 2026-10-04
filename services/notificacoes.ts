import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Notificações locais (geradas no próprio aparelho): não há servidor nem token de push.

export type StatusPermissao = 'concedida' | 'negada' | 'pendente' | 'indisponivel';

const CANAL_ANDROID = 'alertas-cambio';

export const notificacoesDisponiveis = Platform.OS === 'ios' || Platform.OS === 'android';

// Chamar uma vez, na abertura do app: mostra a notificação mesmo com o app aberto e
// cria o canal que o Android exige.
export function configurarNotificacoes(): void {
  if (!notificacoesDisponiveis) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(CANAL_ANDROID, {
      name: 'Alertas de câmbio',
      importance: Notifications.AndroidImportance.DEFAULT,
    }).catch(() => {});
  }
}

function paraStatus(status: Notifications.PermissionStatus): StatusPermissao {
  if (status === Notifications.PermissionStatus.GRANTED) return 'concedida';
  if (status === Notifications.PermissionStatus.DENIED) return 'negada';
  return 'pendente';
}

export async function lerPermissao(): Promise<StatusPermissao> {
  if (!notificacoesDisponiveis) return 'indisponivel';
  const { status } = await Notifications.getPermissionsAsync();
  return paraStatus(status);
}

export async function pedirPermissao(): Promise<StatusPermissao> {
  if (!notificacoesDisponiveis) return 'indisponivel';
  const { status } = await Notifications.requestPermissionsAsync();
  return paraStatus(status);
}

export async function notificar(titulo: string, corpo: string): Promise<void> {
  if (!notificacoesDisponiveis) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: titulo, body: corpo },
    trigger: Platform.OS === 'android' ? { channelId: CANAL_ANDROID } : null,
  });
}
