

# Auditoria Geral do SafeEPI - Plano de Melhorias

## Problemas Encontrados

### 1. Seguranca (Banco de Dados)

**1.1 - View `v_alertas_vencimento` com SECURITY DEFINER (ERRO CRITICO)**
A view de alertas de vencimento esta definida como SECURITY DEFINER, o que significa que ela ignora as politicas RLS do usuario que faz a consulta. Isso pode expor dados entre empresas.

- **Correcao:** Recriar a view como SECURITY INVOKER (padrao) para que respeite as RLS do usuario autenticado.

**1.2 - Politica RLS "Permitir_Criar_Empresa_Onboarding" com `true` (ALERTA)**
A tabela `empresas` tem uma politica INSERT com `WITH CHECK (true)`, permitindo que qualquer usuario autenticado insira empresas livremente. Isso e aceitavel porque a funcao `create_empresa_onboarding` (SECURITY DEFINER) ja controla esse fluxo, mas e mais seguro restringir.

- **Correcao:** Alterar a politica para permitir INSERT apenas quando o usuario ainda nao tem empresa vinculada: `WITH CHECK (NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND empresa_id IS NOT NULL))`.

**1.3 - Politicas RLS duplicadas nas tabelas**
As tabelas `colaboradores`, `epis` e `entregas_epi` possuem politicas individuais (SELECT, INSERT, UPDATE, DELETE) **e** uma politica ALL redundante ("Gestao ... Empresa"). Isso nao causa erro, mas e confuso e desnecessario.

- **Correcao:** Remover as politicas ALL duplicadas, mantendo apenas as individuais.

### 2. Frontend

**2.1 - Pagina Auth redireciona direto para `/dashboard` sem verificar empresa**
Na pagina `Auth.tsx` (linha 27), apos login o usuario e redirecionado para `/dashboard`. O `ProtectedRoute` do dashboard ira redirecionar para `/onboarding` se nao tiver empresa, mas isso causa um flash desnecessario.

- **Correcao:** Redirecionar de `Auth.tsx` para `/dashboard` esta ok pois o ProtectedRoute ja cuida do fluxo. Nenhuma alteracao necessaria.

**2.2 - Tabela de membros na pagina Equipe nao mostra o e-mail**
A query de membros busca apenas `id, user_id, nome, created_at` da tabela `profiles`, mas nao e possivel acessar o e-mail do usuario (que esta em `auth.users`). O e-mail seria util para identificar membros.

- **Correcao:** Adicionar uma coluna `email` na tabela `profiles` (populada pelo trigger `handle_new_user`) para que a listagem de membros exiba o e-mail de cada um.

**2.3 - Convites duplicados nao sao verificados**
Na pagina Equipe, e possivel enviar multiplos convites para o mesmo e-mail sem validacao.

- **Correcao:** Adicionar constraint UNIQUE em `(empresa_id, email)` na tabela `convites` para status pendente, ou verificar no frontend antes de inserir.

### 3. Melhorias de UX/Design

**3.1 - Confirmacao antes de excluir registros**
Botoes de exclusao em Colaboradores, Setores, EPIs e Convites executam a acao diretamente sem confirmacao. Isso pode causar exclusoes acidentais.

- **Correcao:** Adicionar um `AlertDialog` de confirmacao antes de cada exclusao.

**3.2 - Loading states inconsistentes**
Algumas paginas (Dashboard) nao mostram estado de carregamento enquanto os dados sao buscados.

- **Correcao:** Adicionar skeleton loaders ou spinners nas paginas que carregam dados.

---

## Resumo das Alteracoes

### Migracao SQL
1. Recriar `v_alertas_vencimento` como SECURITY INVOKER
2. Atualizar politica INSERT de `empresas` para ser mais restritiva
3. Remover politicas RLS duplicadas (ALL) de `colaboradores`, `epis`, `entregas_epi`
4. Adicionar coluna `email` em `profiles` e atualizar o trigger `handle_new_user`
5. Adicionar constraint para evitar convites duplicados

### Alteracoes Frontend
1. Atualizar `Equipe.tsx` para exibir o e-mail dos membros
2. Adicionar `AlertDialog` de confirmacao nos botoes de exclusao em: `Colaboradores.tsx`, `CatalogoEpis.tsx`, `Equipe.tsx`

### Detalhes Tecnicos

**Migracao SQL principal:**
```sql
-- 1. Fix view security
DROP VIEW IF EXISTS v_alertas_vencimento;
CREATE VIEW v_alertas_vencimento AS ... (WITH SECURITY INVOKER);

-- 2. Add email to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 3. Update trigger
CREATE OR REPLACE FUNCTION handle_new_user() ...
  INSERT INTO profiles (user_id, nome, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'nome', NEW.email);

-- 4. Unique constraint on convites
ALTER TABLE convites ADD CONSTRAINT convites_empresa_email_unique 
  UNIQUE (empresa_id, email);

-- 5. Remove duplicate ALL policies
DROP POLICY "Gestao Colaboradores Empresa" ON colaboradores;
DROP POLICY "Gestao EPIs Empresa" ON epis;
DROP POLICY "Gestao Entregas Empresa" ON entregas_epi;
```

**Frontend - AlertDialog pattern:**
Utilizar o componente `AlertDialog` do shadcn/ui ja instalado no projeto para envolver cada acao de exclusao com confirmacao do usuario.

