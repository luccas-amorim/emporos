import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { FlagIcon } from '@/components/flag-icon';
import { MOEDAS, moedaPorCodigo, type CurrencyCode } from '@/constants/currencies';
import type { Paleta } from '@/constants/theme';
import { useTema } from '@/hooks/use-tema';

// No react-native-web, Modal com animationType espera um evento de fim de animação
// que nem sempre dispara, deixando o modal preso na tela após visible=false.
const ANIMACAO_MODAL = Platform.OS === 'web' ? 'none' : 'fade';

interface CurrencySelectProps {
  value: CurrencyCode;
  onChange: (codigo: CurrencyCode) => void;
  premiumDesbloqueado: boolean;
  aoPedirPremium?: () => void;
}

export function CurrencySelect({ value, onChange, premiumDesbloqueado, aoPedirPremium }: CurrencySelectProps) {
  const { cores } = useTema();
  const styles = useMemo(() => criarStyles(cores), [cores]);
  const [aberto, setAberto] = useState(false);
  const [avisoPremium, setAvisoPremium] = useState(false);
  const selecionada = moedaPorCodigo(value);

  const fechar = () => {
    setAberto(false);
    setAvisoPremium(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.campo}
        onPress={() => setAberto(true)}
        accessibilityRole="button"
        accessibilityLabel={`Moeda selecionada: ${selecionada.nome}. Toque para trocar.`}>
        <FlagIcon code={selecionada.bandeira} size={16} />
        <Text style={styles.textoCampo} numberOfLines={1}>
          {selecionada.nome} ({selecionada.code})
        </Text>
        <Text style={styles.seta}>▾</Text>
      </TouchableOpacity>

      <Modal visible={aberto} transparent animationType={ANIMACAO_MODAL} onRequestClose={fechar}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={fechar}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitulo}>Escolha a moeda</Text>
            <FlatList
              data={MOEDAS}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => {
                const bloqueada = item.premium && !premiumDesbloqueado;
                return (
                  <TouchableOpacity
                    style={[
                      styles.opcao,
                      item.code === value && styles.opcaoSelecionada,
                      bloqueada && styles.opcaoBloqueada,
                    ]}
                    onPress={() => {
                      if (bloqueada) {
                        // Não muda a seleção nem fecha o modal: a jornada segue intacta.
                        setAvisoPremium(true);
                        return;
                      }
                      onChange(item.code);
                      fechar();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={
                      bloqueada ? `${item.nome}, disponível na versão completa` : `${item.nome}, ${item.code}`
                    }
                    accessibilityState={{ selected: item.code === value, disabled: bloqueada }}>
                    <FlagIcon code={item.bandeira} size={18} />
                    <Text style={styles.opcaoNome}>{item.nome}</Text>
                    <Text style={styles.opcaoSigla}>{bloqueada ? '🔒' : item.code}</Text>
                  </TouchableOpacity>
                );
              }}
            />
            {avisoPremium && (
              <TouchableOpacity
                onPress={() => {
                  fechar();
                  aoPedirPremium?.();
                }}
                accessibilityRole="button"
                accessibilityLabel="Conhecer a versão completa">
                <Text style={styles.avisoPremium}>
                  🔒 Moedas adicionais fazem parte da versão completa do Paridade.{'\n'}
                  <Text style={styles.avisoPremiumLink}>Toque para conhecer →</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
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
    textoCampo: { flex: 1, fontSize: 14, color: cores.text, fontWeight: '600' },
    seta: { color: cores.muted, fontSize: 12 },
    overlay: { flex: 1, backgroundColor: cores.overlay, justifyContent: 'center', padding: 30 },
    modalBox: { backgroundColor: cores.card, borderRadius: 12, maxHeight: '70%', padding: 10 },
    modalTitulo: { fontSize: 16, fontWeight: 'bold', color: cores.text, padding: 10 },
    opcao: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8 },
    opcaoSelecionada: { backgroundColor: cores.primarySoft },
    opcaoBloqueada: { opacity: 0.45 },
    opcaoNome: { flex: 1, fontSize: 15, color: cores.text },
    opcaoSigla: { fontSize: 13, color: cores.muted, fontWeight: '600' },
    avisoPremium: {
      fontSize: 12,
      color: cores.warnText,
      backgroundColor: cores.warnBg,
      padding: 10,
      borderRadius: 8,
      margin: 6,
      textAlign: 'center',
    },
    avisoPremiumLink: { fontWeight: 'bold', color: cores.primary },
  });
}
