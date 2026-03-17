import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, TrendingUp } from "lucide-react";
import AdminAssinatura from "./AdminAssinatura";

const AdminFinanceiro = () => {
  const { empresaId } = useEmpresaId();
  const today = new Date();

  const { data: entregas, isLoading } = useQuery({
    queryKey: ["admin-financeiro-entregas", empresaId],
    queryFn: async () => {
      const { data } = await supabase
        .from("entregas_epi")
        .select("data_vencimento, epis(custo_estimado, nome_epi)")
        .eq("status", "ativa");
      return data ?? [];
    },
    enabled: !!empresaId,
  });

  // Group costs by month for the next 6 months
  const monthlyData = (() => {
    const months: { name: string; custo: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const startStr = d.toISOString().split("T")[0];
      const endStr = endOfMonth.toISOString().split("T")[0];
      const monthName = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });

      const custo = entregas
        ?.filter((e) => e.data_vencimento >= startStr && e.data_vencimento <= endStr)
        .reduce((sum, e) => sum + Number((e.epis as any)?.custo_estimado ?? 0), 0) ?? 0;

      months.push({ name: monthName, custo: Math.round(custo * 100) / 100 });
    }
    return months;
  })();

  const totalProjetado = monthlyData.reduce((s, m) => s + m.custo, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="shadow-sm">
          <CardContent className="p-5">
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Custo Projetado (6 meses)</p>
                  <p className="text-3xl font-bold mt-1">
                    R$ {totalProjetado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reposições Previstas (6 meses)</p>
                  <p className="text-3xl font-bold mt-1">{entregas?.length ?? 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-warning/10 text-warning">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Projeção de Gastos com Reposição de EPIs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : totalProjetado === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              Nenhum custo estimado cadastrado. Preencha o campo "Custo Estimado" nos EPIs do catálogo.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Custo"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar dataKey="custo" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Existing subscription info */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Assinatura & Faturamento</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminAssinatura />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFinanceiro;
