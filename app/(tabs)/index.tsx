import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AlertasCambio } from '@/components/alertas-cambio';
import { SecaoBrasil } from '@/components/formulario/secao-brasil';
import { SecaoCenario } from '@/components/formulario/secao-cenario';
import { SecaoExterior } from '@/components/formulario/secao-exterior';
import { SecaoIdentificacao } from '@/components/formulario/secao-identificacao';
import { ResultadoCalculo } from '@/components/resultado-calculo';
import { StatusMercado } from '@/components/status-mercado';
import { CODIGOS_MOEDA } from '@/constants/currencies';
import { ALERTAS_CAMBIO_ATIVO } from '@/constants/feature-flags';
import type { Paleta } from '@/constants/theme';
import { calcularParidade, type CalculoResultado } from '@/core/calculadora';
import { textoCompartilhamento } from '@/core/compartilhamento';
import { montarSimulacao, useFormularioCalculo, valoresNumericos } from '@/hooks/use-formulario-calculo';
import { useHistoricoSimulacoes } from '@/hooks/use-historico-simulacoes';
import { useTema } from '@/hooks/use-tema';
import { carregarDadosMercado, type DadosMercado } from '@/services/mercado';

const ROTULO_TEMA: Record<string, string> = { auto: '◐ Auto', claro: '☀️ Claro', escuro: '🌙 Escuro' };
const PROXIMO_TEMA: Record<string, 'auto' | 'claro' | 'escuro'> = {
  auto: 'claro',
  claro: 'escuro',
  escuro: 'auto',
};

export default function Home() {
  const { cores, preferencia, definirPreferencia } = useTema();
  const styles = useMemo(() => criarStyles(cores), [cores]);
  const params = useLocalSearchParams<Record<string, string>>();
  const { campos, definir, aplicarPrefill } = useFormularioCalculo();
  const { adicionarSimulacao } = useHistoricoSimulacoes();

  const [dados, setDados] = useState<DadosMercado | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [resultado, setResultado] = useState<CalculoResultado | null>(null);

  const buscarDados = useCallback(async () => {
    setDados(await carregarDadosMercado(CODIGOS_MOEDA));
  }, []);

  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  // "Recalcular hoje", vindo do Histórico.
  useEffect(() => {
    if (!params.prefill) return;
    aplicarPrefill(params);
    setResultado(null);
  }, [params.prefill]); // eslint-disable-line react-hooks/exhaustive-deps

  const aoAtualizar = useCallback(async () => {
    setAtualizando(true);
    await buscarDados();
    setAtualizando(false);
  }, [buscarDados]);

  const simulacao = montarSimulacao(campos, dados);

  const calcular = () => {
    if (!simulacao) return;
    const novo = calcularParidade(simulacao.entrada);
    setResultado(novo);
    adicionarSimulacao({
      ...simulacao.registro,
      valeImportar: novo.valeImportar,
      custoBR: novo.custoBR,
      custoExt: novo.custoExt,
      economia: novo.economia,
    });
  };

  const compartilhar = async () => {
    if (!resultado) return;
    try {
      await Share.share({ message: textoCompartilhamento({ ...resultado, nomeProduto: campos.nomeProduto }) });
    } catch {
      // usuário cancelou o share — nada a fazer
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={cores.primary} />}>
        <View style={styles.cabecalho}>
          <Text style={styles.titulo}>✈️ Vale importar?</Text>
          <TouchableOpacity
            style={styles.temaChip}
            onPress={() => definirPreferencia(PROXIMO_TEMA[preferencia])}
            accessibilityRole="button"
            accessibilityLabel={`Tema atual: ${preferencia}. Toque para alternar.`}>
            <Text style={styles.temaChipTexto}>{ROTULO_TEMA[preferencia]}</Text>
          </TouchableOpacity>
        </View>

        {dados ? (
          <StatusMercado dados={dados} moeda={campos.moeda} />
        ) : (
          <ActivityIndicator size="large" color={cores.primary} style={{ marginBottom: 20 }} />
        )}

        <SecaoCenario campos={campos} definir={definir} />
        <SecaoBrasil campos={campos} definir={definir} selicMensal={dados?.selicMensal} />
        <SecaoExterior campos={campos} definir={definir} />
        <SecaoIdentificacao campos={campos} definir={definir} />

        <TouchableOpacity
          style={[styles.botaoCalcular, !simulacao && styles.botaoCalcularDesabilitado]}
          onPress={calcular}
          disabled={!simulacao}
          accessibilityRole="button"
          accessibilityLabel="Calcular comparação"
          accessibilityState={{ disabled: !simulacao }}>
          <Text style={styles.botaoCalcularTexto}>CALCULAR</Text>
        </TouchableOpacity>
        {!simulacao && dados && (
          <Text style={styles.dicaValidacao}>Preencha o preço no Brasil e no exterior para comparar.</Text>
        )}

        {resultado && (
          <ResultadoCalculo
            resultado={resultado}
            parcelas={valoresNumericos(campos).parcelas}
            aoCompartilhar={compartilhar}
          />
        )}

        {ALERTAS_CAMBIO_ATIVO && <AlertasCambio cotacoes={dados?.cotacoes ?? null} />}

        <Text style={styles.aviso}>
          O Vale importar? é uma ferramenta de estimativa e não constitui recomendação financeira. Impostos, câmbio e
          taxas são aproximações baseadas em fontes oficiais — confirme as condições reais antes de qualquer compra.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function criarStyles(cores: Paleta) {
  return StyleSheet.create({
    container: { padding: 20, paddingTop: 60, backgroundColor: cores.background, flexGrow: 1, alignItems: 'center' },
    cabecalho: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
    titulo: { fontSize: 26, fontWeight: 'bold', color: cores.primary },
    temaChip: { borderWidth: 1, borderColor: cores.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: cores.card },
    temaChipTexto: { fontSize: 12, color: cores.subtext, fontWeight: '600' },
    botaoCalcular: { backgroundColor: cores.primary, width: '100%', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 8, shadowColor: cores.primary, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4 },
    botaoCalcularDesabilitado: { opacity: 0.4 },
    botaoCalcularTexto: { color: cores.card, fontSize: 18, fontWeight: 'bold' },
    dicaValidacao: { fontSize: 12, color: cores.muted, marginBottom: 12, textAlign: 'center' },
    aviso: { fontSize: 10, color: cores.muted, textAlign: 'center', marginTop: 6, marginBottom: 30, lineHeight: 15 },
  });
}
