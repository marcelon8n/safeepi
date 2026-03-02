
## Correção dos Links dos Cards do Dashboard

**Problema:** Os cards do Dashboard apontam para rotas inexistentes (`/catalogo-epis` e `/registro-entregas`), enquanto as rotas reais são `/epis` e `/entregas`.

**Correção:** Atualizar os `href` no array `stats` em `Dashboard.tsx` (linhas 92-94):

- `"/catalogo-epis"` → `"/epis"`
- `"/registro-entregas"` → `"/entregas"` (ambos os cards)

Alteração em um único arquivo, 3 valores de string.
