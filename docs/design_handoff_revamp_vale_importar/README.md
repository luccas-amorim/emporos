# Handoff: Revamp do "Vale importar?" (v2.2.0 → v3.0)

Repositório alvo: `luccas-amorim/emporos` (Expo / React Native, expo-router, TypeScript).

## Visão geral
Redesign completo: Onboarding, Comparar, Resultado, Histórico e uma nova aba Câmbio (com gráfico e alertas). Objetivos: formulário mais curto (premissas viram chips e um sheet), resultado com muito mais impacto, credibilidade visível (fontes e datas) e três recursos novos — **ponto de virada**, **gráfico de câmbio de 90 dias com insight** e **colar link para preencher o produto**. O plano completo está em `prototipos/Plano de Revamp.dc.html`; este README é a especificação de implementação.

## Sobre os arquivos de design
Os arquivos em `prototipos/` são **referências de design feitas em HTML**: protótipos que mostram a aparência e o comportamento pretendidos, **não código de produção**. A tarefa é **recriar essas telas no app Expo/React Native existente**, seguindo os padrões do repositório (`ThemedText`, `useTema`, `StyleSheet`, `IconSymbol`, hooks e `core/` puros). Abra `prototipos/Vale Importar Redesign.dc.html` no navegador, com `support.js` na mesma pasta: ele mostra todas as telas em iOS claro e em Android escuro.

## Fidelidade
**Alta fidelidade (hifi)** em cores, tipografia, espaçamento, raios e textos. Os mockups são telas de 360×780 pt. Os **valores numéricos dos exemplos são ilustrativos** e não saíram da calculadora: na implementação, todos vêm de `core/calculadora.ts`.

## Regras inegociáveis
1. Manter o `core/` puro e com 100% de testes; cada função nova (ponto de virada, parser de link, insight de câmbio) entra com teste em `__tests__/`.
2. Sem servidor próprio, sem analytics e sem coleta de dados. Tudo roda no aparelho.
3. Fazer uma fase por PR (seção "Fases"). O CI (`.github/workflows/ci.yml`) precisa ficar verde em cada uma.
4. Preservar o histórico salvo no AsyncStorage: migrar sem perder registros.
5. Manter os `accessibilityLabel` existentes. Alvos de toque de 44pt ou mais, contraste de 4,5:1 ou mais, fonte dinâmica até 130% sem cortar valores.
6. Nunca dizer "compre agora": o insight de câmbio é sempre comparativo ("comparação com o passado, não previsão").
7. Nada de pedir doação dentro do app (diretriz 3.2 da Apple).

## Design tokens
Substituir os valores de `constants/theme.ts` mantendo a interface `Paleta` e acrescentar as chaves novas.

| Chave | Claro | Escuro | Uso |
|---|---|---|---|
| background | #f4f3ef | #0e0f10 | fundo das telas |
| card (surface) | #ffffff | #18191b | cards, tab bar |
| surface2 (novo) | #ebeae5 | #232427 | trilho de controle segmentado, botões secundários, caixa do VP |
| text | #17181a | #eeede9 | texto principal |
| textMuted | #4f5155 | #b0b1b4 | texto secundário |
| textSubtle (novo) | #7d7f83 | #7c7e82 | rótulos, metadados |
| border | #e1e0db | #2b2c2f | bordas de 1px (substituem sombras) |
| brasil (novo) | oklch(0.52 0.14 155) ≈ #1f7a4a | oklch(0.78 0.14 155) ≈ #6fcf97 | tudo que significa "comprar no Brasil" |
| brasilSoft | oklch(0.95 0.035 155) ≈ #e3f3e8 | oklch(0.27 0.045 155) ≈ #173323 | fundos desse sentido |
| exterior (novo) | oklch(0.52 0.14 255) ≈ #2f63b8 | oklch(0.78 0.14 255) ≈ #8db8ff | tudo que significa "importar" |
| exteriorSoft | oklch(0.95 0.035 255) ≈ #e6eefb | oklch(0.27 0.045 255) ≈ #172640 | fundos desse sentido |
| warn | oklch(0.52 0.14 65) ≈ #9a5b12 | oklch(0.8 0.14 75) ≈ #f0b45a | offline, cotação velha |
| warnSoft | oklch(0.95 0.035 75) ≈ #f8eedb | oklch(0.28 0.045 75) ≈ #3a2c14 | fundos de aviso |
| action (novo) | #17181a, com texto #f4f3ef | #eeede9, com texto #0e0f10 | botão primário |

Os hex aproximados servem para o RN; se for possível, confira cada um convertendo a partir do oklch. A paleta "Petróleo" (#0f6e56) sai do app.

**Tipografia:** Geist (texto) e Geist Mono (todo valor monetário, cotação e data), licença OFL, carregadas com `expo-font` em `app/_layout.tsx`. Use `fontVariant: ['tabular-nums']` nos números.

| Papel | Tamanho/peso | letter-spacing |
|---|---|---|
| Veredito | 38 / 600, lineHeight 38 | −0.04em (≈ −1.5) |
| Título de aba | 30 / 600 | −0.03em (≈ −0.9) |
| Título de sheet | 22 / 600 | −0.02em |
| Valor grande (card de preço) | Mono 21 / 600 | −0.02em |
| Corpo | 15 / 400–600, lineHeight 1.4 | 0 |
| Secundário | 13 / 400 | 0 |
| Rótulo | 12 / 400, cor textSubtle | 0 |
| Overline | 11 / 600, CAIXA ALTA, letter-spacing 0.08em | — |

**Raios:** 10 (botões pequenos), 12–16 (botão primário, itens), 18–20 (cards), 28 (topo dos sheets), 999 (chips e pills).
**Espaçamento:** múltiplos de 4. Padding horizontal das telas: 16 (abas) ou 20 (Resultado e sheets). Gap entre cards: 10–14. Padding interno dos cards: 14–16.
**Sombras:** nenhuma. Use bordas de 1px na cor `border`.
**Ícones:** trocar todos os emojis por `IconSymbol` (SF Symbols no iOS, Material no Android). O `FlagIcon` fica só no seletor de moeda.

## Navegação
- Abas (`app/(tabs)/_layout.tsx`): **Comparar** (`index.tsx`), **Histórico** (`historico.tsx`) e **Câmbio** (nova, `cambio.tsx`). A tab bar usa fundo `card` e borda superior de 1px. A aba ativa é uma pill `surface2` com texto 12.5/600; as inativas usam `textSubtle`.
- **Resultado** vira uma rota empilhada (`app/resultado.tsx`) e deixa de ficar embaixo do formulário. Recebe o resultado por parâmetro ou por store.
- **Sheets** (bottom sheet, raio superior 28, alça de 40×5 e véu rgba(0,0,0,.45)): Premissas, Fontes, Novo alerta e Ajustes (tema, moeda padrão, ICMS do estado). O chip de tema sai do cabeçalho; por padrão o app segue o sistema.

## Telas
Os números (01–11) correspondem aos rótulos nos protótipos.

### 01 Onboarding (`components/onboarding.tsx`)
Logo de 22×22 com raio 7 na cor `text`, ao lado de "Vale importar?" em 15/600. Título em 34/600: "O preço da etiqueta não é o que você paga." Logo abaixo, um card-recibo: etiqueta US$ → linhas "+ câmbio e spread", "+ IOF 3,5%", "+ Imposto de Importação" e "+ ICMS 20%" (Mono 12.5, textMuted) → divisor → "Na sua porta" (Mono 20/600, cor exterior). Dentro do card, uma caixa brasilSoft: "Parcelado no Brasil, em valor de hoje: R$ X" (valor em cor brasil). Depois, dois itens numerados (01, 02, em Mono e textSubtle). No rodapé: indicador de páginas (ativo 18×6, inativos 6×6), botão primário "Começar" (altura 54, raio 16) e a nota "Gratuito, sem anúncios, sem cadastro." Mantém os 3 passos, com a mesma linguagem visual.

### 02 Comparar (`app/(tabs)/index.tsx`)
1. Cabeçalho: "Comparar" (30/600) à direita da pill de cotação "USD 5,42 · há 3 min" (Mono 11, ponto de 6px em cor brasil; fica warn quando offline ou com cotação velha).
2. Card do link: rótulo "Link do produto", URL em Mono 13.5 com reticências e botão "Colar" (surface2, raio 10). Depois de ler, mostra o divisor e a linha do produto: miniatura 44×44 (raio 11), nome 15/600, "loja · Remessa Conforme" e a pill "do link" (exteriorSoft/exterior).
3. Grade de 2 colunas com os cards de preço. **Lá fora**: valor na moeda, "+ frete". **No Brasil**: valor em R$, "10x de R$ …". Tocar num card abre a edição (moeda, valor, frete / preço, parcelas e o toggle "Sem juros").
4. "Premissas" à esquerda e "Ajustar" à direita (abre o sheet 06). Chips (12.5, padding 7×11, borda) para Cenário, Remessa Conforme, ICMS, pagamento com IOF e spread.
5. Botão primário "Comparar" fixo acima da tab bar. Fica desabilitado (opacidade .35) com a dica "Preencha os dois preços para comparar." enquanto faltarem valores. A validação continua a de `validarFormulario`.

### 06 Sheet de Premissas (substitui `secao-cenario` e `secao-exterior`)
Controles segmentados (trilho surface2 com padding 3; o item ativo é card/600 com raio 10): "Como você compra" (Encomenda/Viagem), "O site está no Remessa Conforme?" (Sim/Não, com explicação da regra embaixo), "ICMS do seu estado" (17%/20%, com nota sobre o Comsefaz), "Pagamento" (Cartão/Espécie, com o IOF de `IOF_ALIQUOTAS`). Em Viagem, os campos de encomenda somem e entram tax free e cota. Stepper de spread (− 2,0% +, botões de 32). "Restaurar padrão" no cabeçalho; "Aplicar" no rodapé. O `botao-opcao.tsx` vira `controle-segmentado.tsx`.

### 07 Comparar · Viagem
Igual à 02, com campo de link vazio (borda tracejada), card do produto, card "Tax free que você recupera" (8%, com nota "O que volta ao bolso, não a alíquota cheia") e chip brasilSoft "Dentro da cota de US$ 1.000" (warnSoft quando passar da cota).

### 03 e 08 Resultado (`resultado-calculo.tsx` → `app/resultado.tsx`)
- Barra superior: "‹ Comparar" (textMuted) e "Compartilhar" (600; usa a lógica de `compartilhar-resultado.tsx`).
- Contexto: "Produto · cenário" (13, textSubtle).
- **Veredito** 38/600: "Compre no Brasil." (cor brasil) ou "Vale importar." (cor exterior). Para empate, usar "Tanto faz." em `text`.
- Frase de apoio em 15: "Parcelado em 10x, sai **R$ X mais barato** que importar, em valor de hoje." / "Comprando na viagem, você economiza **R$ X (Y%)**…".
- Card de barras: duas linhas, cada uma com rótulo e valor em Mono 600 e uma barra de 10px (trilho surface2). A opção mais cara ocupa 100%; a outra, `menor/maior`. Cores: brasil e exterior.
- Recibo "De onde vem o custo de importar" (overline): linhas `rótulo com a regra · pontilhado · valor Mono`. Ordem: produto (moeda × taxa com spread), IOF, II (com a regra aplicada, ex.: "60% − US$ 30"), ICMS por dentro e, em Viagem, o tax free como valor negativo em cor brasil. Vem de `calcularDetalhamento`.
- Caixa surface2 "Por que R$ X?": explica o valor presente em uma frase (quantidade de parcelas, taxa mensal da Selic e o valor de hoje). Só aparece quando há parcelamento.
- Caixa "Ponto de virada" (ver Recursos).
- Rodapé em 11.5 textSubtle: "Regras fiscais de mmm/aaaa · Receita Federal, BCB, Comsefaz · ver fontes" (abre o sheet 09). Mostrar `aviso` / `avisoCota` quando existirem.
- Barra inferior fixa: "Salvar" (secundário) e o primário "Avisar se o dólar cair" (abre o sheet 10 com o alvo sugerido). Em Viagem, o primário é "Compartilhar".
- O leitor de tela anuncia o veredito primeiro.

### 09 Sheet de Fontes
"De onde vêm os números" e "Regras conferidas em dd/mm/aaaa" (de `regras-fiscais.ts`). Lista agrupada: uma linha por item de `FONTES_FISCAIS` (nome 14/500 e norma como link em 12) → grupo com "Câmbio · AwesomeAPI · há N min" e "Selic · BCB, série 432 · X% a.a." → "Achou uma regra desatualizada? Avise no GitHub" (abre o modelo de issue `regra-fiscal`).

### 04 Histórico (`app/(tabs)/historico.tsx`)
Título e o subtítulo "Recalculado com o câmbio de hoje". Ao abrir, recalcula tudo com a cotação atual (ver Histórico vivo). Se algum veredito tiver invertido, mostra no topo o banner exteriorSoft "N decisão(ões) mudou(aram)" com uma frase sobre o caso. Cards (raio 18): nome 15/600, "Cenário · moeda · data" e, à direita, o veredito e a economia em Mono 13 na cor do sentido. Card que mudou: borda de 1.5px na cor do novo veredito, pill "Mudou" e duas colunas "Na época" e "Hoje". Mantém excluir e limpar; tocar abre o Resultado.

### 05 Câmbio (nova aba `app/(tabs)/cambio.tsx`)
- Cabeçalho "Câmbio" e segmentado USD/EUR/GBP (Mono 12).
- Cotação em Mono 42/600, com a linha "−0,8% hoje · comercial · AwesomeAPI" (a variação usa brasil quando cai e warn quando sobe).
- Card do gráfico: "90 dias" e "média X · mín Y" (Mono 11), linha de 2px na cor `text`, média tracejada em textSubtle, ponto final de 4.5 na cor brasil e meses no eixo. Feito com `react-native-svg`.
- Card de insight brasilSoft, com overline "Abaixo da média" (ou "Acima da média" em warnSoft): "O dólar está X% abaixo da média de 90 dias." e "No [última simulação], são ~R$ N a menos que na média. Comparação com o passado, não previsão."
- "Alertas · + Novo" e lista agrupada: "USD abaixo de R$ 5,30", "Falta 2,2%" e um switch na cor brasil. A lógica atual de `alertas-cambio.tsx` / `services/alertas.ts` sai da Home e vem para cá.

### 10 Sheet Novo alerta
"Avisar quando o dólar ficar abaixo de", stepper grande (Mono 34, botões 40×40), linha "hoje X · mín. 90 dias Y" e a sugestão exteriorSoft "Sugestão: R$ N — é o ponto de virada do [produto]…". A nota sobre a verificação em segundo plano repete o comportamento atual (expo-background-task). Botão "Criar alerta".

### 11 Sem conexão / link não lido
A pill de cotação fica warn ("há 2 h"). Banner warnSoft: "Sem conexão. Usando a última cotação salva, de hoje às HH:MM. Puxe a tela para atualizar." Quando não der para ler o link: "Não conseguimos ler o preço desta página. Digite abaixo — o link fica salvo com a simulação." O foco vai para o card "Lá fora", com borda de 1.5px na cor `text`.

## Recursos novos

### Ponto de virada (`core/calculadora.ts`)
O custo de importar é linear na taxa de câmbio: II, IOF, ICMS por dentro e tax free são todos proporcionais ao valor convertido, e a faixa do Remessa Conforme é definida em US$, então não depende da taxa. Daí: `taxaEquilibrio = taxaComSpread × custoBrasilVP ÷ custoExteriorBRL`. Exponha `calcularPontoDeVirada(entrada): number`, com testes para encomenda (com e sem Remessa Conforme), viagem dentro e acima da cota e caso sem parcelamento. Use no Resultado ("Importar passa a valer a pena com o dólar abaixo de R$ X" / "continua valendo até R$ X") e como alvo sugerido no alerta. Se a cota de viagem for ultrapassada, o excedente continua proporcional, mas confira por teste.

### Câmbio de 90 dias (`services/mercado.ts`)
Endpoint diário da AwesomeAPI (ex.: `/json/daily/USD-BRL/90`). **Confira antes se o endpoint e o formato existem.** Cache de um dia por moeda no AsyncStorage, reaproveitado offline. Funções puras em `core/`: `mediaMinMax(serie)` e `desvioDaMedia(atual, media)`, com testes.

### Colar link (`core/parser-produto.ts` + `services/produto.ts`)
O próprio aparelho busca a página e tenta, nesta ordem: JSON-LD `Product.offers.price/priceCurrency` → metas `og:price:amount` / `product:price:amount` / `og:price:currency` → `/products/<handle>.json` (Shopify). O nome sai de `og:title`. Parser puro, testado com HTML de exemplo em fixtures. Se falhar, vai para o estado 11 em silêncio, nunca como um erro bloqueante. Atualize `docs/PRIVACIDADE.md` (a requisição vai do celular direto à loja). Compartilhar a partir do navegador (`expo-share-intent`) fica para depois do lançamento.

### Histórico vivo (`hooks/use-historico-simulacoes.ts`)
Ao focar a aba, recalcula cada simulação com a cotação atual, reaproveitando `montarSimulacao` e o prefill de "Recalcular hoje". Guarda `vereditoOriginal` e compara com o atual; se mudou, marca `mudou: true`. Migre o schema salvo com um campo de versão.

## Estado (resumo)
- Comparar: `produto {nome, url, loja, remessaConforme}`, `precoExterior {moeda, valor, frete}`, `precoBrasil {valor, parcelas, semJuros}`, `premissas {cenario, icms, pagamento, spread, taxFree}` (padrões persistidos), `statusLink: idle|lendo|ok|falhou`.
- Mercado: `cotacoes`, `idadeCotacao`, `offline`, `serie90d[moeda]`, `selic`.
- Resultado: saída de `core` com o `pontoDeVirada` acrescentado.
- Histórico: lista com `vereditoOriginal`, `vereditoAtual`, `mudou`.
- Alertas: o modelo atual, mais `origem?: simulacaoId`.

## Textos
O veredito é uma frase com ponto final. Nada de CAIXA ALTA em botões (só no overline). Verbos concretos: "Comparar", "Salvar", "Avisar se o dólar cair", "Restaurar padrão", "Criar alerta". O aviso legal fica no rodapé do Resultado e em Ajustes. Todo o texto está nos protótipos; use exatamente o que está lá.

## Fases (um PR por fase)
- **A. Fundação visual (cerca de 1 semana):** tokens em `theme.ts`, fontes Geist, troca de emoji por `IconSymbol`, primitivos (`controle-segmentado`, `cartao`, `chip`, `sheet`). Sem mudança de comportamento.
- **B. Comparar e Resultado (cerca de 2 semanas):** telas 02, 03, 06, 07, 08, 09 e 01; ponto de virada no core.
- **C. Aba Câmbio (cerca de 1 semana):** telas 05 e 10, série de 90 dias e insight.
- **D. Histórico vivo (cerca de 1 semana):** tela 04 e migração do histórico salvo.
- **E. Colar link (1 a 2 semanas):** parser, estado 11 e política de privacidade.
- **F. Lançamento:** itens 4a–4d do `docs/ROADMAP.md` (ícone novo, capturas das lojas a partir destas telas, ficha da loja, teste fechado).

Ao terminar cada fase: `npm run lint`, `npx tsc --noEmit` e `npm test` verdes; atualize o `CHANGELOG.md`.

## Assets
Não há imagens finais. As miniaturas de produto nos mockups são placeholders listrados; no app, use a imagem `og:image` do link ou um ícone neutro. Fontes: Geist e Geist Mono (Google Fonts / Vercel, OFL). Ícones: `IconSymbol`, que já existe.

## Arquivos
- `prototipos/Vale Importar Redesign.dc.html`: canvas com as seções 1a (telas 01–05) e 2a (telas 06–11), em iOS claro e Android escuro.
- `prototipos/Telas Vale Importar.dc.html`: telas 01–05 (aceita os props `tema` e `plataforma`).
- `prototipos/Telas Vale Importar Estados.dc.html`: telas 06–11.
- `prototipos/Plano de Revamp.dc.html`: plano de produto (diagnóstico, princípios, riscos e medição).
- `prototipos/support.js`: runtime necessário para abrir os protótipos.
- `PROMPT_CLAUDE_CODE.md`: prompt pronto para colar no Claude Code.
