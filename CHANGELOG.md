# Changelog — Vale importar?

Histórico das entregas por rodada de desenvolvimento (branches mergeadas em `main`).

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
