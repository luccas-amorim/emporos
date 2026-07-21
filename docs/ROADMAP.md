# 🗺️ Roadmap — Vale importar?

Documento vivo de acompanhamento. Marque os checkboxes conforme avançar. O que já foi entregue está no [CHANGELOG.md](../CHANGELOG.md).

---

## 1. Modelo de produto (free × premium)

| Recurso | Grátis | Premium (compra única R$ 4,99) |
| --- | --- | --- |
| Cálculos | Até **5** no total | Ilimitados |
| Moedas | USD e EUR | + GBP, JPY, ARS, CLP (e futuras) |
| Histórico de simulações | ❌ | ✅ |
| País da compra + tax free | Lista curta (EUA, França, Itália, Espanha…) | Lista completa |
| Alertas de câmbio | ❌ | ✅ (quando lançados) |

> **Nota do contador de cálculos:** o limite de 5 fica no aparelho (AsyncStorage). Um usuário pode desinstalar/reinstalar para zerar — tolerável para R$ 4,99; blindar exigiria servidor.

---

## 2. Arquitetura de infraestrutura (decidido)

- **Servidor próprio:** não é necessário. Câmbio (AwesomeAPI) e Selic (BCB) são APIs públicas de terceiros; o cálculo é local. Custo mensal de infra ≈ R$ 0.
- **Banco de dados:** não. Histórico e preferências ficam no aparelho (AsyncStorage); "quem pagou" fica na loja.
- **Liberação do pagante:** produto **não-consumível** (IAP). A identidade é a conta Google/Apple já logada no celular — sem conta/login próprios. "Restaurar compras" recupera o acesso em troca de aparelho/reinstalação.
- **Validação de compra:** recomendado **RevenueCat** (SDK que unifica Play + App Store, valida recibos no servidor deles, grátis até US$ 2.500/mês de receita — sem servidor seu). Alternativa: `expo-iap` (validação no app, mais simples, falsificável por root — tolerável para o preço).
- **LGPD:** como nada sai do aparelho, o app não coleta dados pessoais — simplifica o formulário de privacidade das lojas.

---

## 3. Fases de desenvolvimento pendentes

### Fase 2 — Novo modelo freemium
- [ ] Contador de cálculos (hook + AsyncStorage), gate em 5 no grátis.
- [ ] Travar aba/salvamento de Histórico no grátis (pitch premium no lugar).
- [ ] Paywall disparada ao atingir o 5º cálculo e ao tocar em recurso premium.
- [ ] Ajustar a paywall para listar os benefícios do novo modelo.

### Fase 3 — País da compra + tax free
- [ ] Estrutura de dados de países (nome PT, ISO, moeda oficial, elegível a tax free, % típica de reembolso ao turista) — **pesquisar as taxas reais de VAT refund por país**.
- [ ] Dropdown de países otimizado para mobile: lista alfabética + campo de busca (filtra ao digitar), performático com muitos itens (FlatList virtualizada).
- [ ] País sugere a moeda (editável) e é salvo na simulação.
- [ ] Selo "tax free disponível (~X% reembolsável)" + toggle opcional no cenário Viagem que desconta a estimativa do custo.
- [ ] Grátis: lista curta (EUA, França, Itália, Espanha, Reino Unido, Japão). Premium: lista completa.

### Fase 4 — Integração de pagamento
- [ ] Escolher RevenueCat × expo-iap e definir preço final em `services/compras.ts`.
- [ ] Criar produto não-consumível nas duas lojas e conectar `comprarVersaoCompleta()`/`restaurarCompras()`.
- [ ] Testar compra em faixa de teste (sandbox) nas duas plataformas.

---

## 4. Publicação nas lojas (lançamento simultâneo)

O código já é multiplataforma; os builds saem da nuvem via **EAS Build** (`eas build`), sem necessidade de Mac. Submissão via `eas submit`.

### 4a. Pré-requisitos comuns (fazer uma vez)
- [ ] **Arte do ícone** — hoje é o placeholder do template. Direção: balança/avião minimalista em branco/verde-água sobre fundo petróleo `#0f6e56`, legível a 48px. Trocar `assets/images/icon.png`, `android-icon-*.png`, `splash-icon.png` e `favicon.png`.
- [ ] **Ícone 1024×1024** (sem transparência, para as fichas das lojas).
- [ ] **Screenshots** por dispositivo (telas claras e escuras; destacar o breakdown de impostos como diferencial).
- [ ] **Textos da ficha:** nome ("Vale importar?"), descrição curta e longa, palavras-chave. PT-BR obrigatório; EN opcional.
- [ ] **Política de privacidade (URL)** — já existe (gist). Confirmar que reflete "nenhum dado sai do aparelho".
- [ ] **Classificação etária** (questionário) — o app não tem conteúdo sensível.

### 4b. Google Play (Android)
Requisitos e ordem:
- [ ] **Conta Google Play Console** — taxa **única de US$ 25**.
- [ ] **Verificação de identidade** (documento) — obrigatória para contas novas; pode levar alguns dias.
- [ ] **Teste fechado obrigatório:** contas pessoais precisam de um teste fechado com **≥ 12 testadores por 14 dias consecutivos** antes de liberar produção. ⚠️ **Comece isto cedo** — é o passo mais lento do cronograma.
- [ ] Formulário **Data Safety** (declarar que não coleta dados).
- [ ] **Target API level** atual (Android 14 / API 34+) — o SDK 54 já atende.
- [ ] Build **.aab**: `eas build -p android --profile production`.
- [ ] IAP: criar produto gerenciado (não-consumível) no Console; ativar Google Play Billing.
- [ ] Envio: `eas submit -p android` → faixa de teste → produção após os 14 dias.

### 4c. App Store (iOS/Apple)
Requisitos e ordem:
- [ ] **Apple Developer Program** — **US$ 99/ano** (recorrente). Inscrição como indivíduo é mais rápida; empresa exige D-U-N-S.
- [ ] **App Store Connect:** criar o app, ficha, screenshots por tamanho de tela, **App Privacy** (nutrition labels — "não coleta dados").
- [ ] **Paid Apps Agreement** + dados bancários/fiscais (necessário para IAP).
- [ ] Build **.ipa**: `eas build -p ios --profile production` (na nuvem; EAS gerencia certificados — **sem Mac**).
- [ ] IAP: criar produto não-consumível no App Store Connect; StoreKit.
- [ ] Envio: `eas submit -p ios` → **revisão humana da Apple** (1–3 dias; mais rigorosa, pode pedir ajustes).

### 4d. Cronograma sugerido
1. Ícone + assets + textos (comum).
2. Abrir contas nas duas lojas (identidade Google + inscrição Apple podem levar dias).
3. **Iniciar o teste fechado do Android imediatamente** (relógio de 14 dias correndo).
4. Em paralelo: submeter iOS para revisão.
5. Integrar IAP e testar em sandbox nas duas.
6. Publicar produção assim que Android cumprir os 14 dias e Apple aprovar.

---

## 5. Pós-lançamento
- [ ] **Ativar alertas de câmbio** — `ALERTAS_CAMBIO_ATIVO = true` em `constants/feature-flags.ts`.
- [ ] **Push notifications** de alertas via EAS (`expo-notifications` + credenciais).
- [ ] **Mais moedas premium** — `constants/currencies.ts` + bandeira em `components/flag-icon.tsx`.
- [ ] **Histórico de cotação com gráfico** ("melhor momento para comprar").
- [ ] **Backup opcional** do histórico no iCloud/Google Drive do próprio usuário (sem servidor seu).

## Ideias avaliadas e adiadas
- **i18n (EN/ES)** — só com tração fora do BR; a tributação modelada é brasileira.
- **Versão web pública** — alvo é mobile; o web serve como bancada de testes.
