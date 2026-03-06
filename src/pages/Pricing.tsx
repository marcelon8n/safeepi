import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, HardHat, ShieldCheck, Building2, Crown, X } from "lucide-react";

const epiPlans = [
  {
    name: "EPI Essencial",
    price: "149",
    icon: ShieldCheck,
    description: "Ideal para empresas com operação interna fixa.",
    features: [
      { text: "Até 50 colaboradores", included: true },
      { text: "Catálogo completo de EPIs", included: true },
      { text: "Alertas de vencimento", included: true },
      { text: "Módulo de Obras", included: false },
    ],
    href: "#",
    highlight: false,
  },
  {
    name: "EPI Pro",
    price: "299",
    icon: Crown,
    description: "Para empresas maiores que buscam compliance total.",
    features: [
      { text: "Colaboradores ilimitados", included: true },
      { text: "Relatórios avançados", included: true },
      { text: "Suporte prioritário", included: true },
      { text: "Módulo de Obras", included: false },
    ],
    href: "#",
    highlight: false,
  },
];

const obrasPlans = [
  {
    name: "Obras Start",
    price: "349",
    icon: Building2,
    description: "Ideal para construtoras e prestadores de serviços.",
    features: [
      { text: "Até 50 colaboradores", included: true },
      { text: "Até 3 obras ativas", included: true },
      { text: "Controle de EPI por canteiro", included: true },
      { text: "Dashboards operacionais", included: true },
    ],
    href: "#",
    highlight: true,
    badge: "Mais Popular",
  },
  {
    name: "Obras Premium",
    price: "599",
    icon: HardHat,
    description: "Operação em escala máxima sem limites.",
    features: [
      { text: "Colaboradores ilimitados", included: true },
      { text: "Obras ilimitadas", included: true },
      { text: "Acesso completo a todas as funcionalidades", included: true },
      { text: "Funcionalidades futuras inclusas", included: true },
    ],
    href: "#",
    highlight: false,
  },
];

const faqs = [
  { q: "O que é o CA (Certificado de Aprovação)?", a: "O CA é um certificado emitido pelo Ministério do Trabalho que atesta que o EPI foi testado e aprovado para proteger o trabalhador. Todo EPI comercializado no Brasil precisa ter um CA válido." },
  { q: "Como funciona o controle de validade dos EPIs?", a: "O sistema calcula automaticamente a data de vencimento de cada EPI entregue com base na periodicidade cadastrada. Você recebe alertas visuais quando um EPI está próximo do vencimento ou já vencido." },
  { q: "Posso trocar de plano a qualquer momento?", a: "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. A diferença de valor será calculada proporcionalmente ao período restante." },
  { q: "Os dados da minha empresa ficam seguros?", a: "Absolutamente. Utilizamos isolamento de dados por empresa, criptografia em trânsito e em repouso, e autenticação segura. Seus dados nunca são compartilhados com outras empresas." },
  { q: "Preciso instalar algum software?", a: "Não. O Safe Solution é 100% online (SaaS). Basta acessar pelo navegador do computador, tablet ou celular. Não é necessário instalar nada." },
  { q: "Qual a diferença entre os planos EPI e Obras?", a: "Os planos da linha EPI são focados exclusivamente no controle de equipamentos de proteção individual, ideais para indústrias e comércios. Já os planos da linha Obras incluem tudo dos planos EPI, mais o módulo completo de gestão de obras com alocação por canteiro." },
];

interface PlanCardProps {
  plan: typeof epiPlans[0];
}

const PlanCard = ({ plan }: PlanCardProps) => (
  <Card
    className={`relative flex flex-col shadow-sm bg-card text-card-foreground ${
      plan.highlight ? "ring-2 ring-primary shadow-lg" : "border-border"
    }`}
  >
    {plan.highlight && "badge" in plan && (plan as any).badge && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <Badge className="bg-primary text-primary-foreground hover:bg-primary whitespace-nowrap">
          {(plan as any).badge}
        </Badge>
      </div>
    )}
    <CardHeader className="text-center pt-8 pb-2">
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
        <plan.icon className="w-6 h-6 text-primary" />
      </div>
      <CardTitle className="text-lg text-primary">{plan.name}</CardTitle>
      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
      <div className="mt-3">
        <span className="text-3xl font-bold text-primary">R$ {plan.price}</span>
        <span className="text-sm text-muted-foreground">/mês</span>
      </div>
    </CardHeader>
    <CardContent className="flex flex-col flex-1 pt-2">
      <ul className="space-y-2.5 flex-1 mb-6">
        {plan.features.map((f) => (
          <li key={f.text} className="flex items-start gap-2 text-sm">
            {f.included ? (
              <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            ) : (
              <X className="w-4 h-4 text-muted-foreground/50 mt-0.5 shrink-0" />
            )}
            <span className={f.included ? "text-foreground" : "text-muted-foreground line-through"}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>
      <a href={plan.href} target="_blank" rel="noopener noreferrer" className="w-full">
        <Button
          className="w-full"
          variant={plan.highlight ? "default" : "outline"}
        >
          Começar agora
        </Button>
      </a>
    </CardContent>
  </Card>
);

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <HardHat className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">Safe Solutions</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/precos" className="text-sm font-medium text-primary hover:underline hidden sm:inline">
              Preços
            </Link>
            <Link to="/auth">
              <Button>Entrar</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">
          Planos que cabem na sua operação
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Escolha entre controle de EPIs ou gestão completa com obras. Todos os planos incluem acesso imediato.
        </p>
      </section>

      {/* Group 1 – EPI */}
      <section className="max-w-5xl mx-auto px-6 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-primary">Foco em Segurança</h2>
            <p className="text-sm text-muted-foreground">Apenas controle de EPIs — ideal para indústrias e comércios</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {epiPlans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>
      </section>

      {/* Separator */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="relative flex items-center">
          <div className="flex-grow border-t border-border" />
          <span className="mx-4 text-sm font-medium text-muted-foreground whitespace-nowrap">ou</span>
          <div className="flex-grow border-t border-border" />
        </div>
      </div>

      {/* Group 2 – Obras */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-primary">Foco Operacional</h2>
            <p className="text-sm text-muted-foreground">EPI + Gestão de Obras — ideal para construtoras e prestadores</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {obrasPlans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-card border-t border-border">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-primary text-center mb-8">
            Perguntas Frequentes
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-primary hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Safe Solutions. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
