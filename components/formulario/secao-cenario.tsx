import React from 'react';
import { Text, View } from 'react-native';

import { BotaoOpcao } from '@/components/botao-opcao';
import { useEstilosFormulario } from '@/components/formulario/estilos';
import { REGRAS_FISCAIS } from '@/constants/regras-fiscais';
import { rotuloAliquota } from '@/core/calculadora';
import { formatarNumeroBR } from '@/core/formato';
import type { CamposFormulario, DefinirCampo } from '@/hooks/use-formulario-calculo';

interface SecaoProps {
  campos: CamposFormulario;
  definir: DefinirCampo;
}

export function SecaoCenario({ campos, definir }: SecaoProps) {
  const styles = useEstilosFormulario();
  const { bagagem } = REGRAS_FISCAIS;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>📦 Como você compraria lá fora?</Text>
      <View style={styles.row}>
        <BotaoOpcao
          titulo="Encomenda"
          detalhe="Site entrega no Brasil (paga II + ICMS)"
          selecionado={campos.cenario === 'Encomenda'}
          onPress={() => definir('cenario', 'Encomenda')}
          accessibilityLabel="Cenário encomenda internacional"
        />
        <BotaoOpcao
          titulo="Viagem"
          detalhe="Você traz na bagagem"
          selecionado={campos.cenario === 'Viagem'}
          onPress={() => definir('cenario', 'Viagem')}
          accessibilityLabel="Cenário compra em viagem"
        />
      </View>
      {campos.cenario === 'Viagem' && (
        <Text style={styles.obs}>
          Compras acima da cota de isenção (US$ {formatarNumeroBR(bagagem.cotaUSD, 0)} em voos) pagam{' '}
          {rotuloAliquota(bagagem.aliquotaExcedente)} sobre o excedente — não incluído no cálculo.
        </Text>
      )}
    </View>
  );
}
