import React from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Texto } from '@/components/ui/texto';
import type { CurrencyCode } from '@/constants/currencies';
import { useTema } from '@/hooks/use-tema';
import { type AlertaCambio, alertaAtivo, distanciaAlvo, rotuloAlerta, rotuloDistancia } from '@/services/alertas';

interface ListaAlertasProps {
  alertas: AlertaCambio[];
  cotacoes: Partial<Record<CurrencyCode, number>> | null;
  aoAlternar: (alerta: AlertaCambio, ativo: boolean) => void;
  aoEditar: (alerta: AlertaCambio) => void;
}

// Lista agrupada: "USD abaixo de R$ 5,30 · Falta 2,2%" e o switch que liga e desliga.
export function ListaAlertas({ alertas, cotacoes, aoAlternar, aoEditar }: ListaAlertasProps) {
  const { cores } = useTema();

  if (alertas.length === 0) {
    return (
      <Texto tamanho={13} cor="textSubtle" style={styles.vazio}>
        Nenhum alerta ainda. Crie um para saber quando a cotação chegar ao seu alvo.
      </Texto>
    );
  }

  return (
    <View style={[styles.grupo, { backgroundColor: cores.card, borderColor: cores.border }]}>
      {alertas.map((alerta, i) => {
        const cotacao = cotacoes?.[alerta.moeda];
        const ativo = alertaAtivo(alerta);
        const noAlvo = cotacao !== undefined && distanciaAlvo(alerta, cotacao) === 0;
        const rotulo = rotuloAlerta(alerta);
        return (
          <View key={alerta.id} style={[styles.linha, i > 0 && { borderTopWidth: 1, borderTopColor: cores.border }]}>
            <Pressable
              style={styles.textos}
              onPress={() => aoEditar(alerta)}
              accessibilityRole="button"
              accessibilityLabel={`${rotulo}. Toque para editar.`}>
              <Texto tamanho={14} peso={500} cor={ativo ? 'text' : 'textSubtle'}>
                {rotulo}
              </Texto>
              {cotacao !== undefined ? (
                <Texto tamanho={12} cor={noAlvo && ativo ? 'brasil' : 'textSubtle'} peso={noAlvo && ativo ? 600 : 400}>
                  {ativo ? rotuloDistancia(alerta, cotacao) : 'Desligado'}
                </Texto>
              ) : null}
            </Pressable>
            <Switch
              value={ativo}
              onValueChange={(v) => aoAlternar(alerta, v)}
              trackColor={{ true: cores.brasil, false: cores.surface2 }}
              thumbColor="#ffffff"
              accessibilityLabel={`Alerta ${rotulo} ${ativo ? 'ligado' : 'desligado'}`}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 14, minHeight: 56 },
  textos: { flex: 1, gap: 2, paddingVertical: 4 },
  vazio: { paddingHorizontal: 4, lineHeight: 18 },
});
