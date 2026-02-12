

# Fix: Erro ao cadastrar empresa no Onboarding

## Problema

A politica RLS de INSERT na tabela `empresas` esta configurada como **RESTRICTIVE** (nao permissiva). No PostgreSQL, politicas restritivas funcionam como filtros adicionais -- elas so restringem acesso ja concedido por uma politica permissiva. Como nao existe nenhuma politica permissiva de INSERT na tabela, o acesso e sempre negado, mesmo com `WITH CHECK (true)`.

## Solucao

Executar uma migracao SQL para:

1. Remover a politica restritiva de INSERT atual
2. Recriar como politica **PERMISSIVA** para usuarios autenticados

```text
DROP POLICY "Users can insert empresa during onboarding" ON public.empresas;

CREATE POLICY "Users can insert empresa during onboarding"
  ON public.empresas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

## Detalhes Tecnicos

- Nenhuma alteracao de codigo e necessaria -- o problema e exclusivamente na configuracao RLS do banco
- A politica permite que qualquer usuario autenticado crie uma empresa (necessario para o onboarding)
- As politicas de SELECT e UPDATE continuam restringindo acesso apenas a propria empresa do usuario
- Apos o INSERT, o fluxo do `Onboarding.tsx` atualiza o `profiles.empresa_id`, vinculando o usuario a empresa criada

