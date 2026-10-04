# Changelog — Empóros

Histórico das entregas por rodada de desenvolvimento (branches mergeadas em `main`). A partir da 2.1.0, cada entrada traz também a versão (SemVer).

## 2026-10-03 — v2.2.0 · Infraestrutura, regras fiscais e alertas
- **CI no GitHub Actions** (`.github/workflows/ci.yml`): lint, TypeScript, testes e `expo-doctor` em todo PR e push na `main`. Dependabot mantém as actions atualizadas.
- Novo script `npm run typecheck`; `expo`, `expo-constants` e `jest-expo` atualizados para os patches esperados pelo SDK 54.
- **Projeto renomeado para Empóros** (`emporos`): nome do pacote, slug do Expo, identificador das lojas (`io.github.luccasamorim.emporos`) e documentação. "Vale importar?" segue como nome exibido ao usuário. O slug novo exige um projeto EAS novo (`eas init`).
- **Correção — IOF desatualizado:** o app seguia o cronograma de redução do Decreto nº 11.153/2022 (2,38% no cartão em 2026; 1,1% em espécie), abandonado em 2025. Agora usa os 3,5% do Decreto nº 12.499/2025 para cartão e espécie.
- **Correção — Remessa Conforme:** II de 0% até US$ 50 e desconto de US$ 30 acima (Portaria MF nº 1.342/2026), no lugar de 20% e US$ 20. Novo seletor de **ICMS do estado** (17% ou 20%, lembrado entre usos) e opção para **site fora do Remessa Conforme** (60% sem desconto).
- **Regras fiscais datadas** em `constants/regras-fiscais.ts`: valores, data de revisão e fonte oficial de cada regra. O resultado mostra "Regras fiscais de out/2026" e as fontes com link, e avisa quando a encomenda passa de US$ 3.000 ou a compra de viagem passa da cota de bagagem.
- **Organização do código:** a Home caiu de ~720 para ~170 linhas. O estado do formulário foi para `hooks/use-formulario-calculo.ts` (funções puras `montarSimulacao` e `camposDoPrefill`, testadas), a tela foi dividida em `components/formulario/*`, `StatusMercado`, `ResultadoCalculo` e `BotaoOpcao`, e o texto de compartilhar ficou único em `core/compartilhamento.ts` (Home e Histórico).
- **Testes de tela** com a Testing Library (`__tests__/tela-home.test.tsx`): cálculo, ICMS, site fora do Remessa Conforme, histórico, aviso de bagagem e "Recalcular hoje".
- Correção: o "Recalcular hoje" podia ter a moeda trocada pela última moeda salva, se o carregamento do armazenamento terminasse depois.
- `CONTRIBUTING.md`, modelos de issue (problema, sugestão e **regra fiscal desatualizada**) e de PR.
- Chaves do AsyncStorage unificadas em `services/armazenamento.ts` sob o prefixo `@emporos:`, com migração automática das chaves antigas (`@paridade:*`, `@vale_importar:*`) na primeira leitura — nada se perde.

## 2026-10-02 — v2.1.0 · App gratuito e código aberto (`feature/app-gratuito-mit`)
- **Fim do modelo freemium:** o app passa a ser publicado de graça, financiado por doações. Removidos a paywall, a camada de compras (`services/compras.ts`), o contexto premium (`hooks/use-premium.tsx`) e a cota de 5 cálculos (`hooks/use-contador-calculos.ts`).
- **Tudo liberado para todos:** cálculos ilimitados, histórico de simulações, todas as moedas (GBP, JPY, ARS e CLP sem cadeado) e **alertas de câmbio ativados** (`ALERTAS_CAMBIO_ATIVO = true`), com aviso em foreground na Home.
- **Sem doação dentro do app**, por causa das diretrizes 3.2.1/3.2.2 da Apple: os links de apoio ficam no README e no `.github/FUNDING.yml` (GitHub Sponsors + PIX).
- **Licença MIT** (Copyright (c) 2026 Luccas de Amorim) no lugar da licença proprietária.
- README reescrito: o app é descrito como calculadora de decisão de compra, com aviso de que os resultados são estimativas e não aconselhamento financeiro, tributário ou de investimento, e com a seção "Apoie" (meta de ~US$ 125 para publicar nas duas lojas).
- Link da política de privacidade corrigido para o novo usuário do GitHub (`luccas-amorim`); texto revisado (APIs atuais, dados salvos só no aparelho, sem afiliados nem compras) em `docs/POLITICA-DE-PRIVACIDADE.md` e publicado no gist (03/10/2026).
- **Correção — "Recalcular hoje":** o tax free da simulação não voltava para a Home, e campos opcionais vazios (frete, tax free, nome, link, observação) herdavam os valores da simulação que estava na tela. Os parâmetros agora são montados por `paramsRecalculo()`, com testes.

## 2026-07-20 — Tax free (`feature/paises-tax-free`)
- Campo de **tax free** (% que o usuário recupera), visível só no cenário Viagem, abatido do custo com linha própria no detalhamento. A taxa é informada pelo usuário — não mantemos tabela por país, que envelheceria em silêncio.
- Seletor de países implementado e testado, porém **não exibido**: o catálogo ainda é curto e, no plano gratuito, um país de moeda premium faria a tela contradizer o cálculo. Guardado para reuso (ver ROADMAP).
- Valores negativos passam a ser formatados como "-R$ 620,32".

## 2026-07-20 — Modelo freemium (`feature/freemium-gate`)
- **Cota gratuita:** 5 cálculos no total (contador local); ao esgotar, o botão vira "Desbloquear" e abre a paywall. Indicador de cota restante na Home.
- **Histórico é premium:** na versão gratuita nada é salvo e a aba mostra um convite à versão completa.
- Estado premium e paywall centralizados num contexto global (`PremiumProvider`) — a paywall abre de qualquer tela e a compra destrava tudo imediatamente, sem recarregar.
- Benefícios da paywall atualizados (cálculos ilimitados + histórico + moedas + alertas).

## 2026-07-20 — Nome público, observação e roadmap dual-store (`feature/nome-observacao-roadmap`)
- Nome público revertido para **"Vale importar?"** (mais intuitivo/memorável) em toda a UI, app.json e docs. O termo "paridade" segue apenas como conceito interno (nome da função de cálculo).
- Campo de **observação** (até 140 caracteres) na identificação do item, salvo no histórico e propagado no "Recalcular hoje".
- `docs/ROADMAP.md` reescrito: novo modelo freemium (5 cálculos grátis, premium R$ 4,99), decisões de infraestrutura (sem servidor/DB, IAP não-consumível, RevenueCat) e passo a passo de publicação simultânea Google Play + App Store com requisitos de cada.

## 2026-07-20 — Identidade visual Petróleo (`feature/identidade-petroleo`)
- Paleta própria "Petróleo" substituindo o azul genérico do template: claro `#0f6e56`, escuro `#5dcaa5`, neutros com subtom esverdeado. Contraste AA verificado nos dois modos.
- Cores semânticas (sucesso/info/aviso/erro) mantidas distintas da cor de marca.

## 2026-07-20 — Paywall/IAP e alertas (`feature/iap-alertas`)
- Paywall de compra única com camada de compras isolada (`services/compras.ts`): simulada em dev, "em breve" em produção até o IAP real.
- Alertas de câmbio completos (alvos, persistência, verificação testada, banner em foreground) atrás de feature flag desligada.
- Correção: modais no react-native-web não desmontavam com `animationType="fade"`; animação agora só no nativo.

## 2026-07-20 — Freemium de moedas (`feature/moedas-premium`)
- USD/EUR gratuitos; GBP/JPY/ARS/CLP na versão completa, com cadeado no dropdown sem interromper a jornada.
- Última moeda selecionada persistida; status box com par USD/EUR que troca de posição conforme a seleção.

## 2026-07-15 — Evolução de produto (`feature/paridade-produto`)
- **Correção crítica:** tributação de encomendas internacionais (Remessa Conforme: II 20%/60% − US$ 20 + ICMS 20% por dentro) com cenários Viagem × Encomenda e breakdown transparente de custos.
- Frete internacional, entrada por valor da parcela, economia em %, compartilhamento nativo, onboarding de 3 telas, disclaimer legal.
- Cache de cotações com idade visível + pull-to-refresh; exibição monetária pt-BR; dark mode completo; limpeza do template Expo; dependências atualizadas.

## 2026-07-15 — Histórico de simulações (`feature/historico-simulacoes`)
- Core financeiro extraído para módulos TypeScript puros com testes (Jest) reproduzindo o whitepaper.
- Fonte de câmbio migrada para AwesomeAPI (multi-moeda, tempo quase real); dropdown de moedas com bandeiras.
- Histórico persistente (AsyncStorage) com nome do produto e link; correção do parsing de números em formato brasileiro ("1.500,00").

## 2025 — MVP original (`main` inicial)
- Calculadora VP (Selic) × custo de importação com IOF temporal (Decreto 11.153/2022), Frankfurter API e banners de parceiros (removidos depois).
