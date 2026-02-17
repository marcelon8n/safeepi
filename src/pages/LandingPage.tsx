import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HardHat, Shield, Users, ClipboardList, BarChart3, Bell } from "lucide-react";

const features = [
{ icon: HardHat, title: "Catálogo de EPIs", desc: "Cadastre todos os equipamentos com CA, periodicidade e controle de validade." },
{ icon: Users, title: "Gestão de Colaboradores", desc: "Organize sua equipe com status, cargos e encarregados." },
{ icon: ClipboardList, title: "Registro de Entregas", desc: "Registre cada entrega com cálculo automático de vencimento." },
{ icon: Bell, title: "Alertas de Vencimento", desc: "Receba avisos visuais de EPIs próximos do vencimento ou vencidos." },
{ icon: BarChart3, title: "Dashboard Inteligente", desc: "Métricas em tempo real com gráficos de entregas e EPIs." },
{ icon: Shield, title: "Multi-empresa Seguro", desc: "Dados isolados por empresa com segurança de nível bancário." }];


const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <HardHat className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Safe Solution</span>
          </div>
          <Link to="/auth">
            <Button>Entrar</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
          Gestão de EPIs<br />
          <span className="text-primary">simples, segura e inteligente</span>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
          Controle entregas, validades e colaboradores em um só lugar. 
          Elimine planilhas e reduza riscos de multas trabalhistas.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link to="/auth">
            <Button size="lg" className="text-base px-8">
              Começar Grátis
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-foreground text-center mb-10">
          Tudo que você precisa para gerenciar EPIs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) =>
          <Card key={f.title} className="shadow-sm">
              <CardContent className="p-6">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary/5 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Pronto para simplificar sua gestão de EPIs?
          </h2>
          <p className="text-muted-foreground mb-8">
            Crie sua conta em segundos e comece a usar hoje mesmo.
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-base px-8">
              Criar Conta Grátis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} SafeEPI. Todos os direitos reservados.
        </div>
      </footer>
    </div>);

};

export default LandingPage;