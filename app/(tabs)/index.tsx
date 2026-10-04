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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { AlertasCambio } from '@/components/alertas-cambio';
import { CurrencySelect } from '@/components/currency-select';
import { FlagIcon } from '@/components/flag-icon';
import { moedaPorCodigo, parStatus, type CurrencyCode } from '@/constants/currencies';
import { ALERTAS_CAMBIO_ATIVO } from '@/constants/feature-flags';
import type { Paleta } from '@/constants/theme';
import {
  calcularParidade,
  type CalculoResultado,
  type Cenario,
  type FormaPagamento,
  getIOFPorAno,
  parseNumeroLocal,
} from '@/core/calculadora';
import { formatarBRL, formatarCotacaoBR, formatarPct } from '@/core/formato';
import { useHistoricoSimulacoes } from '@/hooks/use-historico-simulacoes';
import { useTema } from '@/hooks/use-tema';
import { CHAVES, lerComMigracao } from '@/services/armazenamento';
import { carregarDadosMercado, type DadosMercado, descreverIdade } from '@/services/mercado';

const IOF_CARTAO_ATUAL = getIOFPorAno();
const IOF_DINHEIRO = 0.011;
const CODIGOS_MOEDA: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'JPY', 'ARS', 'CLP'];

type ModoEntradaBR = 'total' | 'parcela';

const ROTULO_TEMA: Record<string, string> = { auto: '◐ Auto', claro: '☀️ Claro', escuro: '🌙 Escuro' };
const PROXIMO_TEMA: Record<string, 'auto' | 'claro' | 'escuro'> = {
  auto: 'claro',
  claro: 'escuro',
  escuro: 'auto',
};

export default function App() {
  const { cores, preferencia, definirPreferencia } = useTema();
  const styles = useMemo(() => criarStyles(cores), [cores]);
  const params = useLocalSearchParams<Record<string, string>>();

  const [dados, setDados] = useState<DadosMercado | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  const [cenario, setCenario] = useState<Cenario>('Encomenda');
  const [spread, setSpread] = useState('2.0'); // Padrão 2% (Média Wise/Nomad/C6)

  const [modoBR, setModoBR] = useState<ModoEntradaBR>('total');
  const [valorBR, setValorBR] = useState('');
  const [parcelasBR, setParcelasBR] = useState('1');
  const [precoExt, setPrecoExt] = useState('');
  const [freteExt, setFreteExt] = useState('');
  const [moeda, setMoeda] = useState<CurrencyCode>('USD');
  const [pgto, setPgto] = useState<FormaPagamento>('Cartao');

  const [taxFree, setTaxFree] = useState('');
  const [nomeProduto, setNomeProduto] = useState('');
  const [link, setLink] = useState('');
  const [observacao, setObservacao] = useState('');

  const [resultado, setResultado] = useState<CalculoResultado | null>(null);

  const { adicionarSimulacao } = useHistoricoSimulacoes();
  const moedaRestaurada = React.useRef(false);

  const buscarDados = useCallback(async () => {
    const carregados = await carregarDadosMercado(CODIGOS_MOEDA);
    setDados(carregados);
  }, []);

  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  // Restaura a última moeda escolhida e passa a persistir as trocas seguintes.
  useEffect(() => {
    lerComMigracao(CHAVES.moeda)
      .then((salva) => {
        if (salva && CODIGOS_MOEDA.includes(salva as CurrencyCode)) {
          setMoeda(salva as CurrencyCode);
        }
      })
      .catch(() => {})
      .finally(() => {
        moedaRestaurada.current = true;
      });
  }, []);

  useEffect(() => {
    if (!moedaRestaurada.current) return;
    AsyncStorage.setItem(CHAVES.moeda, moeda).catch(() => {});
  }, [moeda]);

  // Prefill vindo do Histórico ("Recalcular hoje"). Os campos opcionais são aplicados
  // mesmo vazios, para não herdar valores da simulação que estava na tela.
  useEffect(() => {
    if (!params.prefill) return;
    if (params.precoBR) setValorBR(params.precoBR);
    if (params.parcelasBR) setParcelasBR(params.parcelasBR);
    if (params.precoExt) setPrecoExt(params.precoExt);
    setFreteExt(params.freteExt ?? '');
    if (params.moeda) setMoeda(params.moeda as CurrencyCode);
    if (params.pgto) setPgto(params.pgto as FormaPagamento);
    if (params.spread) setSpread(params.spread);
    if (params.cenario) setCenario(params.cenario as Cenario);
    setTaxFree(params.taxFree ?? '');
    setNomeProduto(params.nomeProduto ?? '');
    setLink(params.link ?? '');
    setObservacao(params.observacao ?? '');
    setModoBR('total');
    setResultado(null);
  }, [params.prefill]); // eslint-disable-line react-hooks/exhaustive-deps

  const aoAtualizar = useCallback(async () => {
    setAtualizando(true);
    await buscarDados();
    setAtualizando(false);
  }, [buscarDados]);

  const valParcelasBR = parseInt(parcelasBR, 10) || 1;
  const valEntradaBR = parseNumeroLocal(valorBR);
  const valPrecoBRTotal = modoBR === 'parcela' ? valEntradaBR * valParcelasBR : valEntradaBR;
  const valPrecoExt = parseNumeroLocal(precoExt);
  const podeCalcular = !!dados && valPrecoBRTotal > 0 && valPrecoExt > 0;

  const calcular = () => {
    if (!dados || !podeCalcular) return;

    const valSpread = parseNumeroLocal(spread);
    const valFrete = cenario === 'Encomenda' ? parseNumeroLocal(freteExt) : 0;
    const valTaxFree = cenario === 'Viagem' ? parseNumeroLocal(taxFree) : 0;

    const novoResultado = calcularParidade({
      precoBR: valPrecoBRTotal,
      parcelasBR: valParcelasBR,
      precoExt: valPrecoExt,
      freteExt: valFrete,
      taxFreePct: valTaxFree,
      cenario,
      cotacao: dados.cotacoes[moeda],
      cotacaoUSD: dados.cotacoes.USD,
      spread: valSpread,
      pgto,
      selicMensal: dados.selicMensal,
      iofCartao: IOF_CARTAO_ATUAL,
      iofDinheiro: IOF_DINHEIRO,
    });

    setResultado(novoResultado);

    adicionarSimulacao({
      nomeProduto: nomeProduto.trim() || undefined,
      observacao: observacao.trim() || undefined,
      link: link.trim() || undefined,
      precoBR: valPrecoBRTotal,
      parcelasBR: valParcelasBR,
      precoExt: valPrecoExt,
      freteExt: valFrete,
      taxFreePct: valTaxFree,
      cenario,
      moeda,
      pgto,
      spread: valSpread,
      cotacao: dados.cotacoes[moeda],
      selicAnual: dados.selicAnual,
      valeImportar: novoResultado.valeImportar,
      custoBR: novoResultado.custoBR,
      custoExt: novoResultado.custoExt,
      economia: novoResultado.economia,
    });
  };

  const compartilhar = async () => {
    if (!resultado) return;
    const nome = nomeProduto.trim() || 'este produto';
    const veredito = resultado.valeImportar ? 'importar' : 'comprar no Brasil';
    try {
      await Share.share({
        message:
          `Simulei ${nome} no Vale importar?: vale mais a pena ${veredito}! ` +
          `Brasil: ${formatarBRL(resultado.custoBR)} × Exterior: ${formatarBRL(resultado.custoExt)} ` +
          `(diferença de ${formatarBRL(resultado.economia)}, ${formatarPct(resultado.economiaPct)}).`,
      });
    } catch {
      // usuário cancelou o share — nada a fazer
    }
  };

  const moedaSelecionada = moedaPorCodigo(moeda);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={cores.primary} />
        }>
        <View style={styles.headerRow}>
          <Text style={styles.titulo}>✈️ Vale importar?</Text>
          <TouchableOpacity
            style={styles.temaChip}
            onPress={() => definirPreferencia(PROXIMO_TEMA[preferencia])}
            accessibilityRole="button"
            accessibilityLabel={`Tema atual: ${preferencia}. Toque para alternar.`}>
            <Text style={styles.temaChipTexto}>{ROTULO_TEMA[preferencia]}</Text>
          </TouchableOpacity>
        </View>

        {!dados ? (
          <ActivityIndicator size="large" color={cores.primary} style={{ marginBottom: 20 }} />
        ) : (
          <>
            <View style={styles.statusBox}>
              {parStatus(moeda).map((codigo) => (
                <View key={codigo} style={styles.statusRow}>
                  <View style={styles.statusLabelRow}>
                    <FlagIcon code={moedaPorCodigo(codigo).bandeira} size={12} />
                    <Text style={styles.statusLabel}> {codigo}</Text>
                  </View>
                  <Text style={styles.statusValue}>{formatarCotacaoBR(dados.cotacoes[codigo])}</Text>
                </View>
              ))}
              <View style={[styles.statusRow, { borderRightWidth: 0 }]}>
                <Text style={styles.statusLabel}>📈 SELIC</Text>
                <Text style={styles.statusValue}>{formatarPct(dados.selicAnual, 2)} a.a.</Text>
              </View>
            </View>
            <Text style={styles.statusIdade}>
              {dados.origem === 'rede'
                ? `Cotação atualizada ${descreverIdade(dados.atualizadoEm)}`
                : dados.origem === 'cache'
                  ? `⚠️ Sem conexão — usando cotação salva ${descreverIdade(dados.atualizadoEm)}`
                  : '⚠️ Sem conexão — usando valores de referência. Puxe para atualizar.'}
            </Text>
          </>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📦 Como você compraria lá fora?</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.optionBtn, cenario === 'Encomenda' && styles.selectedOption]}
              onPress={() => setCenario('Encomenda')}
              accessibilityRole="button"
              accessibilityLabel="Cenário encomenda internacional"
              accessibilityState={{ selected: cenario === 'Encomenda' }}>
              <Text style={[styles.optionTextBig, cenario === 'Encomenda' && styles.selectedText]}>
                Encomenda
              </Text>
              <Text style={[styles.optionTextSmall, cenario === 'Encomenda' && styles.selectedText]}>
                Site entrega no Brasil (paga II + ICMS)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionBtn, cenario === 'Viagem' && styles.selectedOption]}
              onPress={() => setCenario('Viagem')}
              accessibilityRole="button"
              accessibilityLabel="Cenário compra em viagem"
              accessibilityState={{ selected: cenario === 'Viagem' }}>
              <Text style={[styles.optionTextBig, cenario === 'Viagem' && styles.selectedText]}>Viagem</Text>
              <Text style={[styles.optionTextSmall, cenario === 'Viagem' && styles.selectedText]}>
                Você traz na bagagem
              </Text>
            </TouchableOpacity>
          </View>
          {cenario === 'Viagem' && (
            <Text style={styles.obs}>
              Compras acima da cota de isenção (US$ 1.000 em voos) pagam 50% sobre o excedente — não
              incluído no cálculo.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <FlagIcon code="BR" size={14} />
            <Text style={styles.sectionTitleInline}> Opção Brasil</Text>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{modoBR === 'total' ? 'Preço total (R$)' : 'Valor da parcela (R$)'}</Text>
              <TextInput
                style={styles.input}
                placeholder={modoBR === 'total' ? '1.500,00' : '125,00'}
                placeholderTextColor={cores.muted}
                keyboardType="numeric"
                value={valorBR}
                onChangeText={setValorBR}
                accessibilityLabel={modoBR === 'total' ? 'Preço total no Brasil em reais' : 'Valor da parcela em reais'}
              />
            </View>
            <View style={{ width: 110 }}>
              <Text style={styles.label}>Parcelas</Text>
              <TextInput
                style={styles.input}
                placeholder="12"
                placeholderTextColor={cores.muted}
                keyboardType="numeric"
                value={parcelasBR}
                onChangeText={setParcelasBR}
                accessibilityLabel="Número de parcelas"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setModoBR(modoBR === 'total' ? 'parcela' : 'total')}
            accessibilityRole="button"
            accessibilityLabel="Alternar entre informar preço total ou valor da parcela">
            <Text style={styles.alternarModo}>
              {modoBR === 'total' ? 'Sei só o valor da parcela →' : '← Informar o preço total'}
            </Text>
          </TouchableOpacity>

          {modoBR === 'parcela' && valEntradaBR > 0 && valParcelasBR > 1 && (
            <Text style={styles.obs}>
              Total nominal: {formatarBRL(valPrecoBRTotal)} em {valParcelasBR}x
            </Text>
          )}
          {dados && (
            <Text style={styles.obs}>Custo de oportunidade: {formatarPct(dados.selicMensal * 100, 2)} a.m.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🌎 Opção Exterior</Text>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Preço ({moeda})</Text>
              <TextInput
                style={styles.input}
                placeholder="250.00"
                placeholderTextColor={cores.muted}
                keyboardType="numeric"
                value={precoExt}
                onChangeText={setPrecoExt}
                accessibilityLabel={`Preço no exterior em ${moedaSelecionada.nome}`}
              />
            </View>
            {cenario === 'Encomenda' && (
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Frete ({moeda})</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={cores.muted}
                  keyboardType="numeric"
                  value={freteExt}
                  onChangeText={setFreteExt}
                  accessibilityLabel={`Frete internacional em ${moedaSelecionada.nome}`}
                />
              </View>
            )}
          </View>

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
                placeholderTextColor={cores.muted}
                keyboardType="numeric"
                value={spread}
                onChangeText={setSpread}
                accessibilityLabel="Spread bancário em porcentagem"
              />
            </View>
          </View>

          {cenario === 'Viagem' && (
            <>
              <Text style={styles.label}>Tax free / VAT a recuperar (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 12"
                placeholderTextColor={cores.muted}
                keyboardType="numeric"
                value={taxFree}
                onChangeText={setTaxFree}
                accessibilityLabel="Percentual de tax free que você espera recuperar"
              />
              <Text style={styles.obs}>
                Informe quanto você vai receber de volta, não a alíquota cheia do país: depois das taxas da
                operadora, o reembolso costuma ficar bem abaixo dela. Confirme na loja.
              </Text>
            </>
          )}

          <Text style={styles.label}>Pagamento</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.optionBtn, pgto === 'Cartao' && styles.selectedOption]}
              onPress={() => setPgto('Cartao')}
              accessibilityRole="button"
              accessibilityLabel="Pagamento com cartão"
              accessibilityState={{ selected: pgto === 'Cartao' }}>
              <Text style={[styles.optionTextBig, pgto === 'Cartao' && styles.selectedText]}>Cartão</Text>
              <Text style={[styles.optionTextSmall, pgto === 'Cartao' && styles.selectedText]}>
                IOF de {formatarPct(IOF_CARTAO_ATUAL * 100, 2)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionBtn, pgto === 'Dinheiro' && styles.selectedOption]}
              onPress={() => setPgto('Dinheiro')}
              accessibilityRole="button"
              accessibilityLabel="Pagamento em dinheiro"
              accessibilityState={{ selected: pgto === 'Dinheiro' }}>
              <Text style={[styles.optionTextBig, pgto === 'Dinheiro' && styles.selectedText]}>Dinheiro</Text>
              <Text style={[styles.optionTextSmall, pgto === 'Dinheiro' && styles.selectedText]}>
                IOF de {formatarPct(IOF_DINHEIRO * 100, 1)}
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
            placeholderTextColor={cores.muted}
            value={nomeProduto}
            onChangeText={setNomeProduto}
            accessibilityLabel="Nome do produto (opcional)"
          />
          <Text style={styles.label}>Link</Text>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            placeholderTextColor={cores.muted}
            autoCapitalize="none"
            keyboardType="url"
            value={link}
            onChangeText={setLink}
            accessibilityLabel="Link do produto (opcional)"
          />
          <Text style={styles.label}>Observação</Text>
          <TextInput
            style={[styles.input, styles.inputMultilinha]}
            placeholder="Ex: cor azul, cupom BLACK10, vendedor X"
            placeholderTextColor={cores.muted}
            value={observacao}
            onChangeText={setObservacao}
            multiline
            maxLength={140}
            accessibilityLabel="Observação sobre a compra (opcional)"
          />
        </View>

        <TouchableOpacity
          style={[styles.calcButton, !podeCalcular && styles.calcButtonDisabled]}
          onPress={calcular}
          disabled={!podeCalcular}
          accessibilityRole="button"
          accessibilityLabel="Calcular comparação"
          accessibilityState={{ disabled: !podeCalcular }}>
          <Text style={styles.calcButtonText}>CALCULAR</Text>
        </TouchableOpacity>
        {!podeCalcular && dados && (
          <Text style={styles.hintValidacao}>Preencha o preço no Brasil e no exterior para comparar.</Text>
        )}

        {resultado && (
          <View style={[styles.resultBox, resultado.valeImportar ? styles.resExt : styles.resBr]}>
            <View style={styles.resTituloRow}>
              {!resultado.valeImportar && <FlagIcon code="BR" size={16} style={{ marginRight: 6 }} />}
              <Text style={[styles.resTitle, { color: resultado.valeImportar ? cores.info : cores.success }]}>
                {resultado.msg}
              </Text>
            </View>
            <Text style={styles.resSmall}>
              {resultado.valeImportar
                ? `Economia de ${formatarBRL(resultado.economia)} (${formatarPct(resultado.economiaPct)})`
                : `Parcelar no Brasil sai ${formatarBRL(resultado.economia)} (${formatarPct(resultado.economiaPct)}) mais barato em valor de hoje.`}
            </Text>
            <View style={styles.divider} />
            <Text style={styles.resLine}>Custo Brasil (equivalente à vista): {formatarBRL(resultado.custoBR)}</Text>
            <Text style={styles.resLine}>Custo Exterior: {formatarBRL(resultado.custoExt)}</Text>

            <View style={styles.divider} />
            <Text style={styles.breakdownTitulo}>Detalhamento do custo no exterior</Text>
            {resultado.breakdown.map((item) => (
              <View key={item.label} style={styles.breakdownLinha}>
                <Text style={styles.breakdownLabel}>{item.label}</Text>
                <Text style={styles.breakdownValor}>{formatarBRL(item.valor)}</Text>
              </View>
            ))}

            {valParcelasBR > 1 && (
              <Text style={styles.resObs}>
                &ldquo;Equivalente à vista&rdquo; é quanto as parcelas do Brasil valem hoje,
                descontadas pelo rendimento que esse dinheiro renderia investido na Selic.
              </Text>
            )}

            <TouchableOpacity
              style={styles.shareButton}
              onPress={compartilhar}
              accessibilityRole="button"
              accessibilityLabel="Compartilhar resultado">
              <Text style={styles.shareButtonText}>📤 Compartilhar resultado</Text>
            </TouchableOpacity>
          </View>
        )}

        {ALERTAS_CAMBIO_ATIVO && <AlertasCambio cotacoes={dados?.cotacoes ?? null} />}

        <Text style={styles.disclaimer}>
          O Vale importar? é uma ferramenta de estimativa e não constitui recomendação financeira. Impostos,
          câmbio e taxas são aproximações baseadas em fontes oficiais — confirme as condições reais
          antes de qualquer compra.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function criarStyles(cores: Paleta) {
  return StyleSheet.create({
    container: { padding: 20, paddingTop: 60, backgroundColor: cores.background, flexGrow: 1, alignItems: 'center' },
    headerRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
    titulo: { fontSize: 26, fontWeight: 'bold', color: cores.primary },
    temaChip: { borderWidth: 1, borderColor: cores.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: cores.card },
    temaChipTexto: { fontSize: 12, color: cores.subtext, fontWeight: '600' },
    statusBox: { flexDirection: 'row', backgroundColor: cores.card, borderRadius: 12, marginBottom: 6, borderWidth: 1, borderColor: cores.border, overflow: 'hidden', width: '100%' },
    statusRow: { flex: 1, alignItems: 'center', padding: 10, borderRightWidth: 1, borderRightColor: cores.borderSoft },
    statusLabelRow: { flexDirection: 'row', alignItems: 'center' },
    statusLabel: { fontSize: 10, color: cores.subtext, fontWeight: 'bold', textTransform: 'uppercase' },
    statusValue: { fontSize: 13, color: cores.text, fontWeight: 'bold', marginTop: 2 },
    statusIdade: { fontSize: 11, color: cores.muted, marginBottom: 12, width: '100%', textAlign: 'center' },
    card: { backgroundColor: cores.card, width: '100%', padding: 15, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: cores.text, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: cores.borderSoft, paddingBottom: 5 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: cores.borderSoft, paddingBottom: 5 },
    sectionTitleInline: { fontSize: 16, fontWeight: 'bold', color: cores.text },
    label: { fontSize: 14, color: cores.subtext, marginTop: 10, marginBottom: 5, fontWeight: '600' },
    obs: { fontSize: 11, color: cores.muted, marginTop: 8, fontStyle: 'italic' },
    alternarModo: { fontSize: 12, color: cores.primary, marginTop: 8, fontWeight: '600' },
    input: { borderWidth: 1, borderColor: cores.border, borderRadius: 8, padding: 10, fontSize: 16, backgroundColor: cores.inputBg, color: cores.text, height: 50 },
    inputMultilinha: { height: 70, textAlignVertical: 'top', paddingTop: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },

    optionBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: cores.border, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.optionBg, minHeight: 60 },
    selectedOption: { backgroundColor: cores.primarySoft, borderColor: cores.primary },
    optionTextBig: { color: cores.subtext, fontSize: 14, fontWeight: 'bold' },
    optionTextSmall: { color: cores.muted, fontSize: 11, marginTop: 2, textAlign: 'center' },
    selectedText: { color: cores.primary, fontWeight: 'bold' },

    calcButton: { backgroundColor: cores.primary, width: '100%', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 8, shadowColor: cores.primary, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4 },
    calcButtonDisabled: { opacity: 0.4 },
    calcButtonText: { color: cores.card, fontSize: 18, fontWeight: 'bold' },
    hintValidacao: { fontSize: 12, color: cores.muted, marginBottom: 12, textAlign: 'center' },

    resultBox: { width: '100%', padding: 20, borderRadius: 12, marginTop: 12, marginBottom: 10, borderWidth: 1 },
    resBr: { backgroundColor: cores.successBg, borderColor: cores.successBorder },
    resExt: { backgroundColor: cores.infoBg, borderColor: cores.infoBorder },
    resTituloRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    resTitle: { fontSize: 18, fontWeight: 'bold' },
    resSmall: { fontSize: 14, color: cores.subtext, marginBottom: 10 },
    divider: { height: 1, backgroundColor: cores.borderSoft, marginVertical: 10 },
    resLine: { fontSize: 15, color: cores.text, marginTop: 2 },
    resObs: { fontSize: 11, color: cores.muted, fontStyle: 'italic', marginTop: 8 },

    breakdownTitulo: { fontSize: 12, fontWeight: 'bold', color: cores.subtext, textTransform: 'uppercase', marginBottom: 6 },
    breakdownLinha: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
    breakdownLabel: { fontSize: 13, color: cores.subtext, flexShrink: 1, marginRight: 10 },
    breakdownValor: { fontSize: 13, color: cores.text, fontWeight: '600' },

    shareButton: { marginTop: 14, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: cores.border, backgroundColor: cores.card },
    shareButtonText: { fontSize: 13, color: cores.text, fontWeight: '600' },

    disclaimer: { fontSize: 10, color: cores.muted, textAlign: 'center', marginTop: 6, marginBottom: 30, lineHeight: 15 },
  });
}
