import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  trial: "Período de Teste",
  ativa: "Ativa",
  cancelada: "Cancelada",
  inadimplente: "Inadimplente",
};

const AdminAssinatura = () => {
  const { empresaId } = useEmpresaId();

  const { data: empresa, isLoading } = useQuery({
    queryKey: ["admin-empresa-assinatura", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("*, planos(nome, slug, valor_mensal, limite_colaboradores, limite_obras, permite_obras)")
        .eq("id", empresaId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  const plano = empresa?.planos as any;
  const status = empresa?.status_assinatura ?? "trial";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Informações sobre o plano atual e status da assinatura.
      </p>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Plano Atual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Plano</span>
                <span className="font-medium">{plano?.nome ?? "Não definido"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Valor Mensal</span>
                <span className="font-medium">
                  {plano?.valor_mensal ? `R$ ${Number(plano.valor_mensal).toFixed(2)}` : "Gratuito"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Limite de Colaboradores</span>
                <span className="font-medium">{plano?.limite_colaboradores ?? "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Limite de Obras</span>
                <span className="font-medium">{plano?.limite_obras ?? "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Módulo Obras</span>
                <Badge variant={plano?.permite_obras ? "default" : "secondary"}>
                  {plano?.permite_obras ? "Habilitado" : "Desabilitado"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Status da Assinatura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={status === "ativa" ? "default" : status === "trial" ? "secondary" : "destructive"}>
                  {STATUS_LABELS[status] ?? status}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">CNPJ</span>
                <span className="font-medium">{empresa?.cnpj ?? "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Empresa</span>
                <span className="font-medium">{empresa?.nome_fantasia ?? "—"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminAssinatura;
