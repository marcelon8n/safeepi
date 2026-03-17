import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, DollarSign, AlertTriangle, Users, TrendingUp } from "lucide-react";

const AdminOverview = () => {
  const { empresaId } = useEmpresaId();
  const today = new Date().toISOString().split("T")[0];

  const { data: alertas, isLoading: l1 } = useQuery({
    queryKey: ["admin-overview-alertas", empresaId],
    queryFn: async () => {
      const { data } = await supabase
        .from("v_alertas_vencimento")
        .select("*")
        .eq("status_troca", "pendente");
      return data ?? [];
    },
    enabled: !!empresaId,
  });

  const { data: alertas7d, isLoading: l2 } = useQuery({
    queryKey: ["admin-overview-7d", empresaId],
    queryFn: async () => {
      const { data } = await supabase.from("vw_epis_vencendo_7_dias").select("*");
      return data ?? [];
    },
    enabled: !!empresaId,
  });

  const { data: totalColabs, isLoading: l3 } = useQuery({
    queryKey: ["admin-overview-colabs", empresaId],
    queryFn: async () => {
      const { count } = await supabase
        .from("colaboradores")
        .select("*", { count: "exact", head: true })
        .eq("status", "ativo");
      return count ?? 0;
    },
    enabled: !!empresaId,
  });

  const { data: empresa, isLoading: l4 } = useQuery({
    queryKey: ["admin-overview-empresa", empresaId],
    queryFn: async () => {
      const { data } = await supabase
        .from("empresas")
        .select("*, planos(nome, limite_colaboradores)")
        .eq("id", empresaId!)
        .single();
      return data;
    },
    enabled: !!empresaId,
  });

  const { data: epis } = useQuery({
    queryKey: ["admin-overview-epis-custo", empresaId],
    queryFn: async () => {
      const { data } = await supabase
        .from("entregas_epi")
        .select("epi_id, data_vencimento, epis(custo_estimado)")
        .eq("status", "ativa");
      return data ?? [];
    },
    enabled: !!empresaId,
  });

  const isLoading = l1 || l2 || l3 || l4;

  const vencidos = alertas?.filter((a) => a.data_vencimento && a.data_vencimento < today) ?? [];
  const alertasCriticos = vencidos.length + (alertas7d?.length ?? 0);

  // Custo previsto 30 dias
  const in30days = new Date();
  in30days.setDate(in30days.getDate() + 30);
  const in30str = in30days.toISOString().split("T")[0];
  const custoPrevisto = epis
    ?.filter((e) => e.data_vencimento && e.data_vencimento >= today && e.data_vencimento <= in30str)
    .reduce((sum, e) => {
      const custo = (e.epis as any)?.custo_estimado ?? 0;
      return sum + Number(custo);
    }, 0) ?? 0;

  // Índice de conformidade
  const colaboradoresComVencido = new Set(vencidos.map((a) => a.colaborador_id));
  const emDia = Math.max(0, (totalColabs ?? 0) - colaboradoresComVencido.size);
  const indiceConformidade = (totalColabs ?? 0) > 0 ? Math.round((emDia / (totalColabs ?? 1)) * 100) : 100;

  const plano = empresa?.planos as any;
  const limiteColab = plano?.limite_colaboradores ?? 0;
  const usagePercent = limiteColab > 0 ? Math.round(((totalColabs ?? 0) / limiteColab) * 100) : 0;

  const kpis = [
    {
      label: "Índice de Conformidade",
      value: `${indiceConformidade}%`,
      icon: ShieldCheck,
      color: indiceConformidade >= 80 ? "text-success" : indiceConformidade >= 50 ? "text-warning" : "text-destructive",
      bgColor: indiceConformidade >= 80 ? "bg-success/10" : indiceConformidade >= 50 ? "bg-warning/10" : "bg-destructive/10",
    },
    {
      label: "Custo Previsto 30 dias",
      value: `R$ ${custoPrevisto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Alertas Críticos",
      value: String(alertasCriticos),
      icon: AlertTriangle,
      color: alertasCriticos > 0 ? "text-destructive" : "text-success",
      bgColor: alertasCriticos > 0 ? "bg-destructive/10" : "bg-success/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="shadow-sm">
            <CardContent className="p-5">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    <p className="text-3xl font-bold mt-1">{kpi.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${kpi.bgColor} ${kpi.color}`}>
                    <kpi.icon className="w-6 h-6" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage and Plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Colaboradores Ativos</h3>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{totalColabs} de {limiteColab} colaboradores</span>
                  <span className="font-medium">{usagePercent}%</span>
                </div>
                <Progress value={usagePercent} className="h-2" />
                {usagePercent >= 90 && (
                  <p className="text-xs text-warning font-medium">⚠️ Você está próximo do limite do plano.</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Plano Atual</h3>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plano</span>
                  <span className="font-medium">{plano?.nome ?? "Não definido"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium capitalize">{empresa?.status_assinatura ?? "—"}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
