import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const PlanUsageCard = () => {
  const { empresaId } = useEmpresaId();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["plan-usage", empresaId],
    queryFn: async () => {
      if (!empresaId) return null;

      const { data: empresa } = await supabase
        .from("empresas")
        .select("plano_id, planos(nome, limite_colaboradores)")
        .eq("id", empresaId)
        .maybeSingle();

      const { count } = await supabase
        .from("colaboradores")
        .select("*", { count: "exact", head: true })
        .eq("empresa_id", empresaId)
        .eq("status", "ativo");

      const plano = (empresa as any)?.planos;
      return {
        planoNome: plano?.nome ?? "Sem plano",
        limite: plano?.limite_colaboradores ?? 0,
        ativos: count ?? 0,
      };
    },
    enabled: !!empresaId,
  });

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Uso do Sistema e Limites do Plano</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const limite = data?.limite ?? 0;
  const ativos = data?.ativos ?? 0;
  const percentual = limite > 0 ? Math.min((ativos / limite) * 100, 100) : 0;

  const getColorClass = () => {
    if (percentual >= 90) return "[&>div]:bg-destructive";
    if (percentual >= 70) return "[&>div]:bg-warning";
    return "[&>div]:bg-primary";
  };

  const getStatusText = () => {
    if (percentual >= 90) return { text: "Limite crítico", color: "text-destructive" };
    if (percentual >= 70) return { text: "Atenção ao limite", color: "text-warning" };
    return { text: "Uso saudável", color: "text-primary" };
  };

  const status = getStatusText();
  const showUpgrade = percentual >= 80;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Uso do Sistema e Limites do Plano</CardTitle>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
            Plano: {data?.planoNome}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Uso da Licença: {ativos} de {limite} colaboradores cadastrados
              </p>
              <p className={cn("text-xs font-medium", status.color)}>{status.text}</p>
            </div>
          </div>
          <span className="text-2xl font-bold">{Math.round(percentual)}%</span>
        </div>

        <Progress value={percentual} className={cn("h-3", getColorClass())} />

        {showUpgrade && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <div className="text-sm">
              <p className="font-medium">Você está próximo do limite do seu plano</p>
              <p className="text-xs text-muted-foreground">
                Faça upgrade para continuar adicionando colaboradores sem interrupções.
              </p>
            </div>
            <Button onClick={() => navigate("/upsell")} className="shrink-0">
              <TrendingUp className="w-4 h-4" />
              Fazer Upgrade de Plano
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlanUsageCard;
