import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, HardHat, Building2, CheckCircle2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["hsl(142, 60%, 40%)", "hsl(0, 72%, 51%)"];

const AdminDashboard = () => {
  const today = new Date().toISOString().split("T")[0];

  const { data: totalColaboradores, isLoading: l1 } = useQuery({
    queryKey: ["admin-colab-count"],
    queryFn: async () => {
      const { count } = await supabase.from("colaboradores").select("*", { count: "exact", head: true }).eq("status", "ativo");
      return count ?? 0;
    },
  });

  const { data: totalObras, isLoading: l2 } = useQuery({
    queryKey: ["admin-obras-count"],
    queryFn: async () => {
      const { count } = await supabase.from("colaboradores_obras" as any).select("*", { count: "exact", head: true }).eq("ativo", true);
      return count ?? 0;
    },
  });

  const { data: entregasData, isLoading: l3 } = useQuery({
    queryKey: ["admin-entregas-status"],
    queryFn: async () => {
      const { data } = await supabase.from("entregas_epi").select("data_vencimento");
      return data ?? [];
    },
  });

  const noPrazo = entregasData?.filter((e) => e.data_vencimento >= today).length ?? 0;
  const vencidos = entregasData?.filter((e) => e.data_vencimento < today).length ?? 0;
  const total = noPrazo + vencidos;
  const conformidade = total > 0 ? Math.round((noPrazo / total) * 100) : 100;

  const chartData = [
    { name: "No prazo", value: noPrazo },
    { name: "Vencidos", value: vencidos },
  ];

  const isLoading = l1 || l2 || l3;

  const cards = [
    { label: "Colaboradores Ativos", value: totalColaboradores ?? 0, icon: Users, color: "text-primary" },
    { label: "Obras em Andamento", value: totalObras ?? 0, icon: Building2, color: "text-primary" },
    { label: "Índice de Conformidade", value: `${conformidade}%`, icon: CheckCircle2, color: conformidade >= 80 ? "text-success" : "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cards.map((card) => (
          <Card key={card.label} className="shadow-sm">
            <CardContent className="p-5">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-3xl font-bold mt-1">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-muted ${card.color}`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <HardHat className="w-5 h-5" />
            Status Geral dos EPIs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : total === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">Nenhuma entrega registrada.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
