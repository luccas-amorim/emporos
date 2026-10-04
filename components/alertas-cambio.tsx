import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { FlagIcon } from '@/components/flag-icon';
import { MOEDAS, moedaPorCodigo, type CurrencyCode } from '@/constants/currencies';
import type { Paleta } from '@/constants/theme';
import { parseNumeroLocal } from '@/core/calculadora';
import { formatarCotacaoBR } from '@/core/formato';
import { useAlertasCambio } from '@/hooks/use-alertas-cambio';
import { useTema } from '@/hooks/use-tema';
import { type DirecaoAlerta, verificarAlertas } from '@/services/alertas';
import type { StatusPermissao } from '@/services/notificacoes';

interface AlertasCambioProps {
  cotacoes: Partial<Record<CurrencyCode, number>> | null;
}

// Avisa por notificação quando a cotação chega ao alvo, sem servidor: o próprio aparelho
// verifica de tempos em tempos (services/tarefa-alertas). Com o app aberto, o aviso
// aparece aqui na hora.
const EXPLICACAO: Record<StatusPermissao, string> = {
  concedida:
    '🔔 Verificamos a cotação em segundo plano de tempos em tempos. O celular decide o momento: pode levar algumas horas, e no iPhone costuma ser de madrugada. Com o app aberto, o aviso aparece aqui na hora.',
  negada:
    '🔕 Notificações desativadas: o aviso só aparece com o app aberto. Para receber notificações, ative-as nas configurações do celular.',
  pendente: 'Ao criar o primeiro alerta, vamos pedir permissão para avisar você por notificação.',
  indisponivel: 'Nesta versão, o aviso aparece aqui com o app aberto.',
};

export function AlertasCambio({ cotacoes }: AlertasCambioProps) {
  const { cores } = useTema();
  const styles = useMemo(() => criarStyles(cores), [cores]);
  const {
    alertas,
    carregando,
    permissao,
    adicionarAlerta,
    removerAlerta,
    sincronizarComCotacoes,
    pedirPermissaoNotificacao,
  } = useAlertasCambio();

  const [moeda, setMoeda] = useState<CurrencyCode>('USD');
  const [alvo, setAlvo] = useState('');
  const [direcao, setDirecao] = useState<DirecaoAlerta>('abaixo');

  const valAlvo = parseNumeroLocal(alvo);
  const disparados = cotacoes ? verificarAlertas(alertas, cotacoes) : [];

  useEffect(() => {
    if (!carregando && cotacoes) sincronizarComCotacoes(cotacoes);
  }, [carregando, cotacoes, alertas.length, sincronizarComCotacoes]);

  const criar = () => {
    adicionarAlerta(moeda, valAlvo, direcao);
    setAlvo('');
    if (permissao === 'pendente') pedirPermissaoNotificacao();
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>🎯 Alertas de câmbio</Text>

      {disparados.map((alerta) => (
        <Text key={alerta.id} style={styles.disparado}>
          🎯 {alerta.moeda} {alerta.direcao === 'abaixo' ? 'caiu até' : 'subiu até'} seu alvo de{' '}
          {formatarCotacaoBR(alerta.alvo)}!
        </Text>
      ))}

      <View style={styles.formRow}>
        <View style={styles.moedasRow}>
          {MOEDAS.map((m) => (
            <TouchableOpacity
              key={m.code}
              style={[styles.moedaChip, moeda === m.code && styles.moedaChipAtiva]}
              onPress={() => setMoeda(m.code)}
              accessibilityRole="button"
              accessibilityLabel={`Alerta para ${m.nome}`}
              accessibilityState={{ selected: moeda === m.code }}>
              <FlagIcon code={m.bandeira} size={11} />
              <Text style={[styles.moedaChipTexto, moeda === m.code && styles.moedaChipTextoAtivo]}> {m.code}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formRow}>
        <TouchableOpacity
          style={[styles.direcaoBtn, direcao === 'abaixo' && styles.direcaoAtiva]}
          onPress={() => setDirecao('abaixo')}
          accessibilityRole="button"
          accessibilityLabel="Avisar quando cair até o alvo"
          accessibilityState={{ selected: direcao === 'abaixo' }}>
          <Text style={[styles.direcaoTexto, direcao === 'abaixo' && styles.direcaoTextoAtivo]}>↓ Cair até</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.direcaoBtn, direcao === 'acima' && styles.direcaoAtiva]}
          onPress={() => setDirecao('acima')}
          accessibilityRole="button"
          accessibilityLabel="Avisar quando subir até o alvo"
          accessibilityState={{ selected: direcao === 'acima' }}>
          <Text style={[styles.direcaoTexto, direcao === 'acima' && styles.direcaoTextoAtivo]}>↑ Subir até</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.inputAlvo}
          placeholder="5,00"
          placeholderTextColor={cores.muted}
          keyboardType="numeric"
          value={alvo}
          onChangeText={setAlvo}
          accessibilityLabel="Cotação alvo em reais"
        />
        <TouchableOpacity
          style={[styles.botaoAdd, valAlvo <= 0 && styles.botaoAddDesabilitado]}
          onPress={criar}
          disabled={valAlvo <= 0}
          accessibilityRole="button"
          accessibilityLabel="Criar alerta"
          accessibilityState={{ disabled: valAlvo <= 0 }}>
          <Text style={styles.botaoAddTexto}>+</Text>
        </TouchableOpacity>
      </View>

      {alertas.map((alerta) => (
        <View key={alerta.id} style={styles.alertaLinha}>
          <FlagIcon code={moedaPorCodigo(alerta.moeda).bandeira} size={12} />
          <Text style={styles.alertaTexto}>
            {' '}
            {alerta.moeda} {alerta.direcao === 'abaixo' ? '↓' : '↑'} {formatarCotacaoBR(alerta.alvo)}
          </Text>
          <TouchableOpacity
            onPress={() => removerAlerta(alerta.id)}
            accessibilityRole="button"
            accessibilityLabel="Remover alerta">
            <Text style={styles.alertaRemover}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      {alertas.length === 0 && <Text style={styles.vazio}>Nenhum alerta criado ainda.</Text>}
      <Text style={styles.explicacao}>{EXPLICACAO[permissao]}</Text>
    </View>
  );
}

function criarStyles(cores: Paleta) {
  return StyleSheet.create({
    card: { backgroundColor: cores.card, width: '100%', padding: 15, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: cores.text, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: cores.borderSoft, paddingBottom: 5 },
    disparado: { fontSize: 13, color: cores.success, backgroundColor: cores.successBg, padding: 10, borderRadius: 8, marginBottom: 8, fontWeight: '600' },
    formRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
    moedasRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    moedaChip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: cores.border, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: cores.optionBg },
    moedaChipAtiva: { backgroundColor: cores.primarySoft, borderColor: cores.primary },
    moedaChipTexto: { fontSize: 12, color: cores.subtext, fontWeight: '600' },
    moedaChipTextoAtivo: { color: cores.primary },
    direcaoBtn: { borderWidth: 1, borderColor: cores.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: cores.optionBg },
    direcaoAtiva: { backgroundColor: cores.primarySoft, borderColor: cores.primary },
    direcaoTexto: { fontSize: 12, color: cores.subtext, fontWeight: '600' },
    direcaoTextoAtivo: { color: cores.primary },
    inputAlvo: { flex: 1, minWidth: 70, borderWidth: 1, borderColor: cores.border, borderRadius: 8, padding: 8, fontSize: 14, backgroundColor: cores.inputBg, color: cores.text, height: 40 },
    botaoAdd: { backgroundColor: cores.primary, borderRadius: 8, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    botaoAddDesabilitado: { opacity: 0.4 },
    botaoAddTexto: { color: cores.card, fontSize: 20, fontWeight: 'bold' },
    alertaLinha: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: cores.borderSoft },
    alertaTexto: { flex: 1, fontSize: 13, color: cores.text },
    alertaRemover: { color: cores.danger, fontSize: 14, fontWeight: 'bold', paddingHorizontal: 6 },
    explicacao: { fontSize: 11, color: cores.muted, marginTop: 10, lineHeight: 16 },
    vazio: { fontSize: 12, color: cores.muted, fontStyle: 'italic' },
  });
}
