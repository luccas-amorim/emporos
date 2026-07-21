import React, { useMemo, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { Paleta } from '@/constants/theme';
import { useTema } from '@/hooks/use-tema';
import {
  compraDisponivel,
  comprarVersaoCompleta,
  PRECO_VERSAO_COMPLETA,
  restaurarCompras,
} from '@/services/compras';

// No react-native-web, Modal com animationType espera um evento de fim de animação
// que nem sempre dispara, deixando o modal preso na tela após visible=false.
const ANIMACAO_MODAL = Platform.OS === 'web' ? 'none' : 'fade';

const BENEFICIOS = [
  '🌍 Todas as moedas: Libra, Iene, Peso Argentino, Peso Chileno — e as próximas',
  '🎯 Alertas de câmbio (em breve): avisamos quando a cotação chegar no seu alvo',
  '🚀 Acesso antecipado às próximas funcionalidades premium',
  '💙 Compra única — sem assinatura, sem anúncios',
];

interface PaywallProps {
  visivel: boolean;
  aoFechar: () => void;
  aoComprado: () => void;
}

export function Paywall({ visivel, aoFechar, aoComprado }: PaywallProps) {
  const { cores } = useTema();
  const styles = useMemo(() => criarStyles(cores), [cores]);
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const disponivel = compraDisponivel();

  const comprar = async () => {
    setProcessando(true);
    setMensagem(null);
    const resultado = await comprarVersaoCompleta();
    setProcessando(false);
    if (resultado.sucesso) {
      aoComprado();
      aoFechar();
    } else {
      setMensagem(resultado.mensagem ?? 'Não foi possível concluir a compra.');
    }
  };

  const restaurar = async () => {
    setProcessando(true);
    setMensagem(null);
    const resultado = await restaurarCompras();
    setProcessando(false);
    if (resultado.sucesso) {
      aoComprado();
      aoFechar();
    } else {
      setMensagem(resultado.mensagem ?? 'Nenhuma compra encontrada.');
    }
  };

  return (
    <Modal visible={visivel} transparent animationType={ANIMACAO_MODAL} onRequestClose={aoFechar}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.titulo}>✈️ Vale importar? Premium</Text>
          <Text style={styles.subtitulo}>Desbloqueie tudo com uma compra única de {PRECO_VERSAO_COMPLETA}</Text>

          {BENEFICIOS.map((item) => (
            <Text key={item} style={styles.beneficio}>
              {item}
            </Text>
          ))}

          {mensagem && <Text style={styles.mensagem}>{mensagem}</Text>}

          <TouchableOpacity
            style={[styles.botaoComprar, (!disponivel || processando) && styles.botaoDesabilitado]}
            onPress={comprar}
            disabled={!disponivel || processando}
            accessibilityRole="button"
            accessibilityLabel={disponivel ? `Comprar versão completa por ${PRECO_VERSAO_COMPLETA}` : 'Compra disponível em breve'}
            accessibilityState={{ disabled: !disponivel || processando }}>
            <Text style={styles.botaoComprarTexto}>
              {processando ? 'Processando…' : disponivel ? `Desbloquear por ${PRECO_VERSAO_COMPLETA}` : 'Em breve na loja'}
            </Text>
          </TouchableOpacity>

          <View style={styles.rodape}>
            <TouchableOpacity onPress={restaurar} disabled={processando} accessibilityRole="button" accessibilityLabel="Restaurar compras">
              <Text style={styles.linkRodape}>Restaurar compras</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={aoFechar} accessibilityRole="button" accessibilityLabel="Fechar">
              <Text style={styles.linkRodape}>Agora não</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function criarStyles(cores: Paleta) {
  return StyleSheet.create({
    overlay: { flex: 1, backgroundColor: cores.overlay, justifyContent: 'center', padding: 24 },
    box: { backgroundColor: cores.card, borderRadius: 16, padding: 24 },
    titulo: { fontSize: 22, fontWeight: 'bold', color: cores.primary, textAlign: 'center' },
    subtitulo: { fontSize: 14, color: cores.subtext, textAlign: 'center', marginTop: 6, marginBottom: 18 },
    beneficio: { fontSize: 14, color: cores.text, marginBottom: 10, lineHeight: 20 },
    mensagem: { fontSize: 12, color: cores.warnText, backgroundColor: cores.warnBg, padding: 10, borderRadius: 8, marginTop: 6, textAlign: 'center' },
    botaoComprar: { backgroundColor: cores.primary, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 14 },
    botaoDesabilitado: { opacity: 0.5 },
    botaoComprarTexto: { color: cores.card, fontSize: 16, fontWeight: 'bold' },
    rodape: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
    linkRodape: { fontSize: 13, color: cores.muted, fontWeight: '600' },
  });
}
