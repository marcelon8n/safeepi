import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Activity, AlertTriangle } from "lucide-react";

const AdminDurabilidade = () => {
  const { empresaId } = useEmpresaId();

  const { data, isLoading } = useQuery({
    queryKey: ["epi-durability", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_epi_durability", {
        p_empresa_id: empresaId!,
      });
      if (error) throw error;
      return (data || []).map((d: any) => ({
        epi_nome: d.epi_nome,
        media_dias: Number(d.media_dias),
        total_trocas: Number(d.total_trocas),
      }));
    },
    enabled: !!empresaId,
  });

  const sortedData = data?.sort((a, b) => a.media_dias - b.media_dias) || [];
  const criticalCount = sortedData.filter((d) => d.media_dias < 30).length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">EPIs Analisados</p>
                <p className="text-2xl font-bold text-foreground">{sortedData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`h-8 w-8 ${criticalCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
              <div>
                <p className="text-sm text-muted-foreground">Durabilidade Crítica (&lt;30 dias)</p>
                <p className={`text-2xl font-bold ${criticalCount > 0 ? "text-destructive" : "text-foreground"}`}>{criticalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Média Geral</p>
                <p className="text-2xl font-bold text-foreground">
                  {sortedData.length > 0 ? Math.round(sortedData.reduce((s, d) => s + d.media_dias, 0) / sortedData.length) : 0} dias
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vida Útil Média por EPI (dias)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : sortedData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(300, sortedData.length * 45)}>
              <BarChart data={sortedData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  dataKey="epi_nome"
                  type="category"
                  width={180}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: number, _: any, props: any) => [
                    `${value} dias (${props.payload.total_trocas} trocas)`,
                    "Média",
                  ]}
                  contentStyle={{ borderRadius: 8, fontSize: 13 }}
                />
                <Bar dataKey="media_dias" radius={[0, 4, 4, 0]} maxBarSize={28}>
                  {sortedData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.media_dias < 30 ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12">
              Dados insuficientes. É necessário ter histórico de trocas para calcular a durabilidade.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDurabilidade;
