# ✈️ Vale importar? — Importar ou Comprar no Brasil?

> Uma ferramenta de decisão financeira que utiliza matemática avançada (Valor Presente Líquido) para comparar o custo real de importar produtos versus comprar no Brasil.

![Status](https://img.shields.io/badge/Status-MVP_Mobile-green) ![License](https://img.shields.io/badge/Licença-Proprietária-red) ![Version](https://img.shields.io/badge/Versão-2.0.0-blue) ![Stack](https://img.shields.io/badge/Tech-React_Native-violet)

## 🎯 O Problema
Comprar no exterior parece barato pelo preço de etiqueta, mas taxas de câmbio, IOF e a falta de parcelamento escondem o custo real. Por outro lado, comprar no Brasil parcelado pode ser vantajoso devido à inflação e custo de oportunidade do dinheiro.

## 💡 A Solução
Esta calculadora não faz apenas conversão de moeda. Ela atua como um **Consultor Financeiro Digital Mobile**, considerando:

* **Matemática Financeira (VP):** Traz as parcelas brasileiras a Valor Presente, descontando o rendimento mensal baseado na **Selic Meta (Banco Central)**.
* **Câmbio Realista:** Cotação comercial em tempo quase real via **AwesomeAPI** (USD, EUR, GBP, JPY, ARS, CLP) + Campo de **Spread Bancário** personalizável (Wise, Nomad, Cartão físico).
* **Tributação de Encomendas:** Cenários **Viagem × Encomenda** — encomendas internacionais incluem Imposto de Importação (Remessa Conforme: 20% até US$ 50, 60% − US$ 20 acima) e ICMS de 20% por dentro, com breakdown transparente de cada custo.
* **Inteligência Fiscal (Compliance):** Identifica automaticamente o ano fiscal e aplica a alíquota correta de IOF para Cartão (Redução gradual de 4.38% até 0% em 2028), conforme Decreto nº 11.153/2022.
* **Fallback de Segurança:** Cache local da última cotação real, com idade exibida ao usuário — o app segue funcional offline sem inventar números.
* **Histórico de Simulações:** Persistência local com nome do produto, link, cotação da época, recálculo com taxas atuais e compartilhamento.

## 🛠️ Tecnologias
* **Core:** React Native (Expo SDK 54) + TypeScript estrito, Expo Router.
* **Arquitetura:** lógica financeira pura em `core/` (testada com Jest), consumo de APIs com cache em `services/`, estado persistente em `hooks/`, UI temática (claro/escuro) em `components/` + `constants/theme.ts`.
* **APIs:**
    * *AwesomeAPI* (câmbio comercial, bid/ask em tempo quase real).
    * *Banco Central do Brasil — SGS série 432* (Meta Selic).
* **Monetização:** freemium — USD/EUR gratuitos; demais moedas e alertas na versão completa (compra única, IAP em `services/compras.ts`).

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

## 🔒 Licença e Direitos Autorais

**MITO LICENSE - TODOS OS DIREITOS RESERVADOS**

Copyright (c) 2025 Luccas de Amorim Rêgo Cavicchioli.

* A visualização deste código é permitida para fins educacionais ou de portfólio.
* Qualquer cópia, modificação, redistribuição, uso comercial ou sublicenciamento deste Software, no todo ou em parte, é estritamente **PROIBIDA** sem a permissão expressa e por escrito do autor.
* Para solicitações de uso comercial ou parcerias, entre em contato com o autor.

## ⚖️ Termos e Privacidade

* **Política de Privacidade:** [Clique aqui para ler](https://gist.github.com/amorim-rc/b2fee294fdd1c734825f064f8cb2cc79)
* **Termos de Uso:** O uso deste aplicativo é regido pela licença proprietária incluída neste repositório.

---
Desenvolvido por **Luccas de Amorim Rêgo Cavicchioli**.