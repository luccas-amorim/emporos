# Empóros

<sub>O nome vem de émporos, o mercador grego que fazia a conta de importar. [Por quê?](MITO.md)</sub>

> Uma calculadora de decisão de compra que usa Valor Presente para comparar o custo real de importar um produto com o de comprá-lo no Brasil, inclusive parcelado.

Nas lojas e na tela do celular, o app se chama **✈️ Vale importar?**. Empóros é o nome do projeto e de tudo que fica no código: pacote, identificadores e chaves de armazenamento.

![Status](https://img.shields.io/badge/Status-MVP_Mobile-green) ![License](https://img.shields.io/badge/Licença-MIT-yellow) ![Version](https://img.shields.io/badge/Versão-2.1.0-blue) ![Stack](https://img.shields.io/badge/Tech-React_Native-violet) [![CI](https://github.com/luccas-amorim/emporos/actions/workflows/ci.yml/badge.svg)](https://github.com/luccas-amorim/emporos/actions/workflows/ci.yml)

> ⚠️ **Aviso:** os resultados são estimativas para comparação e não constituem aconselhamento financeiro, tributário ou de investimento. Câmbio, alíquotas e regras de importação mudam; confirme as condições reais antes de comprar.

## 🎯 O Problema
Comprar no exterior parece barato pelo preço de etiqueta, mas taxas de câmbio, IOF e a falta de parcelamento escondem o custo real. Por outro lado, comprar no Brasil parcelado pode ser vantajoso devido à inflação e custo de oportunidade do dinheiro.

## 💡 A Solução
Esta calculadora não faz apenas conversão de moeda: ela coloca as duas opções de compra na mesma base de comparação, considerando:

* **Matemática Financeira (VP):** Traz as parcelas brasileiras a Valor Presente, descontando o rendimento mensal baseado na **Selic Meta (Banco Central)**.
* **Câmbio Realista:** Cotação comercial em tempo quase real via **AwesomeAPI** (USD, EUR, GBP, JPY, ARS, CLP) + Campo de **Spread Bancário** personalizável (Wise, Nomad, Cartão físico).
* **Tributação de Encomendas:** Cenários **Viagem × Encomenda** — encomendas internacionais incluem Imposto de Importação (Remessa Conforme: 0% até US$ 50, 60% − US$ 30 acima; 60% em sites fora do programa) e ICMS de 17% ou 20% por dentro, conforme o estado, com breakdown transparente de cada custo.
* **Regras fiscais com data:** IOF (3,5% no cartão e em espécie), Remessa Conforme, ICMS e cota de bagagem ficam em [`constants/regras-fiscais.ts`](constants/regras-fiscais.ts), com a data da última revisão e a fonte oficial de cada regra. O app mostra essa data e as fontes junto do resultado.
* **Fallback de Segurança:** Cache local da última cotação real, com idade exibida ao usuário — o app segue funcional offline sem inventar números.
* **Histórico de Simulações:** Persistência local com nome do produto, link, cotação da época, recálculo com taxas atuais e compartilhamento.

O app é **gratuito e completo**: todas as moedas e recursos para todo mundo, sem anúncios, sem compras dentro do app e sem cadastro.

## 🛠️ Tecnologias
* **Core:** React Native (Expo SDK 54) + TypeScript estrito, Expo Router.
* **Arquitetura:** lógica financeira pura em `core/` (testada com Jest), consumo de APIs com cache em `services/`, estado persistente em `hooks/`, UI temática (claro/escuro) em `components/` + `constants/theme.ts`.
* **APIs:**
    * *AwesomeAPI* (câmbio comercial, bid/ask em tempo quase real).
    * *Banco Central do Brasil — SGS série 432* (Meta Selic).

## 🚀 Como Rodar o Projeto

Pré-requisitos: Node.js instalado.

```bash
npm install        # dependências
npx expo start     # inicia (QR Code p/ Expo Go, `a` Android, `i` iOS, `w` web)
npm test           # testes unitários (core financeiro, formatação, services)
npm run lint       # ESLint
npm run typecheck  # TypeScript
```

Cada PR passa pelo CI (GitHub Actions): lint, tipos, testes e `expo-doctor`, que confere se as dependências batem com o Expo SDK. Para atualizar dependências do Expo, use `npx expo install --fix`.

## 🤝 Contribuindo
Issues e PRs são bem-vindos. O [CONTRIBUTING.md](CONTRIBUTING.md) explica a organização do código, as convenções e como atualizar uma regra fiscal; achou uma alíquota desatualizada, abra uma issue com o modelo "Regra fiscal desatualizada".

## 🗺️ Roadmap
O plano de evolução e os próximos passos rumo à publicação estão em **[docs/ROADMAP.md](docs/ROADMAP.md)** — incluindo o que depende de ações externas (contas de developer, beta da Play Store). O histórico do que já foi entregue está no **[CHANGELOG.md](CHANGELOG.md)**.

## 📄 Documentação Técnica
Para detalhes sobre a fórmula de Valor Presente, a tributação de encomendas (Remessa Conforme) e a lógica fiscal, consulte o [Whitepaper Técnico](docs/WHITEPAPER.md).

## 💚 Apoie
O app vai ser publicado **de graça** no Google Play e na App Store, sem anúncios e sem compras dentro do app. Para isso, a meta é juntar **cerca de US$ 125**: US$ 99 da conta de desenvolvedor da Apple (renovada todo ano) + US$ 25 da taxa única do Google Play.

Se o app te ajudou a decidir uma compra, considere apoiar:

* **GitHub Sponsors:** [github.com/sponsors/luccas-amorim](https://github.com/sponsors/luccas-amorim)
* **PIX:** [luccas-amorim.github.io/apoie](https://luccas-amorim.github.io/apoie/)

## 🔒 Licença
Distribuído sob a **Licença MIT** — você pode usar, copiar, modificar e redistribuir o código, desde que mantenha o aviso de copyright. Texto completo em [LICENSE](LICENSE).

Copyright (c) 2026 Luccas de Amorim.

## ⚖️ Privacidade
* **Política de Privacidade:** [Clique aqui para ler](https://gist.github.com/luccas-amorim/b2fee294fdd1c734825f064f8cb2cc79)
* Nenhum dado sai do aparelho: histórico e preferências ficam salvos apenas localmente.

---
Desenvolvido por **Luccas de Amorim**.
