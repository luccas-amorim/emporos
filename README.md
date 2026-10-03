# ✈️ Vale importar? — Importar ou Comprar no Brasil?

> Uma calculadora de decisão de compra que usa Valor Presente para comparar o custo real de importar um produto com o de comprá-lo no Brasil, inclusive parcelado.

![Status](https://img.shields.io/badge/Status-MVP_Mobile-green) ![License](https://img.shields.io/badge/Licença-MIT-yellow) ![Version](https://img.shields.io/badge/Versão-2.1.0-blue) ![Stack](https://img.shields.io/badge/Tech-React_Native-violet)

> ⚠️ **Aviso:** os resultados são estimativas para comparação e não constituem aconselhamento financeiro, tributário ou de investimento. Câmbio, alíquotas e regras de importação mudam; confirme as condições reais antes de comprar.

## 🎯 O Problema
Comprar no exterior parece barato pelo preço de etiqueta, mas taxas de câmbio, IOF e a falta de parcelamento escondem o custo real. Por outro lado, comprar no Brasil parcelado pode ser vantajoso devido à inflação e custo de oportunidade do dinheiro.

## 💡 A Solução
Esta calculadora não faz apenas conversão de moeda: ela coloca as duas opções de compra na mesma base de comparação, considerando:

* **Matemática Financeira (VP):** Traz as parcelas brasileiras a Valor Presente, descontando o rendimento mensal baseado na **Selic Meta (Banco Central)**.
* **Câmbio Realista:** Cotação comercial em tempo quase real via **AwesomeAPI** (USD, EUR, GBP, JPY, ARS, CLP) + Campo de **Spread Bancário** personalizável (Wise, Nomad, Cartão físico).
* **Tributação de Encomendas:** Cenários **Viagem × Encomenda** — encomendas internacionais incluem Imposto de Importação (Remessa Conforme: 20% até US$ 50, 60% − US$ 20 acima) e ICMS de 20% por dentro, com breakdown transparente de cada custo.
* **IOF por ano:** Identifica o ano corrente e aplica a alíquota de IOF para Cartão prevista no cronograma de redução gradual (4,38% até 0% em 2028), conforme Decreto nº 11.153/2022.
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
```

## 🗺️ Roadmap
O plano de evolução e os próximos passos rumo à publicação estão em **[docs/ROADMAP.md](docs/ROADMAP.md)** — incluindo o que depende de ações externas (contas de developer, beta da Play Store). O histórico do que já foi entregue está no **[CHANGELOG.md](CHANGELOG.md)**.

## 📄 Documentação Técnica
Para detalhes sobre a fórmula de Valor Presente, a tributação de encomendas (Remessa Conforme) e a lógica fiscal, consulte o [Whitepaper Técnico](docs/WHITEPAPER.md).

## 💚 Apoie
O Vale importar? vai ser publicado **de graça** no Google Play e na App Store, sem anúncios e sem compras dentro do app. Para isso, a meta é juntar **cerca de US$ 125**: US$ 99 da conta de desenvolvedor da Apple (renovada todo ano) + US$ 25 da taxa única do Google Play.

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
