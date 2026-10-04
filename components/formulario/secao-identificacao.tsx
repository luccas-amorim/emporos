import React from 'react';
import { Text, TextInput, View } from 'react-native';

import { useEstilosFormulario } from '@/components/formulario/estilos';
import type { CamposFormulario, DefinirCampo } from '@/hooks/use-formulario-calculo';
import { useTema } from '@/hooks/use-tema';

interface SecaoProps {
  campos: CamposFormulario;
  definir: DefinirCampo;
}

export function SecaoIdentificacao({ campos, definir }: SecaoProps) {
  const { cores } = useTema();
  const styles = useEstilosFormulario();

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>🏷️ Identificação (opcional)</Text>
      <Text style={styles.label}>Nome do produto</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: iPhone 17 Pro 256GB"
        placeholderTextColor={cores.muted}
        value={campos.nomeProduto}
        onChangeText={(texto) => definir('nomeProduto', texto)}
        accessibilityLabel="Nome do produto (opcional)"
      />
      <Text style={styles.label}>Link</Text>
      <TextInput
        style={styles.input}
        placeholder="https://..."
        placeholderTextColor={cores.muted}
        autoCapitalize="none"
        keyboardType="url"
        value={campos.link}
        onChangeText={(texto) => definir('link', texto)}
        accessibilityLabel="Link do produto (opcional)"
      />
      <Text style={styles.label}>Observação</Text>
      <TextInput
        style={[styles.input, styles.inputMultilinha]}
        placeholder="Ex: cor azul, cupom BLACK10, vendedor X"
        placeholderTextColor={cores.muted}
        value={campos.observacao}
        onChangeText={(texto) => definir('observacao', texto)}
        multiline
        maxLength={140}
        accessibilityLabel="Observação sobre a compra (opcional)"
      />
    </View>
  );
}
