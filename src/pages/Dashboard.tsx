import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { ShieldAlert, ShieldCheck, AlertTriangle, Clock, Plus, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import AppLayout from "@/components/AppLayout";
import { format, differenceInDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { ptBR } from "date-fns/locale";

const Dashboard = () => {
  const navigate = useNavigate();
  const { empresaId } = useEmpresaId();
  const today = new Date().toISOString().split("T")[0];

  // EPIs vencidos (from v_alertas_vencimento where data_vencimento < today and status_troca = pendente)
  const { data: alertasVencimento, isLoading: loadingAlertas } = useQuery({
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

  // EPIs vencendo em 7 dias
  const { data: vencendo7dias, isLoading: loading7dias } = useQuery({
    queryKey: ["vw-epis-vencendo-7-dias", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_epis_vencendo_7_dias")
        .select("*");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!empresaId,
  });

  // Total colaboradores ativos
  const { data: totalColaboradores } = useQuery({
    queryKey: ["colaboradores-ativos-count", empresaId],
    queryFn: async () => {
      const { count } = await supabase
        .from("colaboradores")
        .select("*", { count: "exact", head: true })
        .eq("status", "ativo");
      return count ?? 0;
    },
    enabled: !!empresaId,
  });

  // Colaboradores com EPIs em dia (sem nenhuma entrega vencida pendente)
  const episVencidos = alertasVencimento?.filter((a) => a.data_vencimento && a.data_vencimento < today) ?? [];
  const colaboradoresComVencido = new Set(episVencidos.map((e) => e.colaborador_id).filter(Boolean));
  const totalAtivos = totalColaboradores ?? 0;
  const colaboradoresEmDia = Math.max(0, totalAtivos - colaboradoresComVencido.size);
  const indiceSeg = totalAtivos > 0 ? Math.round((colaboradoresEmDia / totalAtivos) * 100) : 100;

  // Priority list: vencidos + vencendo 7 dias, sorted by urgency
  const prioridades = [
    ...episVencidos.map((e) => ({ ...e, tipo: "vencido" as const })),
    ...(vencendo7dias ?? []).map((e) => ({ ...e, tipo: "vencendo" as const })),
  ].sort((a, b) => {
    const da = a.data_vencimento ?? "9999-12-31";
    const db = b.data_vencimento ?? "9999-12-31";
    return da.localeCompare(db);
  });

  const isLoading = loadingAlertas || loading7dias;
  const allClear = episVencidos.length === 0 && (vencendo7dias?.length ?? 0) === 0;

  return (
    <AppLayout title="Dashboard" description="Visão executiva de risco e conformidade">
      {/* Header with CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Painel de Conformidade</h2>
          <p className="text-sm text-muted-foreground mt-1">Monitore os riscos de segurança da sua empresa em tempo real</p>
        </div>
        <Button
          size="lg"
          className="gap-2 shadow-md"
          onClick={() => navigate("/entregas")}
        >
          <Plus className="w-5 h-5" />
          Novo Registro de Entrega
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Card 1 - EPIs Vencidos (Red) */}
        <Card className="border-2 border-destructive/40 bg-destructive/5 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">EPIs Vencidos</p>
                <p className="text-4xl font-bold mt-1 text-destructive">
                  {isLoading ? "—" : episVencidos.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Entregas com troca pendente</p>
              </div>
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
                <ShieldAlert className="w-7 h-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 - Trocas Próximas (Yellow) */}
        <Card className="border-2 border-warning/40 bg-warning/5 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Trocas Próximas (7 dias)</p>
                <p className="text-4xl font-bold mt-1 text-warning">
                  {isLoading ? "—" : vencendo7dias?.length ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">EPIs vencendo em breve</p>
              </div>
              <div className="p-3 rounded-xl bg-warning/10 text-warning">
                <Clock className="w-7 h-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3 - Índice de Segurança (Green) */}
        <Card className="border-2 border-success/40 bg-success/5 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Índice de Segurança</p>
                <p className="text-4xl font-bold mt-1 text-success">
                  {isLoading ? "—" : `${indiceSeg}%`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {colaboradoresEmDia}/{totalAtivos} colaboradores em dia
                </p>
              </div>
              <div className="p-3 rounded-xl bg-success/10 text-success">
                <ShieldCheck className="w-7 h-7" />
              </div>
            </div>
            {!isLoading && (
              <Progress value={indiceSeg} className="mt-3 h-2" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Table or Empty State */}
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
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prioridades.slice(0, 20).map((item, idx) => {
                    const vencDate = item.data_vencimento ? new Date(item.data_vencimento + "T00:00:00") : null;
                    const dias = vencDate ? differenceInDays(vencDate, new Date()) : 0;
                    const isVencido = dias < 0;

                    return (
                      <TableRow key={`${item.entrega_id}-${idx}`}>
                        <TableCell className="font-medium">
                          {item.colaborador_nome ?? "—"}
                        </TableCell>
                        <TableCell>
                          <div>
                            <span>{item.epi_nome ?? "—"}</span>
                            {item.ca_numero && (
                              <span className="text-xs text-muted-foreground ml-1">(CA: {item.ca_numero})</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {vencDate
                            ? format(vencDate, "dd/MM/yyyy", { locale: ptBR })
                            : "—"}
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
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => navigate("/entregas")}
                          >
                            Registrar Troca
                            <ArrowRight className="w-3 h-3" />
                          </Button>
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
    </AppLayout>
  );
};

export default Dashboard;
