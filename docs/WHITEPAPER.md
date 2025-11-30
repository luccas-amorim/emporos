````markdown
# 📄 Whitepaper: Calculadora de Paridade de Importação

**Versão:** 1.0 (MVP)  
**Data:** 30/11/2025  
**Stack:** React Native (Expo)

---

## 1. Visão Executiva e Valor Estratégico

### O Problema
O consumidor brasileiro enfrenta um dilema constante ao adquirir bens de alto valor (eletrônicos, gadgets, luxo): *"Compro agora parcelado no Brasil ou importo à vista?"*.
A decisão raramente é óbvia. Envolve variáveis complexas: taxa de câmbio volátil, impostos flutuantes (IOF), taxas de serviço (spread) e, crucialmente, o **custo de oportunidade** do dinheiro no tempo (Taxa Selic).

### A Solução
O aplicativo **"Vale Importar?"** não é apenas um comparador de preços. É uma calculadora financeira de **Valor Presente Líquido (VPL)** que automatiza a tomada de decisão. Ele nivela as duas opções de compra para a data presente (t=0), permitindo uma comparação matematicamente justa.

### Modelo de Negócio
1.  **Utilidade Gratuita:** Ferramenta de alta precisão para atrair tráfego qualificado.
2.  **Monetização (Ads/Affiliates):** Integração nativa com parceiros financeiros (Wise, Nomad, Western Union), gerando receita por conversão ou *brand awareness*.

---

## 2. Arquitetura de Dados (Data Flow)

O aplicativo opera numa arquitetura *Serverless-Client*, consumindo dados diretamente de fontes oficiais e governamentais em tempo real, garantindo isenção e precisão.

```mermaid
graph TD
    A[Usuário Abre o App] --> B{Verificações Iniciais}
    B -->|Ano Fiscal| C[Define IOF Automático]
    B -->|API Câmbio| D[Frankfurter API / ECB]
    B -->|API Juros| E[Banco Central do Brasil]
    
    C --> F[Cálculo Tributário]
    D --> G[Cotação Mid-Market]
    E --> H[Taxa SELIC Meta]
    
    F & G & H --> I[Motor de Cálculo Financeiro]
    I --> J[Resultado: Decisão de Compra]
````

### Fontes de Dados

  * **Câmbio (FX):** *Frankfurter API* (Baseada no Banco Central Europeu). Garante taxas comerciais estáveis (fechamento do dia anterior).
  * **Taxa Livre de Risco ($R_f$):** *API do Banco Central do Brasil (Série 432)*. Coleta a Meta Selic oficial.
  * **Legislação:** Lógica interna baseada no Decreto nº 11.153/2022 (Redução gradual do IOF).

-----

## 3\. Modelagem Matemática (O "Core" Financeiro)

A grande inovação do app é tratar a compra parcelada no Brasil como um fluxo de caixa negativo que deve ser descontado a valor presente.

### 3.1. Conversão de Taxas (Equivalência)

A SELIC é divulgada como taxa anual ($i_{aa}$). Para cálculos de parcelamento mensal, realizamos a conversão por juros compostos, não divisão simples.

$$
i_{am} = (1 + i_{aa})^{\frac{1}{12}} - 1
$$

*Onde:*

  * $i_{am}$ = Taxa Selic Mensal Efetiva.
  * $i_{aa}$ = Taxa Selic Anual (via API).

### 3.2. Custo Efetivo da Importação (Spot Price)

O custo de importar é calculado à vista, considerando o "Custo Efetivo Total" (CET) da operação cambial.

$$
Custo_{Ext} = P_{ext} \times [FX \times (1 + S)] \times (1 + IOF_t)
$$

*Onde:*

  * $P_{ext}$: Preço na etiqueta exterior (em USD ou EUR).
  * $FX$: Taxa de Câmbio Comercial.
  * $S$: *Spread* bancário (Taxa de serviço configurável pelo usuário).
  * $IOF_t$: Imposto sobre Operações Financeiras vigente no ano $t$.

### 3.3. Valor Presente da Compra Nacional (VP)

Para a opção Brasil, utilizamos a fórmula do **Valor Presente de uma Anuidade Postecipada** (Série Uniforme de Pagamentos). Isso responde à pergunta: *"Quanto eu precisaria ter hoje investido na Selic para pagar essas parcelas futuras?"*

$$
VP_{BR} = \frac{P_{BR}}{n} \times \left[ \frac{1 - (1 + i_{am})^{-n}}{i_{am}} \right]
$$

*Onde:*

  * $P_{BR}$: Preço total no Brasil.
  * $n$: Número de parcelas.
  * $i_{am}$: Taxa de desconto (Selic Mensal).

-----

## 4\. Inteligência Fiscal (Compliance)

O aplicativo elimina a necessidade de atualizações manuais de código para acompanhar a legislação tributária brasileira.

### Tabela Dinâmica de IOF (Cartão de Crédito)

O algoritmo verifica o ano do dispositivo e aplica a alíquota correta automaticamente:

| Ano Fiscal | Alíquota IOF | Status |
| :--- | :--- | :--- |
| 2024 | **4.38%** | Vigente |
| 2025 | **3.38%** | Programado (Automático no App) |
| 2026 | **2.38%** | Programado |
| 2027 | **1.38%** | Programado |
| 2028+ | **0.00%** | Programado |

*Nota: Para dinheiro em espécie, a taxa é mantida fixa em 1.1% conforme regulação atual.*

-----

## 5\. Exemplo Prático de Simulação

Imagine a compra de um Smartphone em **30/11/2025**.

**Dados de Entrada:**

  * **Brasil:** R$ 5.000,00 em 12x "sem juros".
  * **EUA:** US$ 800,00.
  * **Selic:** 11.25% a.a. ($\approx$ 0.89% a.m.).
  * **Câmbio:** R$ 5,00.
  * **Pagamento:** Cartão (IOF 2025 = 3.38%).
  * **Spread:** 2.0%.

**Processamento:**

1.  **Câmbio Efetivo:** $5,00 \times (1 + 0,02) = R\$ 5,10$.
2.  **Custo Importação:** $800 \times 5,10 \times (1 + 0,0338) = \mathbf{R\$ 4.217,90}$.
3.  **Parcela BR:** $R\$ 416,66$.
4.  **Valor Presente BR:** Trazendo 12 parcelas de R$ 416,66 a valor presente com taxa de 0.89%.
    $$VP_{BR} = 416,66 \times \left[ \frac{1 - (1,0089)^{-12}}{0,0089} \right] \approx \mathbf{R\$ 4.720,00}$$

**Conclusão do Algoritmo:**

  * Diferencial: $R\$ 4.720,00 - R\$ 4.217,90 = R\$ 502,10$.
  * **Resultado:** "✈️ Vale Importar" (Economia real de R$ 502,10).

-----

© 2025 - Documentação Técnica
© 2025 - Desenvolvido por Luccas de Amorim Rêgo Cavicchioli
```
```