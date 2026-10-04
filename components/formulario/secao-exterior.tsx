import React from 'react';
import { Text, TextInput, View } from 'react-native';

import { BotaoOpcao } from '@/components/botao-opcao';
import { CurrencySelect } from '@/components/currency-select';
import { useEstilosFormulario } from '@/components/formulario/estilos';
import { moedaPorCodigo } from '@/constants/currencies';
import { REGRAS_FISCAIS } from '@/constants/regras-fiscais';
import { rotuloAliquota } from '@/core/calculadora';
import type { CamposFormulario, DefinirCampo } from '@/hooks/use-formulario-calculo';
import { useTema } from '@/hooks/use-tema';

interface SecaoProps {
  campos: CamposFormulario;
  definir: DefinirCampo;
}

export function SecaoExterior({ campos, definir }: SecaoProps) {
  const { cores } = useTema();
  const styles = useEstilosFormulario();
  const moeda = moedaPorCodigo(campos.moeda);
  const encomenda = campos.cenario === 'Encomenda';
  const { iof, remessaConforme, icms } = REGRAS_FISCAIS;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>🌎 Opção Exterior</Text>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Preço ({campos.moeda})</Text>
          <TextInput
            style={styles.input}
            placeholder="250.00"
            placeholderTextColor={cores.muted}
            keyboardType="numeric"
            value={campos.precoExt}
            onChangeText={(texto) => definir('precoExt', texto)}
            accessibilityLabel={`Preço no exterior em ${moeda.nome}`}
          />
        </View>
        {encomenda && (
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Frete ({campos.moeda})</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={cores.muted}
              keyboardType="numeric"
              value={campos.freteExt}
              onChangeText={(texto) => definir('freteExt', texto)}
              accessibilityLabel={`Frete internacional em ${moeda.nome}`}
            />
          </View>
        )}
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1.4 }}>
          <Text style={styles.label}>Moeda</Text>
          <CurrencySelect value={campos.moeda} onChange={(codigo) => definir('moeda', codigo)} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Spread/Taxa (%)</Text>
          <TextInput
            style={styles.input}
            placeholder="2.0"
            placeholderTextColor={cores.muted}
            keyboardType="numeric"
            value={campos.spread}
            onChangeText={(texto) => definir('spread', texto)}
            accessibilityLabel="Spread bancário em porcentagem"
          />
        </View>
      </View>

      {encomenda && (
        <>
          <Text style={styles.label}>O site está no Remessa Conforme?</Text>
          <View style={styles.row}>
            <BotaoOpcao
              titulo="Sim"
              detalhe={`II ${rotuloAliquota(remessaConforme.aliquotaFaixaBaixa)} até US$ ${remessaConforme.limiteFaixaBaixaUSD}`}
              selecionado={campos.siteCertificado}
              onPress={() => definir('siteCertificado', true)}
              accessibilityLabel="Site certificado no Remessa Conforme"
            />
            <BotaoOpcao
              titulo="Não"
              detalhe={`II de ${rotuloAliquota(REGRAS_FISCAIS.aliquotaForaRemessaConforme)}`}
              selecionado={!campos.siteCertificado}
              onPress={() => definir('siteCertificado', false)}
              accessibilityLabel="Site fora do Remessa Conforme"
            />
          </View>

          <Text style={styles.label}>ICMS do seu estado</Text>
          <View style={styles.row}>
            {icms.opcoes.map((opcao) => (
              <BotaoOpcao
                key={opcao}
                titulo={rotuloAliquota(opcao)}
                selecionado={campos.icms === opcao}
                onPress={() => definir('icms', opcao)}
                accessibilityLabel={`ICMS de ${rotuloAliquota(opcao)}`}
              />
            ))}
          </View>
          <Text style={styles.obs}>
            Varia por estado (a maioria cobra {rotuloAliquota(icms.padrao)}). Confira o seu na tabela do Comsefaz,
            nas fontes do resultado.
          </Text>
        </>
      )}

      {!encomenda && (
        <>
          <Text style={styles.label}>Tax free / VAT a recuperar (%)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 12"
            placeholderTextColor={cores.muted}
            keyboardType="numeric"
            value={campos.taxFree}
            onChangeText={(texto) => definir('taxFree', texto)}
            accessibilityLabel="Percentual de tax free que você espera recuperar"
          />
          <Text style={styles.obs}>
            Informe quanto você vai receber de volta, não a alíquota cheia do país: depois das taxas da operadora, o
            reembolso costuma ficar bem abaixo dela. Confirme na loja.
          </Text>
        </>
      )}

      <Text style={styles.label}>Pagamento</Text>
      <View style={styles.row}>
        <BotaoOpcao
          titulo="Cartão"
          detalhe={`IOF de ${rotuloAliquota(iof.cartao)}`}
          selecionado={campos.pgto === 'Cartao'}
          onPress={() => definir('pgto', 'Cartao')}
          accessibilityLabel="Pagamento com cartão"
        />
        <BotaoOpcao
          titulo="Dinheiro"
          detalhe={`IOF de ${rotuloAliquota(iof.especie)}`}
          selecionado={campos.pgto === 'Dinheiro'}
          onPress={() => definir('pgto', 'Dinheiro')}
          accessibilityLabel="Pagamento em dinheiro"
        />
      </View>
    </View>
  );
}
