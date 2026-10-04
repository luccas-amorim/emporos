import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import type { CurrencyCode } from '@/constants/currencies';
import { type AlertaCambio, alertaAtivo, atualizarAlertas, type DirecaoAlerta } from '@/services/alertas';
import { CHAVES, lerComMigracao } from '@/services/armazenamento';
import { lerPermissao, pedirPermissao, type StatusPermissao } from '@/services/notificacoes';
import { sincronizarTarefaAlertas } from '@/services/tarefa-alertas';

const LIMITE_ALERTAS = 20;

// Um só estado de alertas para o app: a aba Câmbio e o "Avisar se o dólar cair" do
// Resultado criam e editam a mesma lista, e a tarefa em segundo plano grava nela.
interface EstadoAlertas {
  alertas: AlertaCambio[];
  carregando: boolean;
  permissao: StatusPermissao;
}

let estado: EstadoAlertas = { alertas: [], carregando: true, permissao: 'pendente' };
let carga: Promise<void> | null = null;
const ouvintes = new Set<() => void>();

function publicar(novo: EstadoAlertas) {
  estado = novo;
  ouvintes.forEach((ouvinte) => ouvinte());
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

/** Relê os alertas salvos (abertura, volta ao app, testes). */
export function recarregarAlertas(): Promise<void> {
  carga = (async () => {
    try {
      const bruto = await lerComMigracao(CHAVES.alertas);
      publicar({ ...estado, alertas: bruto ? JSON.parse(bruto) : [], carregando: false });
    } catch (error) {
      console.error('❌ Erro ao carregar alertas:', error);
      publicar({ ...estado, carregando: false });
    }
  })();
  return carga;
}

async function alterar(mudanca: (atual: AlertaCambio[]) => AlertaCambio[]) {
  await (carga ?? recarregarAlertas());
  const alertas = mudanca(estado.alertas);
  if (alertas === estado.alertas) return;
  publicar({ ...estado, alertas });
  try {
    await AsyncStorage.setItem(CHAVES.alertas, JSON.stringify(alertas));
  } catch (error) {
    console.error('❌ Erro ao salvar alertas:', error);
  }
  // A verificação periódica só fica ligada enquanto houver alerta ligado.
  sincronizarTarefaAlertas(alertas.some(alertaAtivo)).catch((error) =>
    console.error('❌ Erro ao agendar a verificação de alertas:', error)
  );
}

export interface NovoAlerta {
  moeda: CurrencyCode;
  alvo: number;
  direcao: DirecaoAlerta;
  origem?: string;
}

export function useAlertasCambio() {
  const { alertas, carregando, permissao } = useSyncExternalStore(assinar, () => estado);

  useEffect(() => {
    if (!carga) {
      recarregarAlertas().then(() =>
        sincronizarTarefaAlertas(estado.alertas.some(alertaAtivo)).catch((error) =>
          console.error('❌ Erro ao agendar a verificação de alertas:', error)
        )
      );
    }
    lerPermissao()
      .then((p) => publicar({ ...estado, permissao: p }))
      .catch(() => {});

    // A tarefa em segundo plano pode ter gravado alertas enquanto o app estava
    // fechado; relemos ao voltar, para não sobrescrever o que ela marcou.
    const assinatura = AppState.addEventListener('change', (estadoApp) => {
      if (estadoApp === 'active') recarregarAlertas();
    });
    return () => assinatura.remove();
  }, []);

  const adicionarAlerta = useCallback((novo: NovoAlerta) => {
    const alerta: AlertaCambio = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...novo,
      ativo: true,
      criadoEm: new Date().toISOString(),
    };
    alterar((atual) => [alerta, ...atual].slice(0, LIMITE_ALERTAS));
    return alerta.id;
  }, []);

  const editarAlerta = useCallback((id: string, mudanca: Partial<Pick<AlertaCambio, 'alvo' | 'direcao' | 'ativo'>>) => {
    alterar((atual) =>
      atual.map((a) => {
        if (a.id !== id) return a;
        // Mudou o alvo ou a direção: o alerta volta a poder avisar.
        const rearmar = mudanca.alvo !== undefined || mudanca.direcao !== undefined;
        const { notificadoEm, ...resto } = a;
        return { ...(rearmar ? resto : { ...resto, notificadoEm }), ...mudanca };
      })
    );
  }, []);

  const removerAlerta = useCallback((id: string) => {
    alterar((atual) => atual.filter((a) => a.id !== id));
  }, []);

  // Com o app aberto, o aviso aparece na própria tela; marcamos os alertas como
  // avisados para a verificação em segundo plano não repetir a mesma notícia.
  const sincronizarComCotacoes = useCallback((cotacoes: Partial<Record<CurrencyCode, number>>) => {
    alterar((atual) => {
      const { alertas: atualizados, mudou } = atualizarAlertas(atual, cotacoes, new Date());
      return mudou ? atualizados : atual;
    });
  }, []);

  const pedirPermissaoNotificacao = useCallback(async () => {
    const p = await pedirPermissao();
    publicar({ ...estado, permissao: p });
  }, []);

  return {
    alertas,
    carregando,
    permissao,
    adicionarAlerta,
    editarAlerta,
    removerAlerta,
    sincronizarComCotacoes,
    pedirPermissaoNotificacao,
  };
}
