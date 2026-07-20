# 🗺️ Roadmap — Paridade

Acompanhamento dos próximos passos rumo à publicação. Atualize os checkboxes conforme avançar; o que já foi entregue está no [CHANGELOG.md](../CHANGELOG.md).

## Fase atual: preparação para a Play Store

### Depende de ações externas (do autor)

- [ ] **Arte do ícone** — o ícone atual é o placeholder do template Expo. Direção definida: balança estilizada minimalista em branco/verde-água sobre fundo petróleo `#0f6e56` chapado, legível a 48px. Substituir `assets/images/icon.png`, `android-icon-*.png` e `splash-icon.png`.
- [ ] **Conta Google Play Developer** aprovada (taxa única US$ 25).
- [ ] **Build de produção** — `eas build --platform android --profile production` (perfil já configurado em `eas.json`).
- [ ] **Screenshots e página da loja** — usar a identidade Petróleo; destacar breakdown de impostos como diferencial.
- [ ] **Beta fechado na Play Store** (teste interno → faixa fechada) e coleta de feedback.

### Ativações pós-beta (uma linha cada, já construídas)

- [ ] **Ativar alertas de câmbio** — trocar `ALERTAS_CAMBIO_ATIVO` para `true` em `constants/feature-flags.ts`.
- [ ] **Integrar IAP real** — escolher entre RevenueCat (mais simples, taxa própria) ou expo-iap (nativo); implementar apenas dentro de `comprarVersaoCompleta()`/`restaurarCompras()` em `services/compras.ts`. Definir preço final (R$ 4,99 ou 9,99) em `PRECO_VERSAO_COMPLETA`.

## Fase seguinte: pós-lançamento

- [ ] **Push notifications de alertas** via EAS (hoje os alertas disparam ao abrir o app; push exige `expo-notifications` + credenciais).
- [ ] **iOS** — conta Apple Developer (US$ 99/ano) e build iOS; o código já é multiplataforma.
- [ ] **Mais moedas premium** — adicionar em `constants/currencies.ts` + bandeira em `components/flag-icon.tsx` (AwesomeAPI cobre dezenas de pares).
- [ ] **Histórico de cotação com gráfico** — "melhor momento para comprar" (AwesomeAPI tem endpoint de série histórica).

## Ideias avaliadas e adiadas

- **i18n (inglês/espanhol)** — só se houver tração fora do BR; a tributação modelada é brasileira.
- **Versão web pública** — o alvo é mobile; o web hoje serve como bancada de testes.
