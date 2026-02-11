

# Plano: Transformar SafeEPI em Micro SaaS de Gestao de EPI

## Visao Geral

O sistema atual e funcional mas opera como uma ferramenta interna simples. Para se tornar um micro SaaS, precisamos adicionar camadas de multi-tenancy real, onboarding, seguranca, e funcionalidades de valor agregado.

---

## 1. Multi-Tenancy Real (Isolamento de Dados por Empresa)

**Problema atual:** As RLS policies usam `true` (qualquer usuario logado ve tudo). Nao ha isolamento por empresa.

**Solucao:**
- Criar um hook `useEmpresaId` que busca o `empresa_id` do usuario logado via tabela `profiles`
- Atualizar as RLS policies de `colaboradores`, `epis`, `entregas_epi` e `empresas` para filtrar por `empresa_id` do usuario autenticado (usando uma funcao `get_user_empresa_id()` SECURITY DEFINER)
- Injetar automaticamente o `empresa_id` em todas as operacoes de INSERT nas paginas de Colaboradores, Catalogo de EPIs e Registro de Entregas
- Filtrar todas as queries SELECT por `empresa_id`

**Migracao SQL necessaria:**
- Criar funcao `get_user_empresa_id()` que retorna o empresa_id do usuario logado
- Substituir as policies permissivas por policies que usam essa funcao

---

## 2. Onboarding de Novas Empresas

**Problema atual:** Ao criar conta, o usuario nao tem empresa vinculada e nao consegue usar o sistema.

**Solucao:**
- Criar uma pagina `/onboarding` que aparece apos o primeiro login quando `empresa_id` e nulo no perfil
- Formulario para cadastrar a empresa (nome fantasia + CNPJ)
- Ao salvar, cria o registro em `empresas` e atualiza o `profiles.empresa_id`
- Redireciona automaticamente para o Dashboard

---

## 3. Seguranca - RLS Policies Corretas

**Migracao SQL para substituir as policies atuais:**

```text
-- Funcao helper
CREATE FUNCTION get_user_empresa_id() RETURNS uuid AS $$
  SELECT empresa_id FROM profiles WHERE user_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Colaboradores: so ve/edita da propria empresa
Policy: empresa_id = get_user_empresa_id()

-- EPIs: idem
-- Entregas: idem
-- Empresas: so ve a propria empresa
```

---

## 4. Dashboard com Graficos e Metricas Avancadas

- Adicionar grafico de entregas por mes (usando Recharts, ja instalado)
- Adicionar grafico de EPIs mais entregues (pizza/barra)
- Card com EPIs proximos do vencimento (proximo 30 dias) alem dos ja vencidos
- Indicador visual de tendencia (subiu/desceu vs mes anterior)

---

## 5. Funcionalidades de Valor para SaaS

### 5a. Notificacoes de Vencimento
- Alerta visual no Dashboard para EPIs vencendo nos proximos 7, 15 e 30 dias
- Badges com contagem por urgencia (vermelho/amarelo/verde)

### 5b. Historico de Entregas por Colaborador
- Na pagina de Colaboradores, botao para ver historico de EPIs recebidos
- Timeline com todas as entregas e status de validade

### 5c. Relatorio / Exportacao
- Botao para exportar a lista de entregas em CSV
- Filtros por periodo, colaborador e tipo de EPI

### 5d. Responsividade Mobile
- Sidebar colapsavel com menu hamburger
- Layout adaptado para telas menores
- Tabelas com scroll horizontal em mobile

---

## 6. Landing Page Publica

- Criar pagina `/` publica (mover dashboard para `/dashboard`)
- Hero section explicando o produto
- Secoes de beneficios, funcionalidades e CTA para criar conta
- Botao "Comecar Gratis" que leva para `/auth`

---

## Sequencia de Implementacao Recomendada

| Ordem | Tarefa | Prioridade |
|-------|--------|------------|
| 1 | Multi-tenancy (hook useEmpresaId + injecao empresa_id) | Critica |
| 2 | RLS policies corretas por empresa_id | Critica |
| 3 | Onboarding de empresa (pagina /onboarding) | Alta |
| 4 | Responsividade mobile (sidebar colapsavel) | Alta |
| 5 | Dashboard com graficos (Recharts) | Media |
| 6 | Alertas de vencimento por faixas (7/15/30 dias) | Media |
| 7 | Historico de entregas por colaborador | Media |
| 8 | Exportacao CSV | Media |
| 9 | Landing page publica | Media |

---

## Detalhes Tecnicos

### Arquivos a criar:
- `src/hooks/useEmpresaId.ts` - Hook para buscar empresa_id do perfil do usuario
- `src/pages/Onboarding.tsx` - Pagina de cadastro de empresa
- `src/pages/LandingPage.tsx` - Pagina publica do produto
- `src/components/MobileSidebar.tsx` - Sidebar responsiva

### Arquivos a modificar:
- `src/pages/Colaboradores.tsx` - Filtrar e injetar empresa_id
- `src/pages/CatalogoEpis.tsx` - Filtrar e injetar empresa_id
- `src/pages/RegistroEntregas.tsx` - Filtrar e injetar empresa_id
- `src/pages/Dashboard.tsx` - Graficos + alertas por faixa
- `src/components/AppLayout.tsx` - Responsividade
- `src/components/AppSidebar.tsx` - Mobile toggle
- `src/App.tsx` - Novas rotas (onboarding, landing)
- `src/components/ProtectedRoute.tsx` - Verificar se tem empresa, redirecionar para onboarding

### Migracoes SQL:
- Criar funcao `get_user_empresa_id()`
- Atualizar RLS de colaboradores, epis, entregas_epi, empresas

