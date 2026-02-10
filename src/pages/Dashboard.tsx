import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, HardHat, AlertTriangle, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Dashboard = () => {
  const { data: colaboradores } = useQuery({
    queryKey: ["colaboradores-count"],
    queryFn: async () => {
      const { count } = await supabase.from("colaboradores").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: totalEntregas } = useQuery({
    queryKey: ["entregas-count"],
    queryFn: async () => {
      const { count } = await supabase.from("entregas_epi").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: vencidos } = useQuery({
    queryKey: ["vencidos"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("entregas_epi")
        .select("*, colaboradores(nome_completo), epis(nome_epi)")
        .lt("data_vencimento", today)
        .order("data_vencimento", { ascending: true });
      return data ?? [];
    },
  });

  const { data: totalEpis } = useQuery({
    queryKey: ["epis-count"],
    queryFn: async () => {
      const { count } = await supabase.from("epis").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const stats = [
    { label: "Colaboradores", value: colaboradores ?? 0, icon: Users, color: "text-primary" },
    { label: "EPIs Cadastrados", value: totalEpis ?? 0, icon: HardHat, color: "text-success" },
    { label: "Entregas Realizadas", value: totalEntregas ?? 0, icon: ClipboardList, color: "text-primary" },
    { label: "EPIs Vencidos", value: vencidos?.length ?? 0, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <AppLayout title="Dashboard" description="Visão geral da gestão de EPIs">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(vencidos?.length ?? 0) > 0 && (
        <Card className="border-destructive/30 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h2 className="text-lg font-semibold text-destructive">EPIs Vencidos</h2>
              <Badge variant="destructive" className="ml-2">{vencidos?.length}</Badge>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>EPI</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead>Vencimento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vencidos?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {(item.colaboradores as any)?.nome_completo ?? "—"}
                      </TableCell>
                      <TableCell>{(item.epis as any)?.nome_epi ?? "—"}</TableCell>
                      <TableCell>{format(new Date(item.data_entrega), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {format(new Date(item.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
};

export default Dashboard;
