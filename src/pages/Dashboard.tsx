import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Fingerprint,
  FileWarning,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AppLayout from "@/components/AppLayout";
import DashboardDetailModal from "@/components/dashboard/DashboardDetailModal";
import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const MOTIVO_LABELS: Record<string, string> = {
  entrega_inicial: "Entrega Inicial",
  vencimento: "Vencimento",
  dano_desgaste: "Dano / Desgaste",
  extravio: "Extravio",
  ajuste: "Ajuste",
};

const MOTIVO_COLORS = [
  "hsl(200, 98%, 39%)",
  "hsl(160, 84%, 39%)",
  "hsl(43, 96%, 56%)",
  "hsl(0, 84%, 60%)",
  "hsl(270, 60%, 55%)",
];

const Dashboard = () => {
  const { empresaId } = useEmpresaId();
  const navigate = useNavigate();
  const [modalVencidos, setModalVencidos] = useState(false);
  const [modalProximos, setModalProximos] = useState(false);

  // Fetch all active deliveries with related data
  const { data: entregas, isLoading } = useQuery({
    queryKey: ["dashboard-entregas", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entregas_epi")
        .select("*, epis(nome_epi, ca_numero), colaboradores(nome_completo)")
        .eq("status", "ativa");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!empresaId,
  });

  // Compute all KPIs from the single query
  const kpis = useMemo(() => {
    if (!entregas) return null;

    const hoje = new Date();
    hoje.setHours(12, 0, 0, 0);

    let vencidos = 0;
    let aVencer15 = 0;
    let comHash = 0;
    
    const motivoCounts: Record<string, number> = {};
    const urgentes: Array<{
      id: string;
      colaborador_id: string | null;
      colaborador_nome: string;
      epi_nome: string;
      ca_numero: string;
      data_vencimento: string;
      dias: number;
      isVencido: boolean;
    }> = [];

    entregas.forEach((e: any) => {
      // Date calcs
      if (e.data_vencimento) {
        const venc = new Date(e.data_vencimento + "T12:00:00");
        const dias = differenceInCalendarDays(venc, hoje);

        if (dias < 0) {
          vencidos++;
          urgentes.push({
            id: e.id,
            colaborador_id: e.colaborador_id,
            colaborador_nome: e.colaboradores?.nome_completo ?? "—",
            epi_nome: e.epis?.nome_epi ?? "—",
            ca_numero: e.epis?.ca_numero ?? "",
            data_vencimento: e.data_vencimento,
            dias,
            isVencido: true,
          });
        } else if (dias <= 15) {
          aVencer15++;
          urgentes.push({
            id: e.id,
            colaborador_id: e.colaborador_id,
            colaborador_nome: e.colaboradores?.nome_completo ?? "—",
            epi_nome: e.epis?.nome_epi ?? "—",
            ca_numero: e.epis?.ca_numero ?? "",
            data_vencimento: e.data_vencimento,
            dias,
            isVencido: false,
          });
        }
      }

      // Hash (blindagem jurídica)
      if (e.hash_registro) comHash++;

      // Motivo
      const motivo = e.motivo_entrega ?? "entrega_inicial";
      motivoCounts[motivo] = (motivoCounts[motivo] || 0) + 1;
    });

    const blindagem =
      entregas.length > 0
        ? Math.round((comHash / entregas.length) * 100)
        : 0;

    // Sort urgentes: vencidos first, then by dias ascending
    urgentes.sort((a, b) => {
      if (a.isVencido !== b.isVencido) return a.isVencido ? -1 : 1;
      return a.dias - b.dias;
    });

    const motivoData = Object.entries(motivoCounts).map(([key, value]) => ({
      name: MOTIVO_LABELS[key] || key,
      value,
    }));

    return {
      vencidos,
      aVencer15,
      blindagem,
      
      motivoData,
      urgentes,
      totalEntregas: entregas.length,
    };
  }, [entregas]);

  // Detail modal queries (lazy)
  const { data: episVencidosView, isLoading: loadingVencidosView } = useQuery({
    queryKey: ["vw-epis-vencidos", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_epis_vencidos")
        .select("*");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!empresaId && modalVencidos,
  });

  const { data: vencendo7dias, isLoading: loading7dias } = useQuery({
    queryKey: ["vw-epis-vencendo-7-dias", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_epis_vencendo_7_dias")
        .select("*");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!empresaId && modalProximos,
  });

  const chartConfig = useMemo(() => {
    const cfg: Record<string, { label: string; color: string }> = {};
    (kpis?.motivoData ?? []).forEach((item, i) => {
      cfg[item.name] = {
        label: item.name,
        color: MOTIVO_COLORS[i % MOTIVO_COLORS.length],
      };
    });
    return cfg;
  }, [kpis?.motivoData]);

  const allClear =
    !isLoading && kpis && kpis.vencidos === 0 && kpis.aVencer15 === 0;

  return (
    <AppLayout
      title="Dashboard"
      description="Painel de Controle de Risco — NR 6"
    >
      {/* ───── Alert Cards ───── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Vencidos */}
        <Card
          className="border-l-4 border-l-destructive cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setModalVencidos(true)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                EPIs Vencidos
              </span>
              <ShieldAlert className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-3xl font-bold text-destructive">
              {isLoading ? (
                <Skeleton className="h-9 w-12 inline-block" />
              ) : (
                kpis?.vencidos ?? 0
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Troca imediata
            </p>
          </CardContent>
        </Card>

        {/* A Vencer 15 dias */}
        <Card
          className="border-l-4 border-l-warning cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setModalProximos(true)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                A Vencer (15d)
              </span>
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <p className="text-3xl font-bold text-warning">
              {isLoading ? (
                <Skeleton className="h-9 w-12 inline-block" />
              ) : (
                kpis?.aVencer15 ?? 0
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Próximos 15 dias
            </p>
          </CardContent>
        </Card>

        {/* Blindagem Jurídica */}
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Blindagem Jurídica
              </span>
              <Fingerprint className="w-5 h-5 text-success" />
            </div>
            <p className="text-3xl font-bold text-success">
              {isLoading ? (
                <Skeleton className="h-9 w-12 inline-block" />
              ) : (
                `${kpis?.blindagem ?? 0}%`
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Assinaturas eletrônicas
            </p>
          </CardContent>
        </Card>

        {/* Alerta CA */}
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Alerta de CA
              </span>
              <FileWarning className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-3xl font-bold text-destructive">
              {isLoading ? (
                <Skeleton className="h-9 w-12 inline-block" />
              ) : (
                kpis?.caVencido ?? 0
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              CAs expirados em uso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ───── Middle row: Chart + Summary ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Pie Chart - Motivos de Troca */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Motivos de Substituição de EPI
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Distribuição por motivo de troca
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Skeleton className="h-40 w-40 rounded-full" />
              </div>
            ) : kpis?.motivoData && kpis.motivoData.length > 0 ? (
              <div className="flex flex-col items-center">
                <ChartContainer config={chartConfig} className="h-48 w-full">
                  <PieChart>
                    <Pie
                      data={kpis.motivoData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                    >
                      {kpis.motivoData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={MOTIVO_COLORS[i % MOTIVO_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="flex flex-wrap gap-3 mt-3 justify-center">
                  {kpis.motivoData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-xs">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            MOTIVO_COLORS[i % MOTIVO_COLORS.length],
                        }}
                      />
                      <span className="text-muted-foreground">
                        {item.name}
                      </span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                Nenhuma entrega registrada
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Queue Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  Fila de Ação Imediata
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Colaboradores que precisam de atenção urgente
                </p>
              </div>
              {kpis && kpis.urgentes.length > 0 && (
                <Badge variant="outline">{kpis.urgentes.length}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : allClear ? (
              <div className="p-10 flex flex-col items-center justify-center text-center gap-2">
                <div className="p-3 rounded-full bg-success/10">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  Tudo em dia! ✅
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Nenhum EPI vencido ou próximo do vencimento. Continue
                  acompanhando.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Equipamento</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(kpis?.urgentes ?? []).slice(0, 25).map((item) => {
                      const vencDate = new Date(
                        item.data_vencimento + "T12:00:00"
                      );
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.colaborador_nome}
                          </TableCell>
                          <TableCell>
                            <div>
                              <span>{item.epi_nome}</span>
                              {item.ca_numero && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  (CA: {item.ca_numero})
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(vencDate, "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {item.isVencido ? (
                              <Badge variant="destructive" className="text-xs">
                                Vencido há {Math.abs(item.dias)}d
                              </Badge>
                            ) : (
                              <Badge className="text-xs bg-warning text-warning-foreground">
                                Vence em {item.dias}d
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={() =>
                                navigate("/registro-entregas", {
                                  state: {
                                    colaboradorId: item.colaborador_id,
                                  },
                                })
                              }
                            >
                              Renovar
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Modals */}
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
        title="Trocas Próximas — Vencendo em até 15 dias"
        data={vencendo7dias ?? []}
        isLoading={loading7dias}
        variant="warning"
      />
    </AppLayout>
  );
};

export default Dashboard;
