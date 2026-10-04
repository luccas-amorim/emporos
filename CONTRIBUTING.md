# Como contribuir com o Empóros

Obrigado pelo interesse! Este guia explica como o projeto está organizado e o que se espera de uma contribuição.

## Nome do projeto e nome do app

- **Empóros** (`emporos`) é o nome do projeto e de tudo que fica no código: pacote, identificadores, chaves de armazenamento, documentação. A origem do nome está em [MITO.md](MITO.md).
- **Vale importar?** é o nome que o usuário vê: título do app, textos da tela, ficha nas lojas e política de privacidade. Ele não aparece em identificadores.

## Rodando o projeto

```bash
npm install
npx expo start      # Expo Go, emulador ou web
npm test            # Jest
npm run lint        # ESLint
npm run typecheck   # TypeScript
```

Todo PR passa pelo CI (lint, tipos, testes e `expo-doctor`). Para adicionar ou atualizar dependências do Expo, use `npx expo install <pacote>` ou `npx expo install --fix`, que escolhem versões compatíveis com o SDK.

## Organização do código

| Pasta | O que vai lá |
| --- | --- |
| `app/` | Telas (Expo Router). Só montam componentes; nada de regra de negócio. |
| `components/` | Componentes visuais. `components/formulario/` tem as seções do formulário da Home. |
| `core/` | Lógica pura e testada: cálculo, formatação, textos. Sem React, sem rede, sem storage. |
| `constants/` | Dados estáveis: moedas, tema e **regras fiscais** (`regras-fiscais.ts`). |
| `hooks/` | Estado das telas e persistência. Funções puras exportadas junto, com testes. |
| `services/` | APIs externas (câmbio, Selic) e armazenamento local (`armazenamento.ts`). |
| `__tests__/` | Testes de tela com a Testing Library. |

## Regras fiscais

Alíquotas mudam por decreto e portaria, sem aviso. Por isso todas ficam em [`constants/regras-fiscais.ts`](constants/regras-fiscais.ts), com a fonte oficial de cada uma e a data da última conferência (`revisadoEm`), que o app mostra junto do resultado. Ao mudar uma regra:

1. confira a norma na fonte oficial (Planalto, Receita Federal, Comsefaz) e cite-a em `FONTES_FISCAIS`;
2. atualize o valor e o `revisadoEm`;
3. ajuste os testes de `core/__tests__/calculadora.test.ts`;
4. registre a mudança no [CHANGELOG](CHANGELOG.md) e na seção 4 do [WHITEPAPER](docs/WHITEPAPER.md).

Achou uma regra desatualizada mas não quer mexer no código? Abra uma issue com o modelo "Regra fiscal desatualizada".

## Convenções

- **Português** nos nomes de variáveis, funções, comentários, commits e documentação.
- **Números:** use `core/formato.ts` (o app não usa `Intl`, cujo suporte varia no Hermes).
- **Armazenamento:** use `CHAVES` e `lerComMigracao` de `services/armazenamento.ts`; nunca escreva uma chave solta.
- **Testes:** lógica nova em `core/` ou `hooks/` vem com teste. Mudança de comportamento na tela, com teste em `__tests__/`.
- **Sem doações dentro do app:** as diretrizes 3.2.1/3.2.2 da Apple não permitem. Links de apoio ficam só no README e no `FUNDING.yml`.

## Branches, commits e PRs

- Branches: `feature/…`, `fix/…`, `refactor/…`, `chore/…`, `docs/…`, `ci/…`.
- Commits no formato `tipo: descrição` (`feat`, `fix`, `refactor`, `chore`, `docs`, `ci`, `test`), em português.
- Um PR por assunto, com o CI verde e uma entrada no CHANGELOG quando muda algo para o usuário.

## Licença

Ao contribuir, você concorda que sua contribuição seja distribuída sob a [Licença MIT](LICENSE) do projeto.
