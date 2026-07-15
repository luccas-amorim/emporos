import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { CurrencySelect } from '@/components/currency-select';
import { FlagIcon } from '@/components/flag-icon';
import { moedaPorCodigo, type CurrencyCode } from '@/constants/currencies';
import {
  calcularParidade,
  type CalculoResultado,
  type FormaPagamento,
  getIOFPorAno,
  parseNumeroLocal,
} from '@/core/calculadora';
import { useHistoricoSimulacoes } from '@/hooks/use-historico-simulacoes';
import { buscarCotacoes } from '@/services/cambio';
import { buscarSelic } from '@/services/selic';

const IOF_CARTAO_ATUAL = getIOFPorAno();
const IOF_DINHEIRO = 0.011;
const CODIGOS_MOEDA: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'JPY', 'ARS', 'CLP'];

function formatarCotacao(valor: number): string {
  return valor < 1 ? valor.toFixed(4) : valor.toFixed(2);
}

export default function App() {
  const [cotacoes, setCotacoes] = useState<Record<CurrencyCode, number> | null>(null);
  const [cotacaoFallback, setCotacaoFallback] = useState(false);
  const [selicAnual, setSelicAnual] = useState(0);
  const [selicMensal, setSelicMensal] = useState(0.0089);
  const [loading, setLoading] = useState(true);

  const [spread, setSpread] = useState('2.0'); // Padrão 2% (Média Wise/Nomad/C6)

  const [precoBR, setPrecoBR] = useState('');
  const [parcelasBR, setParcelasBR] = useState('1');
  const [precoExt, setPrecoExt] = useState('');
  const [moeda, setMoeda] = useState<CurrencyCode>('USD');
  const [pgto, setPgto] = useState<FormaPagamento>('Cartao');

  const [nomeProduto, setNomeProduto] = useState('');
  const [link, setLink] = useState('');

  const [resultado, setResultado] = useState<CalculoResultado | null>(null);

  const { adicionarSimulacao } = useHistoricoSimulacoes();

  useEffect(() => {
    async function buscarDados() {
      const [dadosCambio, selic] = await Promise.all([buscarCotacoes(CODIGOS_MOEDA), buscarSelic()]);
      setCotacoes(dadosCambio.valores);
      setCotacaoFallback(dadosCambio.usouFallback);
      setSelicAnual(selic.selicAnual);
      setSelicMensal(selic.selicMensal);
      setLoading(false);
    }
    buscarDados();
  }, []);

  const calcular = () => {
    if (!cotacoes) return;

    const valPrecoBR = parseNumeroLocal(precoBR);
    const valParcelasBR = parseInt(parcelasBR, 10) || 1;
    const valPrecoExt = parseNumeroLocal(precoExt);
    const valSpread = parseNumeroLocal(spread);

    const novoResultado = calcularParidade({
      precoBR: valPrecoBR,
      parcelasBR: valParcelasBR,
      precoExt: valPrecoExt,
      cotacao: cotacoes[moeda],
      spread: valSpread,
      pgto,
      selicMensal,
      iofCartao: IOF_CARTAO_ATUAL,
      iofDinheiro: IOF_DINHEIRO,
    });

    setResultado(novoResultado);
    adicionarSimulacao({
      nomeProduto: nomeProduto.trim() || undefined,
      link: link.trim() || undefined,
      precoBR: valPrecoBR,
      parcelasBR: valParcelasBR,
      precoExt: valPrecoExt,
      moeda,
      pgto,
      spread: valSpread,
      valeImportar: novoResultado.valeImportar,
      custoBR: novoResultado.custoBR,
      custoExt: novoResultado.custoExt,
      economia: novoResultado.economia,
    });
  };

  const moedaSelecionada = moedaPorCodigo(moeda);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>✈️ Vale importar?</Text>

        {loading || !cotacoes ? (
          <ActivityIndicator size="large" color="#1a73e8" style={{ marginBottom: 20 }} />
        ) : (
          <>
            <View style={styles.statusBox}>
              <View style={styles.statusRow}>
                <View style={styles.statusLabelRow}>
                  <FlagIcon code={moedaSelecionada.bandeira} size={12} />
                  <Text style={styles.statusLabel}> {moeda}</Text>
                </View>
                <Text style={styles.statusValue}>R$ {formatarCotacao(cotacoes[moeda])}</Text>
              </View>
              <View style={[styles.statusRow, { borderRightWidth: 0 }]}>
                <Text style={styles.statusLabel}>📈 SELIC</Text>
                <Text style={styles.statusValue}>{selicAnual}% a.a.</Text>
              </View>
            </View>
            {cotacaoFallback && (
              <Text style={styles.avisoFallback}>
                ⚠️ Não foi possível obter a cotação em tempo real agora. Exibindo valor de referência —
                confira antes de decidir.
              </Text>
            )}
          </>
        )}

        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <FlagIcon code="BR" size={14} />
            <Text style={styles.sectionTitle}> Opção Brasil</Text>
          </View>
          <Text style={styles.label}>Preço (R$)</Text>
          <TextInput
            style={styles.input}
            placeholder="1500.00"
            keyboardType="numeric"
            value={precoBR}
            onChangeText={setPrecoBR}
          />
          <Text style={styles.label}>Parcelas</Text>
          <TextInput
            style={styles.input}
            placeholder="12"
            keyboardType="numeric"
            value={parcelasBR}
            onChangeText={setParcelasBR}
          />
          <Text style={styles.obs}>Custo oportunidade: {(selicMensal * 100).toFixed(2)}% a.m.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🌎 Opção Exterior</Text>
          <Text style={styles.label}>Preço no Exterior</Text>
          <TextInput
            style={styles.input}
            placeholder="250.00"
            keyboardType="numeric"
            value={precoExt}
            onChangeText={setPrecoExt}
          />

          <View style={styles.row}>
            <View style={{ flex: 1.4 }}>
              <Text style={styles.label}>Moeda</Text>
              <CurrencySelect value={moeda} onChange={setMoeda} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Spread/Taxa (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="2.0"
                keyboardType="numeric"
                value={spread}
                onChangeText={setSpread}
              />
            </View>
          </View>

          <Text style={styles.label}>Pagamento (Selecione)</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.optionBtn, pgto === 'Cartao' && styles.selectedOption]}
              onPress={() => setPgto('Cartao')}>
              <Text style={[styles.optionTextBig, pgto === 'Cartao' && styles.selectedText]}>Cartão</Text>
              <Text style={[styles.optionTextSmall, pgto === 'Cartao' && styles.selectedText]}>
                IOF é {(IOF_CARTAO_ATUAL * 100).toFixed(2)}%
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionBtn, pgto === 'Dinheiro' && styles.selectedOption]}
              onPress={() => setPgto('Dinheiro')}>
              <Text style={[styles.optionTextBig, pgto === 'Dinheiro' && styles.selectedText]}>
                Dinheiro
              </Text>
              <Text style={[styles.optionTextSmall, pgto === 'Dinheiro' && styles.selectedText]}>
                IOF é {(IOF_DINHEIRO * 100).toFixed(1)}%
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🏷️ Identificação (opcional)</Text>
          <Text style={styles.label}>Nome do produto</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: iPhone 17 Pro 256GB"
            value={nomeProduto}
            onChangeText={setNomeProduto}
          />
          <Text style={styles.label}>Link</Text>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            autoCapitalize="none"
            keyboardType="url"
            value={link}
            onChangeText={setLink}
          />
        </View>

        <TouchableOpacity style={styles.calcButton} onPress={calcular}>
          <Text style={styles.calcButtonText}>CALCULAR</Text>
        </TouchableOpacity>

        {resultado && (
          <View style={[styles.resultBox, resultado.valeImportar ? styles.resExt : styles.resBr]}>
            <View style={styles.resTituloRow}>
              {!resultado.valeImportar && <FlagIcon code="BR" size={16} style={{ marginRight: 6 }} />}
              <Text style={[styles.resTitle, resultado.valeImportar ? { color: '#1967d2' } : { color: '#137333' }]}>
                {resultado.msg}
              </Text>
            </View>
            <Text style={styles.resSmall}>
              {resultado.valeImportar
                ? `Economia real de R$ ${resultado.economia.toFixed(2)}`
                : 'A longo prazo, parcelar no BR vale mais.'}
            </Text>
            <View style={styles.divider} />
            <Text style={styles.resLine}>Custo Brasil (equivalente à vista): R$ {resultado.custoBR.toFixed(2)}</Text>
            <Text style={styles.resLine}>Custo Exterior: R$ {resultado.custoExt.toFixed(2)}</Text>
            {parseInt(parcelasBR, 10) > 1 && (
              <Text style={styles.resObs}>
                &ldquo;Equivalente à vista&rdquo; é quanto as parcelas do Brasil valem hoje,
                descontadas pelo rendimento que esse dinheiro renderia investido na Selic.
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, backgroundColor: '#f0f2f5', flexGrow: 1, alignItems: 'center' },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#1a73e8', marginBottom: 15 },
  statusBox: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#ddd', overflow: 'hidden', width: '100%' },
  statusRow: { flex: 1, alignItems: 'center', padding: 10, borderRightWidth: 1, borderRightColor: '#eee' },
  statusLabelRow: { flexDirection: 'row', alignItems: 'center' },
  statusLabel: { fontSize: 10, color: '#666', fontWeight: 'bold', textTransform: 'uppercase' },
  statusValue: { fontSize: 13, color: '#333', fontWeight: 'bold', marginTop: 2 },
  avisoFallback: { fontSize: 11, color: '#a35a00', backgroundColor: '#fff4e0', padding: 8, borderRadius: 8, marginBottom: 12, width: '100%', textAlign: 'center' },
  card: { backgroundColor: '#fff', width: '100%', padding: 15, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
  label: { fontSize: 14, color: '#666', marginTop: 10, marginBottom: 5, fontWeight: '600' },
  obs: { fontSize: 11, color: '#999', marginTop: 5, fontStyle: 'italic', textAlign: 'right' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 16, backgroundColor: '#fff', height: 50 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },

  optionBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9', minHeight: 60 },
  selectedOption: { backgroundColor: '#e8f0fe', borderColor: '#1a73e8' },
  optionTextBig: { color: '#555', fontSize: 14, fontWeight: 'bold' },
  optionTextSmall: { color: '#777', fontSize: 11, marginTop: 2 },
  selectedText: { color: '#1a73e8', fontWeight: 'bold' },

  calcButton: { backgroundColor: '#1a73e8', width: '100%', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 20, shadowColor: '#1a73e8', shadowOpacity: 0.3, shadowRadius: 5, elevation: 4 },
  calcButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  resultBox: { width: '100%', padding: 20, borderRadius: 12, marginBottom: 30, borderWidth: 1 },
  resBr: { backgroundColor: '#e6f4ea', borderColor: '#34a853' },
  resExt: { backgroundColor: '#e8f0fe', borderColor: '#4285f4' },
  resTituloRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  resTitle: { fontSize: 18, fontWeight: 'bold' },
  resSmall: { fontSize: 14, color: '#555', marginBottom: 10 },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.1)', marginVertical: 10 },
  resLine: { fontSize: 16, color: '#333' },
  resObs: { fontSize: 11, color: '#777', fontStyle: 'italic', marginTop: 8 },
});
