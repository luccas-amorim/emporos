# Lançamento da v3.0 — Vale importar?

Guia dos itens 4a–4d do [ROADMAP](ROADMAP.md) depois do revamp. O que é código já está no repositório; o resto depende das contas nas lojas e de gente de verdade usando o app.

## 1. Ícone

O ícone novo segue a linguagem do revamp: um quadrado de tinta (`#17181a`) com as duas barras do Resultado, verde (Brasil) e azul (importar). É gerado por `node scripts/gerar-icones.js`, sem dependências, e grava em `assets/images/`:

| Arquivo | Tamanho | Uso |
| :--- | :--- | :--- |
| `icon.png` | 1024×1024, sem transparência | iOS e fichas das lojas |
| `android-icon-foreground.png` | 512×512 | ícone adaptativo (marca na zona segura de 66%) |
| `android-icon-background.png` | 512×512 | fundo do adaptativo |
| `android-icon-monochrome.png` | 432×432 | ícone temático do Android 13+ |
| `splash-icon.png` | 1024×1024 | splash, sobre o fundo papel (`#f4f3ef`) |
| `favicon.png` | 48×48 | web |

Para mudar cores ou proporções, edite as constantes no topo do script e rode de novo.

## 2. Capturas das lojas

Seis telas, nesta ordem, metade no tema claro e metade no escuro. Capture num **development build** (`eas build --profile development`) ou no simulador, com dados de exemplo plausíveis. Os números precisam sair da calculadora, nunca montados à mão.

| # | Tela | Tema | Legenda sugerida |
| :--- | :--- | :--- | :--- |
| 1 | Onboarding, passo 1 (recibo) | claro | O preço da etiqueta não é o que você paga. |
| 2 | Comparar com o link lido (linha do produto "do link") | claro | Cole o link. O app preenche o resto. |
| 3 | Resultado "Compre no Brasil." com o recibo | claro | Cada imposto com a regra e a fonte. |
| 4 | Resultado de viagem "Vale importar." com o ponto de virada | escuro | Saiba com que dólar importar passa a valer. |
| 5 | Câmbio: gráfico de 90 dias e insight | escuro | O dólar de hoje contra a média de 90 dias. |
| 6 | Histórico com "1 decisão mudou" | claro | Suas simulações, refeitas com o câmbio de hoje. |

Tamanhos (confira no console de cada loja antes de exportar, porque mudam com novos aparelhos):

- **Google Play:** retrato 9:16, por exemplo 1080×1920; de 2 a 8 capturas.
- **App Store:** o conjunto do iPhone de 6,9" (1320×2868) cobre os tamanhos menores; de 1 a 10 capturas.

Evite moldura de aparelho com relógio e bateria inventados e não mostre preço de concorrente como se fosse oferta. A legenda vai acima da captura, em Geist 600, sobre o fundo papel.

## 3. Textos da ficha (PT-BR)

**Nome:** Vale importar?

**Subtítulo (App Store, até 30 caracteres):** Importar ou comprar no Brasil

**Descrição curta (Google Play, até 80 caracteres):**
Compare o preço lá fora com o do Brasil, com impostos, câmbio e parcelas.

**Texto promocional (App Store, até 170 caracteres):**
Cole o link do produto e veja se vale importar: câmbio com spread, IOF, Imposto de Importação e ICMS, com a regra e a fonte de cada um.

**Palavras-chave (App Store, até 100 caracteres, sem espaço depois da vírgula):**
importar,remessa conforme,imposto,dólar,câmbio,iof,icms,taxa,viagem,compras,cotação,parcelas

**Descrição longa:**

> O preço da etiqueta não é o que você paga. O Vale importar? compara o custo real de trazer um produto de fora com o de comprar parcelado no Brasil, e diz qual sai mais barato.
>
> **Cole o link e compare.** O app lê o nome e o preço da página da loja no próprio celular. Se a loja não deixar, é só digitar.
>
> **Todo número tem origem.** Câmbio com o spread do seu cartão, IOF, Imposto de Importação pelas regras do Remessa Conforme e ICMS do seu estado, cada linha com a regra aplicada e a fonte oficial, conferidas e datadas.
>
> **Parcelas a valor de hoje.** Parcelar sem juros tem valor: o app desconta cada parcela pela Selic e explica a conta em uma frase.
>
> **Ponto de virada.** Saiba com que cotação importar passa a valer a pena e crie um alerta para quando o dólar chegar lá.
>
> **Câmbio com contexto.** Gráfico de 90 dias e a comparação com a média. É comparação com o passado, não previsão.
>
> **Histórico vivo.** Suas simulações são refeitas com o câmbio de hoje, e o app avisa quando uma decisão mudou de lado.
>
> Encomenda ou viagem, com tax free e cota de bagagem. Gratuito, sem anúncios, sem cadastro e sem coletar dados: tudo fica no seu aparelho. Código aberto (MIT).
>
> O Vale importar? é uma ferramenta de estimativa e não constitui recomendação financeira. Confirme as condições reais antes de qualquer compra.

Na ficha da App Store, não mencione doações nem links de apoio (diretriz 3.2). O link para o repositório pode ficar no campo "URL de suporte".

## 4. Privacidade nas lojas

- **URL da política:** o gist citado no ROADMAP. **Atualize o gist com o texto novo de `docs/POLITICA-DE-PRIVACIDADE.md`** (de 04/10/2026, que inclui a leitura do link no aparelho).
- **Google Play, Data Safety:** não coleta dados e não compartilha dados. As requisições à AwesomeAPI, ao BCB e à loja do link não levam dados do usuário; a leitura do link é uma ação iniciada pelo usuário, que espera a visita à loja. Os dados ficam só no aparelho e somem ao desinstalar.
- **App Store, App Privacy:** "Data Not Collected".
- **Notificações:** locais, sem servidor; a permissão é pedida só ao criar o primeiro alerta.

## 5. Teste fechado (Google Play)

Contas pessoais precisam de **12 testadores por 14 dias seguidos** antes da produção. Comece assim que a conta for verificada.

**Convite (para mandar a amigos, grupos de compras e quem já abriu issue):**
> Estou testando o Vale importar?, um app gratuito e de código aberto que diz se vale importar um produto ou comprar no Brasil. Topa usar por duas semanas? Preciso de 12 pessoas no teste do Google Play. É só entrar pelo link, instalar e usar quando for comparar alguma compra. Sugestões e problemas: [link do repositório].

**Roteiro de teste** (peça para cronometrarem; a meta do revamp é o primeiro veredito em menos de 30 s com link e em menos de 60 s sem):

1. Abrir o app pela primeira vez e passar pelo onboarding.
2. Copiar o link de um produto de uma loja de fora, tocar em "Colar" e comparar com o preço de uma loja brasileira.
3. Fazer a mesma comparação digitando os preços, sem link.
4. Trocar para "Viagem" em "Premissas", informar um tax free e comparar.
5. Salvar, abrir o Histórico e conferir o card.
6. Na aba Câmbio, criar um alerta a partir da sugestão e deixar o app fechado por um dia.

**Como medir, sem coletar dados:** notas e comentários na loja, issues dos modelos "bug", "sugestão" e "regra fiscal", e o tempo que cada testador anotar no roteiro.

## 6. Checklist de saída

- [ ] `eas init` (projeto EAS `emporos`) e `eas build -p android --profile production` / `-p ios`.
- [ ] Testar alertas em segundo plano num development build (`BackgroundTask.triggerTaskWorkerForTestingAsync()`).
- [ ] Testar "Colar" em lojas reais (Amazon, Best Buy, uma Shopify, uma loja europeia) no Android e no iOS e anotar quais leem.
- [ ] Conferir contraste e fonte dinâmica até 130% nas seis telas.
- [ ] Capturas, textos e política (gist) atualizados.
- [ ] Teste fechado com 12 pessoas por 14 dias; em paralelo, envio para revisão da Apple.
