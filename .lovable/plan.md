

## Página de Preços (Pricing) — Safe Solutions

### Plano de Implementação

**1. Criar `src/pages/Pricing.tsx`**

Página pública com esquema de cores azul marinho/cinza/branco, contendo:

- **Header:** Reutiliza o mesmo padrão visual da LandingPage (logo + botão "Entrar").
- **Seção de Planos:** 5 cards responsivos (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`). Cada card com:
  - Nome do plano, preço, lista de funcionalidades, botão "Assinar Plano" como `<a>` com `href` configurável (para links Asaas futuros, inicialmente `#`).
  - O plano "EPI Corporativo" terá badge "Ideal para Indústrias" e borda/destaque visual diferenciado (ring azul).
- **Seção FAQ:** Accordion (shadcn/ui) com perguntas sobre controle de EPI, ex: "O que é CA?", "Como funciona o controle de validade?", "Posso trocar de plano?", etc.
- **Footer:** Mesmo padrão da LandingPage.

**Dados dos planos (array estático):**

| Plano | Preço | Colaboradores | Obras | Destaque |
|---|---|---|---|---|
| EPI Essencial | R$ 129/mês | Até 30 | Sem obras | — |
| EPI Profissional | R$ 249/mês | Até 100 | Sem obras | — |
| EPI Corporativo | R$ 397/mês | Ilimitados | Sem obras | ✓ |
| Gestão de Obras | R$ 349/mês | Até 100 | Até 2 | — |
| Gestão Avançada | R$ 599/mês | Ilimitados | Ilimitados | — |

**2. Adicionar rota em `src/App.tsx`**

Rota pública `/precos` apontando para o componente `Pricing`.

**3. Adicionar link na LandingPage**

Link "Preços" no header da LandingPage ao lado do botão "Entrar".

### Componentes utilizados
- `Card`, `CardContent`, `CardHeader`, `CardTitle` (shadcn)
- `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` (shadcn)
- `Button` (shadcn)
- `Badge` (shadcn)
- Ícones Lucide: `Check`, `HardHat`, `Building2`, `Crown`

**Cores customizadas via classes Tailwind inline:** `bg-[#1e3a5f]` (azul marinho), `text-white`, `bg-gray-50`, etc., aplicadas na página sem alterar o tema global.

