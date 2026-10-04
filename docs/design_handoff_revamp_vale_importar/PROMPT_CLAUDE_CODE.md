# Prompt para o Claude Code

Cole isto no Claude Code, na raiz do repositório `emporos`, depois de copiar a pasta `design_handoff_revamp_vale_importar/` para `docs/`:

---

Leia `docs/design_handoff_revamp_vale_importar/README.md` por inteiro e abra os protótipos em `prototipos/` como referência visual. Eles são HTML de referência, não código para copiar.

Implemente o revamp **uma fase de cada vez** (A → F), cada fase num branch e num PR próprios. Antes de começar cada fase:
1. Liste os arquivos que vai criar ou alterar e as funções novas do `core/`, com os testes de cada uma.
2. Espere minha confirmação.

Regras: siga as "Regras inegociáveis" do README; mantenha `core/` puro e testado; não acrescente servidor, analytics nem dependência sem justificar; preserve o histórico salvo; ao fim de cada fase, rode `npm run lint`, `npx tsc --noEmit` e `npm test` e atualize o `CHANGELOG.md`.

Comece pela **Fase A (Fundação visual)**.
