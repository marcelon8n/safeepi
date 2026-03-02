import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpCircle, ArrowLeft } from "lucide-react";

const Upsell = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <ArrowUpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Módulo Indisponível</h1>
          <p className="text-muted-foreground">
            O módulo de <strong>Gestão de Obras</strong> não está incluído no seu plano atual.
            Faça o upgrade para ter acesso a obras, alocação de colaboradores e muito mais.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/precos">
              <Button className="w-full" size="lg">Ver Planos e Fazer Upgrade</Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Painel
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Upsell;
