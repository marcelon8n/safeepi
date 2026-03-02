

## Correção: Permitir alterar status do Colaborador (Ativo/Inativo)

**Problema:** O formulário de edição do colaborador não inclui o campo `status`, então não há como alterá-lo.

**Solução:** Adicionar um campo `Select` de status no formulário de criação/edição do colaborador.

### Alterações em `src/pages/Colaboradores.tsx`:

1. **Adicionar `status` ao estado do formulário** (linha 180): incluir `status: "ativo"` no objeto inicial.

2. **Incluir `status` no payload de save** (linhas 205-209): enviar `status: form.status` junto com os outros campos.

3. **Preencher `status` ao abrir edição** (linhas 240-244): carregar `c.status ?? "ativo"` no form.

4. **Resetar `status` ao fechar** (linha 251): voltar para `"ativo"`.

5. **Adicionar campo Select no formulário** (após o campo Setor, ~linha 289): um `Select` com opções "Ativo" e "Inativo".

Alteração em um único arquivo, sem mudanças no banco de dados.

