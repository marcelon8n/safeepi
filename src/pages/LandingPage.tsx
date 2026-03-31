import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Fingerprint,
  TrendingDown,
  BellRing,
  FileCheck2,
  Lock,
  ChevronRight,
  Building2,
  Factory,
  Wrench,
  HardHat,
} from "lucide-react";
import dashboardMockup from "@/assets/dashboard-mockup.jpg";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">
              Safe<span className="text-secondary">EPI</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/precos">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                Planos e Preços
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Entrar</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-secondary/[0.05]" />
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Copy */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/5 px-4 py-1.5 text-xs font-medium text-secondary mb-6">
                <Lock className="w-3.5 h-3.5" />
                Conformidade NR-6 garantida
              </div>
              <h1 className="text-4xl md:text-[2.75rem] lg:text-5xl font-extrabold text-foreground leading-[1.15] tracking-tight">
                Blinde sua empresa contra{" "}
                <span className="text-secondary">processos trabalhistas</span> da NR&nbsp;6
              </h1>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
                Elimine planilhas, reduza custos com EPIs e tenha respaldo jurídico
                com assinatura eletrônica em cada entrega.{" "}
                <span className="font-medium text-foreground">
                  Tudo em uma plataforma feita para o SESMT.
                </span>
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/auth">
                  <Button size="lg" className="text-base px-7 gap-2">
                    Testar Grátis por 15 dias
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/precos">
                  <Button variant="outline" size="lg" className="text-base px-7">
                    Ver Planos
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Sem cartão de crédito · Cancele quando quiser
              </p>
            </div>

            {/* Right — Mockup */}
            <div className="relative">
              <div className="rounded-xl border border-border shadow-2xl shadow-primary/10 overflow-hidden bg-card">
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-muted/60 border-b border-border">
                  <span className="w-3 h-3 rounded-full bg-destructive/60" />
                  <span className="w-3 h-3 rounded-full bg-warning/60" />
                  <span className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <img
                  src={dashboardMockup}
                  alt="Painel de gestão de EPIs do SafeEPI mostrando métricas, gráficos e tabela de entregas"
                  width={1280}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="border-y border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <p className="text-center text-sm font-medium text-muted-foreground mb-6 tracking-wide uppercase">
            Confiado por empresas de engenharia, indústria e serviços
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {[
              { icon: Building2, label: "Construtoras" },
              { icon: Factory, label: "Indústrias" },
              { icon: Wrench, label: "Manutenção" },
              { icon: HardHat, label: "Obras Civis" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 text-muted-foreground/70"
              >
                <s.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            Diferenciais que protegem seu negócio
          </h2>
          <p className="mt-3 text-muted-foreground">
            Cada recurso foi pensado para blindar juridicamente sua operação e
            reduzir custos com EPIs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Fingerprint,
              title: "Assinatura Eletrônica",
              desc: "Cada entrega é validada com PIN do colaborador, captura de IP, dispositivo e Hash SHA-256 — respaldo jurídico completo.",
              highlight: true,
            },
            {
              icon: TrendingDown,
              title: "Redução de Custos",
              desc: "Relatórios de consumo mensal por setor e projeções de custo. Identifique desperdícios e negocie melhor com fornecedores.",
              highlight: false,
            },
            {
              icon: BellRing,
              title: "Alertas Automatizados",
              desc: "Notificações de vencimento de EPIs e CAs com antecedência configurável. Nunca mais perca um prazo da NR-6.",
              highlight: false,
            },
          ].map((f) => (
            <div
              key={f.title}
              className={`group rounded-2xl border p-8 transition-all duration-200 ${
                f.highlight
                  ? "border-secondary/30 bg-secondary/[0.04] shadow-lg shadow-secondary/5"
                  : "border-border bg-card hover:border-secondary/20 hover:shadow-md"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                  f.highlight
                    ? "bg-secondary/15 text-secondary"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Secondary features row */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {[
            {
              icon: FileCheck2,
              title: "Ficha Individual de EPI",
              desc: "Geração automática de PDF com histórico completo do colaborador, pronto para fiscalização.",
            },
            {
              icon: ShieldCheck,
              title: "Multi-empresa Seguro",
              desc: "Dados isolados por empresa com RLS no Supabase. Segurança de nível bancário.",
            },
            {
              icon: Lock,
              title: "Auditoria Completa",
              desc: "Log de cada ação do sistema com nome do usuário, data, hora e IP. Rastreabilidade total.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="flex gap-4 rounded-xl border border-border bg-card p-6 hover:shadow-sm transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <f.icon className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-primary">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-3">
            Pronto para blindar sua gestão de EPIs?
          </h2>
          <p className="text-primary-foreground/70 mb-8 max-w-lg mx-auto">
            Crie sua conta em segundos, importe seus colaboradores e comece a
            registrar entregas com assinatura eletrônica hoje mesmo.
          </p>
          <Link to="/auth">
            <Button
              size="lg"
              variant="secondary"
              className="text-base px-8 gap-2"
            >
              Começar Agora — É Grátis
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Safe Solutions. Todos os direitos
          reservados.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
