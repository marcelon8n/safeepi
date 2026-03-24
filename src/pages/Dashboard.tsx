import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { ShieldAlert, ShieldCheck, AlertTriangle, Clock, CheckCircle2, Users, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import AppLayout from "@/components/AppLayout";
import DashboardDetailModal from "@/components/dashboard/DashboardDetailModal";
import { format, differenceInDays } from "date-fns";

import { ptBR } from "date-fns/locale";

const Dashboard = () => {
  const navigate = useNavigate();
  const { empresaId } = useEmpresaId();
  const today = new Date().toISOString().split("T")[0];
  const [modalVencidos, setModalVencidos] = useState(false);
  const [modalProximos, setModalProximos] = useState(false);

  // Compute KPIs from existing tables/views
  const { data: resumo, isLoading: loadingResumo } = useQuery({
    queryKey: ["dashboard-resumo", empresaId],
    queryFn: async () => {
      const [colabRes, vencidosRes, vencendoRes, conformidadeRes] = await Promise.all([
        supabase.from("colaboradores").select("*", { count: "exact", head: true }).eq("status", "ativo"),
        supabase.from("vw_epis_vencidos").select("*", { count: "exact", head: true }),
        supabase.from("vw_epis_vencendo_7_dias").select("*", { count: "exact", head: true }),
        supabase.from("view_dashboard_conformidade").select("*").maybeSingle(),
      ]);
      return {
        total_colaboradores_ativos: colabRes.count ?? 0,
        total_epis_vencidos: vencidosRes.count ?? 0,
        total_epis_vencendo_7_dias: vencendoRes.count ?? 0,
        total_obras_ativas: 0,
        total_pendencias_compliance: conformidadeRes.data?.colaboradores_irregulares ?? 0,
      };
    },
    enabled: !!empresaId,
  });

  // Detail views for modals (lazy-loaded on click)
  const { data: episVencidosView, isLoading: loadingVencidosView } = useQuery({
    queryKey: ["vw-epis-vencidos", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("vw_epis_vencidos").select("*");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!empresaId && modalVencidos,
  });

  const { data: vencendo7dias, isLoading: loading7dias } = useQuery({
    queryKey: ["vw-epis-vencendo-7-dias", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("vw_epis_vencendo_7_dias").select("*");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!empresaId && modalProximos,
  });

  // Priority list for table
  const { data: alertasVencimento } = useQuery({
    queryKey: ["v-alertas-vencimento", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_alertas_vencimento")
        .select("*")
        .eq("status_troca", "pendente");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!empresaId,
  });

  const { data: vencendo7diasTable } = useQuery({
    queryKey: ["vw-epis-vencendo-7-dias-table", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("vw_epis_vencendo_7_dias").select("*");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!empresaId,
  });

  const totalVencidos = resumo?.total_epis_vencidos ?? 0;
  const totalVencendo = resumo?.total_epis_vencendo_7_dias ?? 0;
  const totalColaboradores = resumo?.total_colaboradores_ativos ?? 0;
  const totalObras = resumo?.total_obras_ativas ?? 0;
  const totalPendencias = resumo?.total_pendencias_compliance ?? 0;

  // Índice de segurança based on resumo
  const indiceSeg = totalColaboradores > 0
    ? Math.max(0, Math.round(((totalColaboradores - totalPendencias) / totalColaboradores) * 100))
    : 100;

  // Priority list
  const episVencidos = alertasVencimento?.filter((a) => a.data_vencimento && a.data_vencimento < today) ?? [];
  const prioridades = [
    ...episVencidos.map((e) => ({ ...e, tipo: "vencido" as const })),
    ...(vencendo7diasTable ?? []).map((e) => ({ ...e, tipo: "vencendo" as const })),
  ].sort((a, b) => {
    const da = a.data_vencimento ?? "9999-12-31";
    const db = b.data_vencimento ?? "9999-12-31";
    return da.localeCompare(db);
  });

  const isLoading = loadingResumo;
  const allClear = totalVencidos === 0 && totalVencendo === 0;

  return (
    <AppLayout title="Dashboard" description="Visão executiva de risco e conformidade">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Painel de Conformidade</h2>
        <p className="text-sm text-muted-foreground mt-1">Monitore os riscos de segurança da sua empresa em tempo real</p>
      </div>

      {/* KPI Cards - Main Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <Card
          className="border-2 border-destructive/40 bg-destructive/5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setModalVencidos(true)}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">EPIs Vencidos</p>
                <p className="text-4xl font-bold mt-1 text-destructive">
                  {isLoading ? <Skeleton className="h-10 w-16 inline-block" /> : totalVencidos}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Clique para ver detalhes</p>
              </div>
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
                <ShieldAlert className="w-7 h-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-2 border-warning/40 bg-warning/5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setModalProximos(true)}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Trocas Próximas (7 dias)</p>
                <p className="text-4xl font-bold mt-1 text-warning">
                  {isLoading ? <Skeleton className="h-10 w-16 inline-block" /> : totalVencendo}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Clique para ver detalhes</p>
              </div>
              <div className="p-3 rounded-xl bg-warning/10 text-warning">
                <Clock className="w-7 h-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-success/40 bg-success/5 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Índice de Segurança</p>
                <p className="text-4xl font-bold mt-1 text-success">
                  {isLoading ? <Skeleton className="h-10 w-16 inline-block" /> : `${indiceSeg}%`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalColaboradores} colaboradores ativos
                </p>
              </div>
              <div className="p-3 rounded-xl bg-success/10 text-success">
                <ShieldCheck className="w-7 h-7" />
              </div>
            </div>
            {!isLoading && <Progress value={indiceSeg} className="mt-3 h-2" />}
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-5 mb-8">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Colaboradores Ativos</p>
              <p className="text-2xl font-bold">{isLoading ? "—" : totalColaboradores}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Obras Ativas</p>
              <p className="text-2xl font-bold">{isLoading ? "—" : totalObras}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Table */}
      {isLoading ? (
        <Card className="shadow-sm">
          <CardContent className="p-10 text-center text-muted-foreground">
            Carregando dados de conformidade...
          </CardContent>
        </Card>
      ) : allClear ? (
        <Card className="shadow-sm border-success/30">
          <CardContent className="p-10 flex flex-col items-center justify-center text-center gap-3">
            <div className="p-4 rounded-full bg-success/10">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Sua empresa está 100% segura hoje! ✅</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Nenhum EPI vencido ou próximo do vencimento. Continue acompanhando para manter a conformidade.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Prioridades de Troca
                <Badge variant="outline" className="ml-1">{prioridades.length}</Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>EPI</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prioridades.slice(0, 20).map((item, idx) => {
                    const vencDate = item.data_vencimento ? new Date(item.data_vencimento + "T00:00:00") : null;
                    const dias = vencDate ? differenceInDays(vencDate, new Date()) : 0;
                    const isVencido = dias < 0;

                    return (
                      <TableRow key={`${item.entrega_id}-${idx}`}>
                        <TableCell className="font-medium">{item.colaborador_nome ?? "—"}</TableCell>
                        <TableCell>
                          <div>
                            <span>{item.epi_nome ?? "—"}</span>
                            {item.ca_numero && (
                              <span className="text-xs text-muted-foreground ml-1">(CA: {item.ca_numero})</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {vencDate ? format(vencDate, "dd/MM/yyyy", { locale: ptBR }) : "—"}
                        </TableCell>
                        <TableCell>
                          {isVencido ? (
                            <Badge variant="destructive" className="text-xs">
                              Vencido há {Math.abs(dias)} dias
                            </Badge>
                          ) : (
                            <Badge className="text-xs bg-warning text-warning-foreground">
                              Vence em {dias} dias
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <DashboardDetailModal
        open={modalVencidos}
        onOpenChange={setModalVencidos}
        title="EPIs Vencidos — Troca Pendente"
        data={episVencidosView ?? []}
        isLoading={loadingVencidosView}
        variant="destructive"
      />

      <DashboardDetailModal
        open={modalProximos}
        onOpenChange={setModalProximos}
        title="Trocas Próximas — Vencendo em 7 dias"
        data={vencendo7dias ?? []}
        isLoading={loading7dias}
        variant="warning"
      />
    </AppLayout>
  );
};

export default Dashboard;
