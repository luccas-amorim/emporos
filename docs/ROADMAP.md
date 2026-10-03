# 🗺️ Roadmap — Vale importar?

Documento vivo de acompanhamento. Marque os checkboxes conforme avançar. O que já foi entregue está no [CHANGELOG.md](../CHANGELOG.md).

---

## 1. Modelo de produto (gratuito, mantido por doações)

Decidido em 02/10/2026: o app será publicado **de graça** nas duas lojas, com **todos os recursos para todos** — cálculos ilimitados, todas as moedas, histórico e alertas de câmbio (quando lançados). Sem anúncios, sem compras dentro do app, sem cadastro. O código é aberto sob licença **MIT**.

- **Custos de publicação:** Apple US$ 99/ano + Google US$ 25 (taxa única) ≈ **US$ 125** no primeiro ano.
- **Financiamento:** doações via [GitHub Sponsors](https://github.com/sponsors/luccas-amorim) e [PIX](https://luccas-amorim.github.io/apoie/), divulgadas no README e no `.github/FUNDING.yml`.
- **Nada de doação dentro do app:** as diretrizes 3.2.1/3.2.2 da Apple proíbem pedir doações no app a quem não é organização sem fins lucrativos registrada. Não adicionar botão, link nem texto de apoio na UI.

> O modelo freemium anterior (5 cálculos grátis, histórico e moedas extras pagos por compra única) foi removido na v2.1.0 — ver [CHANGELOG.md](../CHANGELOG.md).

---

## 2. Arquitetura de infraestrutura (decidido)

- **Servidor próprio:** não é necessário. Câmbio (AwesomeAPI) e Selic (BCB) são APIs públicas de terceiros; o cálculo é local. Custo mensal de infra ≈ R$ 0.
- **Banco de dados:** não. Histórico e preferências ficam no aparelho (AsyncStorage).
- **Pagamentos:** nenhum. Sem IAP, o app não precisa de Paid Apps Agreement, Google Play Billing nem validação de recibos.
- **LGPD:** como nada sai do aparelho, o app não coleta dados pessoais — simplifica o formulário de privacidade das lojas.

---

## 3. Fases de desenvolvimento pendentes

### Fase 2 — App gratuito e código aberto ✅ concluída
- [x] Remover paywall, cota de cálculos, gate de histórico/moedas/alertas e camada de compras.
- [x] Licença MIT, `.github/FUNDING.yml` e seção "Apoie" no README.
- [x] Política de privacidade revisada (`docs/POLITICA-DE-PRIVACIDADE.md`).
- [ ] Publicar o texto revisado no gist da política de privacidade (URL usada nas lojas).
- [x] Tornar o repositório público (o botão "Sponsor" do `FUNDING.yml` só aparece em repositório público).
- [x] Ativar os alertas de câmbio para todos (`ALERTAS_CAMBIO_ATIVO = true`).

### Fase 3 — Tax free ✅ concluída
- [x] Campo de tax free (% que o usuário recupera) informado por ele, visível apenas no cenário Viagem, abatido do custo com linha própria no detalhamento.

> **Decisão de design:** a taxa é informada pelo usuário, não mantida numa tabela por país. Alíquotas e programas mudam sem aviso (o Reino Unido encerrou o dele em 2021; o Japão muda o sistema em nov/2026) e o que volta ao bolso depende da loja e da operadora. Um número desatualizado num app financeiro é pior que nenhum número.

### 🧊 Guardado para reuso: seletor de países
`components/country-select.tsx` + `constants/paises.ts` estão prontos e testados, mas **não são exibidos**. Trazem dropdown com busca tolerante a acentos, lista virtualizada e opção "Outro país" em texto livre.

Foi retirado da tela porque o catálogo cobre apenas países das moedas suportadas — para ser útil, precisaria de uma lista bem maior. (O segundo motivo, um país de moeda premium contradizendo o cálculo no plano gratuito, deixou de existir com o fim do freemium.)

Para reativar: ampliar o catálogo.

---

## 4. Publicação nas lojas (lançamento simultâneo)

O código já é multiplataforma; os builds saem da nuvem via **EAS Build** (`eas build`), sem necessidade de Mac. Submissão via `eas submit`.

### 4a. Pré-requisitos comuns (fazer uma vez)
- [ ] **Arte do ícone** — hoje é o placeholder do template. Direção: balança/avião minimalista em branco/verde-água sobre fundo petróleo `#0f6e56`, legível a 48px. Trocar `assets/images/icon.png`, `android-icon-*.png`, `splash-icon.png` e `favicon.png`.
- [ ] **Ícone 1024×1024** (sem transparência, para as fichas das lojas).
- [ ] **Screenshots** por dispositivo (telas claras e escuras; destacar o breakdown de impostos como diferencial).
- [ ] **Textos da ficha:** nome ("Vale importar?"), descrição curta e longa, palavras-chave. PT-BR obrigatório; EN opcional.
- [ ] **Política de privacidade (URL)** — gist em `gist.github.com/luccas-amorim/b2fee294fdd1c734825f064f8cb2cc79`. Substituir pelo texto de `docs/POLITICA-DE-PRIVACIDADE.md` (o atual ainda cita Frankfurter API e links de afiliados); depois, ao alterar um, alterar o outro.
- [ ] **Links de doação fora do app:** README e página de apoio. Na ficha da App Store, preferir apontar só para o repositório — a Apple também revisa os textos da ficha.
- [ ] **Classificação etária** (questionário) — o app não tem conteúdo sensível.

### 4b. Google Play (Android)
Requisitos e ordem:
- [ ] **Conta Google Play Console** — taxa **única de US$ 25**.
- [ ] **Verificação de identidade** (documento) — obrigatória para contas novas; pode levar alguns dias.
- [ ] **Teste fechado obrigatório:** contas pessoais precisam de um teste fechado com **≥ 12 testadores por 14 dias consecutivos** antes de liberar produção. ⚠️ **Comece isto cedo** — é o passo mais lento do cronograma.
- [ ] Formulário **Data Safety** (declarar que não coleta dados).
- [ ] **Target API level** atual (Android 14 / API 34+) — o SDK 54 já atende.
- [ ] Build **.aab**: `eas build -p android --profile production`.
- [ ] Envio: `eas submit -p android` → faixa de teste → produção após os 14 dias.

### 4c. App Store (iOS/Apple)
Requisitos e ordem:
- [ ] **Apple Developer Program** — **US$ 99/ano** (recorrente). Inscrição como indivíduo é mais rápida; empresa exige D-U-N-S.
- [ ] **App Store Connect:** criar o app, ficha, screenshots por tamanho de tela, **App Privacy** (nutrition labels — "não coleta dados").
- [ ] Build **.ipa**: `eas build -p ios --profile production` (na nuvem; EAS gerencia certificados — **sem Mac**).
- [ ] Envio: `eas submit -p ios` → **revisão humana da Apple** (1–3 dias; mais rigorosa, pode pedir ajustes).

### 4d. Cronograma sugerido
1. Ícone + assets + textos (comum).
2. Arrecadar a meta (~US$ 125) e abrir contas nas duas lojas (identidade Google + inscrição Apple podem levar dias).
3. **Iniciar o teste fechado do Android imediatamente** (relógio de 14 dias correndo).
4. Em paralelo: submeter iOS para revisão.
5. Publicar produção assim que Android cumprir os 14 dias e Apple aprovar.

---

## 5. Pós-lançamento
- [ ] **Push notifications** de alertas via EAS (`expo-notifications` + credenciais).
- [ ] **Mais moedas** — `constants/currencies.ts` + bandeira em `components/flag-icon.tsx`.
- [ ] **Histórico de cotação com gráfico** ("melhor momento para comprar").
- [ ] **Backup opcional** do histórico no iCloud/Google Drive do próprio usuário (sem servidor seu).

## Ideias avaliadas e adiadas
- **i18n (EN/ES)** — só com tração fora do BR; a tributação modelada é brasileira.
- **Versão web pública** — alvo é mobile; o web serve como bancada de testes.
