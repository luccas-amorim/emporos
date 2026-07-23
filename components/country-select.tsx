import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { FlagIcon } from '@/components/flag-icon';
import { moedaPorCodigo, type CurrencyCode } from '@/constants/currencies';
import { filtrarPaises, paisesDisponiveis, type Pais } from '@/constants/paises';
import type { Paleta } from '@/constants/theme';
import { useTema } from '@/hooks/use-tema';

// No react-native-web, Modal com animationType nem sempre desmonta ao fechar.
const ANIMACAO_MODAL = Platform.OS === 'web' ? 'none' : 'slide';
const ALTURA_ITEM = 56;

interface CountrySelectProps {
  /** Nome do país (vindo da lista ou digitado pelo usuário). */
  value?: string;
  /** Recebe o nome e, quando o país é conhecido, a moeda a sugerir. */
  onChange: (nome: string, moedaSugerida?: CurrencyCode) => void;
  premiumDesbloqueado: boolean;
  aoPedirPremium?: () => void;
}

export function CountrySelect({ value, onChange, premiumDesbloqueado, aoPedirPremium }: CountrySelectProps) {
  const { cores } = useTema();
  const styles = useMemo(() => criarStyles(cores), [cores]);
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [digitando, setDigitando] = useState(false);
  const [outroPais, setOutroPais] = useState('');

  const disponiveis = useMemo(() => paisesDisponiveis(premiumDesbloqueado), [premiumDesbloqueado]);
  const listados = useMemo(() => filtrarPaises(disponiveis, busca), [disponiveis, busca]);
  // O país pode ter sido digitado à mão, então procuramos pelo nome, não por código.
  const conhecido = disponiveis.find((p) => p.nome === value);

  const fechar = () => {
    setAberto(false);
    setBusca('');
    setDigitando(false);
    setOutroPais('');
  };

  const escolher = (pais: Pais) => {
    onChange(pais.nome, pais.moeda);
    fechar();
  };

  const confirmarOutro = () => {
    const nome = outroPais.trim();
    if (!nome) return;
    onChange(nome); // sem sugestão de moeda: país fora do catálogo
    fechar();
  };

  return (
    <>
      <TouchableOpacity
        style={styles.campo}
        onPress={() => setAberto(true)}
        accessibilityRole="button"
        accessibilityLabel={value ? `País da compra: ${value}. Toque para trocar.` : 'Escolher o país da compra'}>
        {conhecido ? (
          <FlagIcon code={moedaPorCodigo(conhecido.moeda).bandeira} size={16} />
        ) : (
          <Text style={styles.globo}>🌐</Text>
        )}
        <Text style={[styles.textoCampo, !value && styles.placeholder]} numberOfLines={1}>
          {value || 'Selecione o país'}
        </Text>
        <Text style={styles.seta}>▾</Text>
      </TouchableOpacity>

      <Modal visible={aberto} transparent animationType={ANIMACAO_MODAL} onRequestClose={fechar}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>País da compra</Text>
              <TouchableOpacity onPress={fechar} accessibilityRole="button" accessibilityLabel="Fechar lista de países">
                <Text style={styles.fechar}>✕</Text>
              </TouchableOpacity>
            </View>

            {digitando ? (
              <View>
                <Text style={styles.label}>Digite o país</Text>
                <TextInput
                  style={styles.busca}
                  placeholder="Ex: Suíça, Canadá, Tailândia…"
                  placeholderTextColor={cores.muted}
                  value={outroPais}
                  onChangeText={setOutroPais}
                  autoFocus
                  maxLength={40}
                  onSubmitEditing={confirmarOutro}
                  accessibilityLabel="Nome do país"
                />
                <Text style={styles.dica}>
                  A moeda não é sugerida para países fora da lista — confira a seleção de moeda abaixo.
                </Text>
                <View style={styles.acoesOutro}>
                  <TouchableOpacity
                    onPress={() => setDigitando(false)}
                    accessibilityRole="button"
                    accessibilityLabel="Voltar para a lista">
                    <Text style={styles.voltar}>← Voltar à lista</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmar, !outroPais.trim() && styles.confirmarDesabilitado]}
                    onPress={confirmarOutro}
                    disabled={!outroPais.trim()}
                    accessibilityRole="button"
                    accessibilityLabel="Confirmar país digitado"
                    accessibilityState={{ disabled: !outroPais.trim() }}>
                    <Text style={styles.confirmarTexto}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <TextInput
                  style={styles.busca}
                  placeholder="Buscar país ou moeda…"
                  placeholderTextColor={cores.muted}
                  value={busca}
                  onChangeText={setBusca}
                  autoCorrect={false}
                  accessibilityLabel="Buscar país"
                />

                <FlatList
                  data={listados}
                  keyExtractor={(item) => item.codigo}
                  keyboardShouldPersistTaps="handled"
                  initialNumToRender={12}
                  windowSize={7}
                  getItemLayout={(_, index) => ({ length: ALTURA_ITEM, offset: ALTURA_ITEM * index, index })}
                  ListEmptyComponent={
                    <Text style={styles.vazio}>Nenhum país na lista. Use &ldquo;Outro país&rdquo; abaixo.</Text>
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.opcao, item.nome === value && styles.opcaoSelecionada]}
                      onPress={() => escolher(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.nome}, moeda ${item.moeda}`}
                      accessibilityState={{ selected: item.nome === value }}>
                      <FlagIcon code={moedaPorCodigo(item.moeda).bandeira} size={18} />
                      <Text style={styles.opcaoNome}>{item.nome}</Text>
                      <Text style={styles.opcaoMoeda}>{item.moeda}</Text>
                    </TouchableOpacity>
                  )}
                />

                <TouchableOpacity
                  style={styles.outroBotao}
                  onPress={() => setDigitando(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Informar outro país">
                  <Text style={styles.outroBotaoTexto}>✏️ Outro país…</Text>
                </TouchableOpacity>

                {!premiumDesbloqueado && (
                  <TouchableOpacity
                    onPress={() => {
                      fechar();
                      aoPedirPremium?.();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Conhecer a versão completa">
                    <Text style={styles.avisoPremium}>
                      🔒 A lista rápida traz os destinos mais buscados.{'\n'}
                      <Text style={styles.avisoPremiumLink}>Ver a lista completa →</Text>
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

function criarStyles(cores: Paleta) {
  return StyleSheet.create({
    campo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: cores.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      height: 50,
      backgroundColor: cores.inputBg,
    },
    globo: { fontSize: 14 },
    textoCampo: { flex: 1, fontSize: 14, color: cores.text, fontWeight: '600' },
    placeholder: { color: cores.muted, fontWeight: '400' },
    seta: { color: cores.muted, fontSize: 12 },
    overlay: { flex: 1, backgroundColor: cores.overlay, justifyContent: 'flex-end' },
    modalBox: {
      backgroundColor: cores.card,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 16,
      maxHeight: '80%',
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    modalTitulo: { fontSize: 16, fontWeight: 'bold', color: cores.text },
    fechar: { fontSize: 18, color: cores.muted, paddingHorizontal: 8 },
    label: { fontSize: 13, color: cores.subtext, fontWeight: '600', marginBottom: 6 },
    busca: {
      borderWidth: 1,
      borderColor: cores.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      height: 44,
      fontSize: 15,
      color: cores.text,
      backgroundColor: cores.inputBg,
      marginBottom: 8,
    },
    dica: { fontSize: 12, color: cores.muted, fontStyle: 'italic', marginBottom: 12 },
    acoesOutro: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    voltar: { fontSize: 13, color: cores.subtext, fontWeight: '600' },
    confirmar: { backgroundColor: cores.primary, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 },
    confirmarDesabilitado: { opacity: 0.4 },
    confirmarTexto: { color: cores.card, fontWeight: 'bold', fontSize: 14 },
    opcao: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      height: ALTURA_ITEM,
      paddingHorizontal: 10,
      borderRadius: 8,
    },
    opcaoSelecionada: { backgroundColor: cores.primarySoft },
    opcaoNome: { flex: 1, fontSize: 15, color: cores.text },
    opcaoMoeda: { fontSize: 13, color: cores.muted, fontWeight: '600' },
    vazio: { fontSize: 14, color: cores.muted, textAlign: 'center', paddingVertical: 24 },
    outroBotao: {
      borderWidth: 1,
      borderColor: cores.border,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 8,
    },
    outroBotaoTexto: { fontSize: 14, color: cores.primary, fontWeight: '600' },
    avisoPremium: {
      fontSize: 12,
      color: cores.warnText,
      backgroundColor: cores.warnBg,
      padding: 10,
      borderRadius: 8,
      marginTop: 8,
      textAlign: 'center',
    },
    avisoPremiumLink: { fontWeight: 'bold', color: cores.primary },
  });
}
