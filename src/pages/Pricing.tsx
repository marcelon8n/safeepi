import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, HardHat, Building2, Crown, Users, Shield } from "lucide-react";

const plans = [
  {
    name: "EPI Essencial",
    price: "129",
    icon: Shield,
    features: ["Até 30 colaboradores", "Catálogo de EPIs ilimitado", "Registro de entregas", "Alertas de vencimento", "Dashboard básico", "Sem gestão de obras"],
    href: "#",
    highlight: false,
  },
  {
    name: "EPI Profissional",
    price: "249",
    icon: Users,
    features: ["Até 100 colaboradores", "Catálogo de EPIs ilimitado", "Registro de entregas", "Alertas de vencimento", "Dashboard completo", "Relatórios mensais", "Sem gestão de obras"],
    href: "#",
    highlight: false,
  },
  {
    name: "EPI Corporativo",
    price: "397",
    icon: Crown,
    features: ["Colaboradores ilimitados", "Catálogo de EPIs ilimitado", "Registro de entregas", "Alertas de vencimento", "Dashboard de conformidade", "Relatórios avançados", "Auditoria completa", "Sem gestão de obras"],
    href: "#",
    highlight: true,
    badge: "Ideal para Indústrias",
  },
  {
    name: "Gestão de Obras",
    price: "349",
    icon: Building2,
    features: ["Até 100 colaboradores", "Até 2 obras simultâneas", "Alocação de colaboradores", "Controle por obra", "Dashboard completo", "Relatórios por obra"],
    href: "#",
    highlight: false,
  },
  {
    name: "Gestão Avançada",
    price: "599",
    icon: HardHat,
    features: ["Colaboradores ilimitados", "Obras ilimitadas", "Alocação de colaboradores", "Controle por obra", "Dashboard de conformidade", "Relatórios avançados", "Auditoria completa", "Suporte prioritário"],
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
  { q: "O que acontece se eu ultrapassar o limite de colaboradores?", a: "O sistema avisará que o limite foi atingido. Você poderá fazer upgrade para um plano com mais capacidade sem perder nenhum dado." },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Header */}
      <header className="border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#1e3a5f]">Safe Solution</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/precos" className="text-sm font-medium text-[#1e3a5f] hover:underline hidden sm:inline">
              Preços
            </Link>
            <Link to="/auth">
              <Button className="bg-[#1e3a5f] hover:bg-[#152d4a] text-white">Entrar</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1e3a5f]">
          Planos que cabem na sua operação
        </h1>
        <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
          Escolha o plano ideal para o tamanho da sua equipe. Todos incluem acesso completo ao controle de EPIs.
        </p>
      </section>

      {/* Plans */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col shadow-sm bg-white ${
                plan.highlight
                  ? "ring-2 ring-[#1e3a5f] shadow-lg"
                  : "border-gray-200"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#1e3a5f] text-white hover:bg-[#1e3a5f] whitespace-nowrap">
                    {plan.badge}
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pt-8 pb-2">
                <div className="w-11 h-11 rounded-xl bg-[#1e3a5f]/10 flex items-center justify-center mx-auto mb-3">
                  <plan.icon className="w-6 h-6 text-[#1e3a5f]" />
                </div>
                <CardTitle className="text-lg text-[#1e3a5f]">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-[#1e3a5f]">R$ {plan.price}</span>
                  <span className="text-sm text-gray-500">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 pt-2">
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-[#1e3a5f] mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href={plan.href} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button
                    className={`w-full ${
                      plan.highlight
                        ? "bg-[#1e3a5f] hover:bg-[#152d4a] text-white"
                        : "bg-white text-[#1e3a5f] border border-[#1e3a5f] hover:bg-[#1e3a5f]/5"
                    }`}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    Assinar Plano
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-[#1e3a5f] text-center mb-8">
            Perguntas Frequentes
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-[#1e3a5f] hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Safe Solutions. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
