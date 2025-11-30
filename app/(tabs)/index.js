import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';

// --- Lógica de IOF fora do componente para carregar IMEDIATAMENTE ---
const getIOFPorAno = () => {
  const anoAtual = new Date().getFullYear();
  // Cronograma Decreto 11.153/2022
  if (anoAtual === 2024) return 0.0438; // 4.38%
  if (anoAtual === 2025) return 0.0338; // 3.38%
  if (anoAtual === 2026) return 0.0238; // 2.38%
  if (anoAtual === 2027) return 0.0138; // 1.38%
  if (anoAtual >= 2028) return 0.0;     // 0%
  return 0.0438; // Fallback
};

export default function App() {
  // --- ESTADOS ---
  const [cotacaoDolar, setCotacaoDolar] = useState(0);
  const [cotacaoEuro, setCotacaoEuro] = useState(0);
  const [selicAnual, setSelicAnual] = useState(0);
  const [selicMensal, setSelicMensal] = useState(0.008); 
  const [loading, setLoading] = useState(true);
  
  // Taxas e Impostos
  // Correção Ponto 3: Inicializa JÁ com o valor do ano correto (sem delay)
  const [iofCartaoAtual] = useState(getIOFPorAno()); 
  const [iofDinheiro] = useState(0.011); 
  
  // Correção Ponto 2: Novo Campo Spread
  const [spread, setSpread] = useState('2.0'); // Padrão 2% (Média Wise/Nomad/C6)

  // Inputs
  const [precoBR, setPrecoBR] = useState('');
  const [parcelasBR, setParcelasBR] = useState('1'); 
  const [precoExt, setPrecoExt] = useState('');
  const [moeda, setMoeda] = useState('USD');
  const [pgto, setPgto] = useState('Cartao');

  // Resultado
  const [resultado, setResultado] = useState(null);

  // Parceiros (Banners)
  const parceiros = [
    { id: 1, nome: 'Wise', desconto: 'Primeira transferência grátis', cor: '#9fe870', texto: '#163300' },
    { id: 2, nome: 'Nomad', desconto: 'Cashback de 2% no app', cor: '#000000', texto: '#ffffff' },
    { id: 3, nome: 'Western Union', desconto: 'Taxa zero no 1º envio', cor: '#ffda00', texto: '#000000' }
  ];
  const [parceiroAtivo, setParceiroAtivo] = useState(parceiros[0]);

  // --- 1. Inicialização ---
  useEffect(() => {
    const random = Math.floor(Math.random() * parceiros.length);
    setParceiroAtivo(parceiros[random]);

    async function buscarDados() {
      try {
        console.log("🔄 Buscando dados...");

        const reqUSD = await fetch('https://api.frankfurter.app/latest?from=USD&to=BRL');
        const dataUSD = await reqUSD.json();
        
        const reqEUR = await fetch('https://api.frankfurter.app/latest?from=EUR&to=BRL');
        const dataEUR = await reqEUR.json();

        if (dataUSD?.rates?.BRL) setCotacaoDolar(dataUSD.rates.BRL);
        else setCotacaoDolar(6.00);

        if (dataEUR?.rates?.BRL) setCotacaoEuro(dataEUR.rates.BRL);
        else setCotacaoEuro(6.50);

        const resSelic = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json');
        const dadosSelic = await resSelic.json();

        if (dadosSelic && dadosSelic.length > 0) {
            const selicAnualValor = parseFloat(dadosSelic[0].valor);
            setSelicAnual(selicAnualValor);
            const selicMes = Math.pow(1 + (selicAnualValor / 100), 1 / 12) - 1;
            setSelicMensal(selicMes);
        } else {
             setSelicAnual(11.25);
             setSelicMensal(0.0089);
        }
        setLoading(false);
      } catch (error) {
        console.error("❌ Erro API:", error);
        setCotacaoDolar(6.00);
        setCotacaoEuro(6.50);
        setSelicAnual(11.25);
        setLoading(false);
      }
    }
    buscarDados();
  }, []);

  // --- 2. Cálculo ---
  const calcular = () => {
    const valPrecoBR = parseFloat(precoBR.replace(',', '.')) || 0;
    const valParcelasBR = parseInt(parcelasBR) || 1;
    const valPrecoExt = parseFloat(precoExt.replace(',', '.')) || 0;
    const valSpread = parseFloat(spread.replace(',', '.')) || 0;

    const taxaOportunidade = selicMensal; 
    let cotacaoFinal = (moeda === 'USD') ? cotacaoDolar : cotacaoEuro;
    
    // Aplica o Spread informado pelo usuário (Wise, Banco, Casa de Câmbio)
    // Fórmula: Cotação Comercial * (1 + Spread/100)
    cotacaoFinal = cotacaoFinal * (1 + (valSpread / 100));

    let iofFinal = 0;
    if (pgto === 'Dinheiro') {
      iofFinal = iofDinheiro;
    } else {
      iofFinal = iofCartaoAtual;
    }

    const custoExt = valPrecoExt * cotacaoFinal * (1 + iofFinal);

    let custoBR_VP = valPrecoBR;
    if (valParcelasBR > 1) {
      const valorParcela = valPrecoBR / valParcelasBR;
      custoBR_VP = valorParcela * ((1 - Math.pow(1 + taxaOportunidade, -valParcelasBR)) / taxaOportunidade);
    }

    const diff = custoBR_VP - custoExt;
    
    setResultado({
      valeImportar: diff > 0,
      custoBR: custoBR_VP,
      custoExt: custoExt,
      economia: Math.abs(diff),
      msg: diff > 0 ? '✈️ COMPRE NO EXTERIOR' : '🇧🇷 COMPRE NO BRASIL'
    });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>✈️ Vale importar?</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#1a73e8" style={{marginBottom: 20}}/>
        ) : (
          <View style={styles.statusBox}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>🇺🇸 USD</Text>
              <Text style={styles.statusValue}>R$ {cotacaoDolar.toFixed(2)}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>🇪🇺 EUR</Text>
              <Text style={styles.statusValue}>R$ {cotacaoEuro.toFixed(2)}</Text>
            </View>
            <View style={[styles.statusRow, {borderRightWidth: 0}]}>
              <Text style={styles.statusLabel}>📈 SELIC</Text>
              <Text style={styles.statusValue}>{selicAnual}% a.a.</Text>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🇧🇷 Opção Brasil</Text>
          <Text style={styles.label}>Preço (R$)</Text>
          <TextInput 
            style={styles.input} placeholder="1500.00" keyboardType="numeric"
            value={precoBR} onChangeText={setPrecoBR}
          />
          <Text style={styles.label}>Parcelas</Text>
          <TextInput 
            style={styles.input} placeholder="12" keyboardType="numeric"
            value={parcelasBR} onChangeText={setParcelasBR}
          />
          <Text style={styles.obs}>Custo oportunidade: {(selicMensal * 100).toFixed(2)}% a.m.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🌎 Opção Exterior</Text>
          <Text style={styles.label}>Preço no Exterior</Text>
          <TextInput 
            style={styles.input} placeholder="250.00" keyboardType="numeric"
            value={precoExt} onChangeText={setPrecoExt}
          />

          <View style={styles.row}>
            <View style={{flex: 1, marginRight: 10}}>
                <Text style={styles.label}>Moeda</Text>
                <View style={styles.rowSmall}>
                    <TouchableOpacity style={[styles.optionBtnSmall, moeda === 'USD' && styles.selectedOption]} onPress={() => setMoeda('USD')}>
                    <Text style={[styles.optionText, moeda === 'USD' && styles.selectedText]}>USD</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.optionBtnSmall, moeda === 'EUR' && styles.selectedOption]} onPress={() => setMoeda('EUR')}>
                    <Text style={[styles.optionText, moeda === 'EUR' && styles.selectedText]}>EUR</Text>
                    </TouchableOpacity>
                </View>
            </View>
            
            {/* NOVO CAMPO DE SPREAD */}
            <View style={{flex: 1}}>
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
            {/* Correção Ponto 1: Texto Explicativo no Botão */}
            <TouchableOpacity style={[styles.optionBtn, pgto === 'Cartao' && styles.selectedOption]} onPress={() => setPgto('Cartao')}>
              <Text style={[styles.optionTextBig, pgto === 'Cartao' && styles.selectedText]}>Cartão</Text>
              <Text style={[styles.optionTextSmall, pgto === 'Cartao' && styles.selectedText]}>
                IOF é {(iofCartaoAtual * 100).toFixed(2)}%
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.optionBtn, pgto === 'Dinheiro' && styles.selectedOption]} onPress={() => setPgto('Dinheiro')}>
              <Text style={[styles.optionTextBig, pgto === 'Dinheiro' && styles.selectedText]}>Dinheiro</Text>
              <Text style={[styles.optionTextSmall, pgto === 'Dinheiro' && styles.selectedText]}>
                IOF é {(iofDinheiro * 100).toFixed(1)}%
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.calcButton} onPress={calcular}>
          <Text style={styles.calcButtonText}>CALCULAR</Text>
        </TouchableOpacity>

        {/* Banner de Parceiros */}
        <View style={[styles.bannerContainer, { backgroundColor: parceiroAtivo.cor }]}>
          <View style={{flex: 1}}>
            <Text style={[styles.bannerTitle, { color: parceiroAtivo.texto }]}>
              {parceiroAtivo.nome}
            </Text>
            <Text style={[styles.bannerSubtitle, { color: parceiroAtivo.texto }]}>
              {parceiroAtivo.desconto}
            </Text>
          </View>
          <TouchableOpacity style={styles.bannerButton}>
            <Text style={styles.bannerButtonText}>VER</Text>
          </TouchableOpacity>
        </View>

        {resultado && (
          <View style={[styles.resultBox, resultado.valeImportar ? styles.resExt : styles.resBr]}>
            <Text style={[styles.resTitle, resultado.valeImportar ? {color:'#1967d2'} : {color:'#137333'}]}>
              {resultado.msg}
            </Text>
            <Text style={styles.resSmall}>
              {resultado.valeImportar 
                ? `Economia real de R$ ${resultado.economia.toFixed(2)}` 
                : `A longo prazo, parcelar no BR vale mais.`}
            </Text>
            <View style={styles.divider} />
            <Text style={styles.resLine}>Custo BR (VP): R$ {resultado.custoBR.toFixed(2)}</Text>
            <Text style={styles.resLine}>Custo Ext: R$ {resultado.custoExt.toFixed(2)}</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, backgroundColor: '#f0f2f5', flexGrow: 1, alignItems: 'center' },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#1a73e8', marginBottom: 15 },
  statusBox: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#ddd', overflow: 'hidden' },
  statusRow: { flex: 1, alignItems: 'center', padding: 10, borderRightWidth: 1, borderRightColor: '#eee' },
  statusLabel: { fontSize: 10, color: '#666', fontWeight: 'bold', textTransform: 'uppercase' },
  statusValue: { fontSize: 13, color: '#333', fontWeight: 'bold', marginTop: 2 },
  card: { backgroundColor: '#fff', width: '100%', padding: 15, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
  label: { fontSize: 14, color: '#666', marginTop: 10, marginBottom: 5, fontWeight: '600' },
  obs: { fontSize: 11, color: '#999', marginTop: 5, fontStyle: 'italic', textAlign: 'right' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 16, backgroundColor: '#fff', height: 50 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  rowSmall: { flexDirection: 'row', gap: 5 },
  
  // Botões de Opção (Moeda e Pagamento)
  optionBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9', minHeight: 60 },
  optionBtnSmall: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, alignItems: 'center', backgroundColor: '#f9f9f9', height: 50, justifyContent: 'center' },
  selectedOption: { backgroundColor: '#e8f0fe', borderColor: '#1a73e8' },
  optionText: { color: '#555', fontSize: 14 },
  optionTextBig: { color: '#555', fontSize: 14, fontWeight: 'bold' },
  optionTextSmall: { color: '#777', fontSize: 11, marginTop: 2 },
  selectedText: { color: '#1a73e8', fontWeight: 'bold' },

  calcButton: { backgroundColor: '#1a73e8', width: '100%', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 20, shadowColor: '#1a73e8', shadowOpacity: 0.3, shadowRadius: 5, elevation: 4 },
  calcButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  bannerContainer: { width: '100%', padding: 15, borderRadius: 12, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  bannerTitle: { fontSize: 16, fontWeight: 'bold' },
  bannerSubtitle: { fontSize: 12, marginTop: 2, opacity: 0.9 },
  bannerButton: { backgroundColor: 'rgba(255,255,255,0.25)', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20 },
  bannerButtonText: { fontWeight: 'bold', fontSize: 12, color: '#333' },
  
  resultBox: { width: '100%', padding: 20, borderRadius: 12, marginBottom: 30, borderWidth: 1 },
  resBr: { backgroundColor: '#e6f4ea', borderColor: '#34a853' },
  resExt: { backgroundColor: '#e8f0fe', borderColor: '#4285f4' },
  resTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  resSmall: { fontSize: 14, color: '#555', marginBottom: 10 },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.1)', marginVertical: 10 },
  resLine: { fontSize: 16, color: '#333' },
});