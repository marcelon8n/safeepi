import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Blocked = () => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg border-destructive/50">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Acesso Bloqueado</h1>
          <p className="text-muted-foreground">
            Identificamos uma <strong>pendência financeira</strong> na sua assinatura.
            Regularize seu pagamento no Asaas para restaurar o acesso ao sistema.
          </p>
          <p className="text-sm text-muted-foreground">
            Se você acredita que isso é um erro, entre em contato com nosso suporte.
          </p>
          <div className="flex flex-col gap-3">
            <a href="https://www.asaas.com" target="_blank" rel="noopener noreferrer">
              <Button className="w-full" size="lg">Acessar Asaas</Button>
            </a>
            <Button variant="outline" className="w-full gap-2" onClick={signOut}>
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Blocked;
