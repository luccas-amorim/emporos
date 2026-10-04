import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { FlagIcon } from '@/components/flag-icon';
import { IconSymbol } from '@/components/ui/icon-symbol';
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
    'Verificamos a cotação em segundo plano de tempos em tempos. O celular decide o momento: pode levar algumas horas, e no iPhone costuma ser de madrugada. Com o app aberto, o aviso aparece aqui na hora.',
  negada:
    'Notificações desativadas: o aviso só aparece com o app aberto. Para receber notificações, ative-as nas configurações do celular.',
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
      <View style={styles.tituloLinha}>
        <IconSymbol name="scope" size={16} color={cores.text} />
        <Text style={styles.sectionTitle}>Alertas de câmbio</Text>
      </View>

      {disparados.map((alerta) => (
        <View key={alerta.id} style={styles.disparado}>
          <IconSymbol name="scope" size={14} color={cores.brasil} />
          <Text style={styles.disparadoTexto}>
            {alerta.moeda} {alerta.direcao === 'abaixo' ? 'caiu até' : 'subiu até'} seu alvo de{' '}
            {formatarCotacaoBR(alerta.alvo)}!
          </Text>
        </View>
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
          <IconSymbol name="arrow.down" size={13} color={direcao === 'abaixo' ? cores.text : cores.textMuted} />
          <Text style={[styles.direcaoTexto, direcao === 'abaixo' && styles.direcaoTextoAtivo]}>Cair até</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.direcaoBtn, direcao === 'acima' && styles.direcaoAtiva]}
          onPress={() => setDirecao('acima')}
          accessibilityRole="button"
          accessibilityLabel="Avisar quando subir até o alvo"
          accessibilityState={{ selected: direcao === 'acima' }}>
          <IconSymbol name="arrow.up" size={13} color={direcao === 'acima' ? cores.text : cores.textMuted} />
          <Text style={[styles.direcaoTexto, direcao === 'acima' && styles.direcaoTextoAtivo]}>Subir até</Text>
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
          <IconSymbol name="plus" size={20} color={cores.actionText} />
        </TouchableOpacity>
      </View>

      {alertas.map((alerta) => (
        <View key={alerta.id} style={styles.alertaLinha}>
          <FlagIcon code={moedaPorCodigo(alerta.moeda).bandeira} size={12} />
          <Text style={styles.alertaTexto}> {alerta.moeda}</Text>
          <IconSymbol name={alerta.direcao === 'abaixo' ? 'arrow.down' : 'arrow.up'} size={13} color={cores.textMuted} />
          <Text style={[styles.alertaTexto, { flex: 1 }]}> {formatarCotacaoBR(alerta.alvo)}</Text>
          <TouchableOpacity
            style={styles.alertaRemover}
            onPress={() => removerAlerta(alerta.id)}
            accessibilityRole="button"
            accessibilityLabel="Remover alerta">
            <IconSymbol name="xmark" size={16} color={cores.danger} />
          </TouchableOpacity>
        </View>
      ))}
      {alertas.length === 0 && <Text style={styles.vazio}>Nenhum alerta criado ainda.</Text>}
      <View style={styles.explicacaoLinha}>
        {permissao === 'concedida' || permissao === 'negada' ? (
          <IconSymbol name={permissao === 'concedida' ? 'bell' : 'bell.slash'} size={13} color={cores.textSubtle} />
        ) : null}
        <Text style={styles.explicacao}>{EXPLICACAO[permissao]}</Text>
      </View>
    </View>
  );
}

function criarStyles(cores: Paleta) {
  return StyleSheet.create({
    card: { backgroundColor: cores.card, width: '100%', padding: 14, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: cores.border },
    tituloLinha: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: cores.border, paddingBottom: 5 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: cores.text },
    disparado: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: cores.brasilSoft, padding: 10, borderRadius: 12, marginBottom: 8 },
    disparadoTexto: { flex: 1, fontSize: 13, color: cores.brasil, fontWeight: '600' },
    formRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
    moedasRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    moedaChip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: cores.border, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: cores.optionBg },
    moedaChipAtiva: { backgroundColor: cores.primarySoft, borderColor: cores.primary },
    moedaChipTexto: { fontSize: 12, color: cores.subtext, fontWeight: '600' },
    moedaChipTextoAtivo: { color: cores.primary },
    direcaoBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: cores.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: cores.optionBg },
    direcaoAtiva: { backgroundColor: cores.primarySoft, borderColor: cores.primary },
    direcaoTexto: { fontSize: 12, color: cores.subtext, fontWeight: '600' },
    direcaoTextoAtivo: { color: cores.primary },
    inputAlvo: { flex: 1, minWidth: 70, borderWidth: 1, borderColor: cores.border, borderRadius: 8, padding: 8, fontSize: 14, backgroundColor: cores.inputBg, color: cores.text, height: 40 },
    botaoAdd: { backgroundColor: cores.action, borderRadius: 10, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    botaoAddDesabilitado: { opacity: 0.4 },
    alertaLinha: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: cores.borderSoft },
    alertaTexto: { fontSize: 13, color: cores.text },
    alertaRemover: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    explicacaoLinha: { flexDirection: 'row', gap: 6, marginTop: 10 },
    explicacao: { flex: 1, fontSize: 11, color: cores.muted, lineHeight: 16 },
    vazio: { fontSize: 12, color: cores.muted, fontStyle: 'italic' },
  });
}
