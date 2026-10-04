import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import type { CurrencyCode } from '@/constants/currencies';
import { type AlertaCambio, atualizarAlertas, type DirecaoAlerta } from '@/services/alertas';
import { CHAVES, lerComMigracao } from '@/services/armazenamento';
import { lerPermissao, pedirPermissao, type StatusPermissao } from '@/services/notificacoes';
import { sincronizarTarefaAlertas } from '@/services/tarefa-alertas';

const LIMITE_ALERTAS = 20;

export function useAlertasCambio() {
  const [alertas, setAlertas] = useState<AlertaCambio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [permissao, setPermissao] = useState<StatusPermissao>('pendente');
  const carregou = useRef(false);

  const carregar = useCallback(() => {
    return lerComMigracao(CHAVES.alertas)
      .then((bruto) => setAlertas(bruto ? JSON.parse(bruto) : []))
      .catch((error) => console.error('❌ Erro ao carregar alertas:', error));
  }, []);

  useEffect(() => {
    carregar().finally(() => {
      carregou.current = true;
      setCarregando(false);
    });
    lerPermissao().then(setPermissao).catch(() => {});

    // A tarefa em segundo plano pode ter gravado alertas enquanto o app estava
    // fechado; relemos ao voltar, para não sobrescrever o que ela marcou.
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') carregar();
    });
    return () => assinatura.remove();
  }, [carregar]);

  useEffect(() => {
    if (!carregou.current) return;
    AsyncStorage.setItem(CHAVES.alertas, JSON.stringify(alertas)).catch((error) =>
      console.error('❌ Erro ao salvar alertas:', error)
    );
  }, [alertas]);

  // A verificação periódica só fica ligada enquanto houver alertas.
  const haAlertas = alertas.length > 0;
  useEffect(() => {
    if (carregando) return;
    sincronizarTarefaAlertas(haAlertas).catch((error) =>
      console.error('❌ Erro ao agendar a verificação de alertas:', error)
    );
  }, [haAlertas, carregando]);

  const adicionarAlerta = useCallback((moeda: CurrencyCode, alvo: number, direcao: DirecaoAlerta) => {
    const novo: AlertaCambio = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      moeda,
      alvo,
      direcao,
      criadoEm: new Date().toISOString(),
    };
    setAlertas((atual) => [novo, ...atual].slice(0, LIMITE_ALERTAS));
  }, []);

  const removerAlerta = useCallback((id: string) => {
    setAlertas((atual) => atual.filter((a) => a.id !== id));
  }, []);

  // Com o app aberto, o aviso aparece no próprio card; marcamos os alertas como
  // avisados para a verificação em segundo plano não repetir a mesma notícia.
  const sincronizarComCotacoes = useCallback((cotacoes: Partial<Record<CurrencyCode, number>>) => {
    setAlertas((atual) => {
      const { alertas: atualizados, mudou } = atualizarAlertas(atual, cotacoes, new Date());
      return mudou ? atualizados : atual;
    });
  }, []);

  const pedirPermissaoNotificacao = useCallback(async () => {
    setPermissao(await pedirPermissao());
  }, []);

  return {
    alertas,
    carregando,
    permissao,
    adicionarAlerta,
    removerAlerta,
    sincronizarComCotacoes,
    pedirPermissaoNotificacao,
  };
}
