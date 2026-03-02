import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, HardHat, AlertTriangle, ClipboardList, TrendingUp, TrendingDown, ShieldAlert, UserX, FileWarning } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/AppLayout";
import { format, subMonths, addDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["hsl(215, 70%, 45%)", "hsl(142, 60%, 40%)", "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)", "hsl(280, 60%, 50%)", "hsl(190, 70%, 45%)"];

const MOTIVO_LABELS: Record<string, string> = {
  entrega_inicial: "Entrega Inicial",
  vencimento: "Vencimento",
  dano_desgaste: "Dano / Desgaste",
  extravio: "Extravio",
  ajuste: "Ajuste",
};

const Dashboard = () => {
  const navigate = useNavigate();
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

  const { data: totalEpis } = useQuery({
    queryKey: ["epis-count"],
    queryFn: async () => {
      const { count } = await supabase.from("epis").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  // All deliveries
  const { data: allEntregas } = useQuery({
    queryKey: ["entregas-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("entregas_epi")
        .select("*, colaboradores(nome_completo), epis(nome_epi)")
        .order("data_entrega", { ascending: false });
      return data ?? [];
    },
  });

  // All EPIs for CA check
  const { data: allEpis } = useQuery({
    queryKey: ["epis-all-ca"],
    queryFn: async () => {
      const { data } = await supabase.from("epis").select("*");
      return data ?? [];
    },
  });

  const today = new Date().toISOString().split("T")[0];
  const in7 = format(addDays(new Date(), 7), "yyyy-MM-dd");
  const in15 = format(addDays(new Date(), 15), "yyyy-MM-dd");
  const in30 = format(addDays(new Date(), 30), "yyyy-MM-dd");

  // Only active deliveries count for alerts/metrics
  const ativas = allEntregas?.filter((e) => e.status === "ativa") ?? [];
  const vencidos = ativas.filter((e) => e.data_vencimento < today);
  const vencendo7 = ativas.filter((e) => e.data_vencimento >= today && e.data_vencimento <= in7);
  const vencendo15 = ativas.filter((e) => e.data_vencimento > in7 && e.data_vencimento <= in15);
  const vencendo30 = ativas.filter((e) => e.data_vencimento > in15 && e.data_vencimento <= in30);

  // Conformidade metrics
  const episVencidosCount = vencidos.length;
  const casCriticos = allEpis?.filter((e) => e.data_validade_ca && e.data_validade_ca <= in30).length ?? 0;
  const colaboradoresIrregulares = new Set(vencidos.map((e) => e.colaborador_id).filter(Boolean)).size;

  // Monthly deliveries chart data (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(new Date(), 5 - i);
    const key = format(month, "yyyy-MM");
    const label = format(month, "MMM", { locale: ptBR });
    const count = allEntregas?.filter((e) => e.data_entrega.startsWith(key)).length ?? 0;
    return { label, count };
  });

  // Top EPIs chart
  const epiCounts: Record<string, number> = {};
  allEntregas?.forEach((e) => {
    const nome = (e.epis as any)?.nome_epi ?? "Outro";
    epiCounts[nome] = (epiCounts[nome] ?? 0) + 1;
  });
  const topEpis = Object.entries(epiCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  // Motivo de troca chart
  const motivoCounts: Record<string, number> = {};
  allEntregas?.forEach((e) => {
    const motivo = e.motivo_entrega ?? "entrega_inicial";
    motivoCounts[motivo] = (motivoCounts[motivo] ?? 0) + 1;
  });
  const motivoData = Object.entries(motivoCounts)
    .map(([key, value]) => ({ name: MOTIVO_LABELS[key] ?? key, value }))
    .sort((a, b) => b.value - a.value);

  // Trend
  const thisMonth = format(new Date(), "yyyy-MM");
  const lastMonth = format(subMonths(new Date(), 1), "yyyy-MM");
  const thisCount = allEntregas?.filter((e) => e.data_entrega.startsWith(thisMonth)).length ?? 0;
  const lastCount = allEntregas?.filter((e) => e.data_entrega.startsWith(lastMonth)).length ?? 0;
  const trendUp = thisCount >= lastCount;

  const stats = [
    { label: "Colaboradores", value: colaboradores ?? 0, icon: Users, color: "text-primary", href: "/colaboradores" },
    { label: "EPIs Cadastrados", value: totalEpis ?? 0, icon: HardHat, color: "text-success", href: "/epis" },
    { label: "Entregas Realizadas", value: totalEntregas ?? 0, icon: ClipboardList, color: "text-primary", href: "/entregas" },
    { label: "EPIs Vencidos", value: vencidos.length, icon: AlertTriangle, color: "text-destructive", href: "/entregas" },
  ];

  const riskCards = [
    {
      label: "EPIs Vencidos",
      value: episVencidosCount,
      icon: ShieldAlert,
      level: episVencidosCount > 0 ? "critical" : "ok",
      description: "Entregas com validade expirada",
    },
    {
      label: "CAs Críticos",
      value: casCriticos,
      icon: FileWarning,
      level: casCriticos > 0 ? (casCriticos >= 3 ? "critical" : "warning") : "ok",
      description: "CAs vencidos ou a vencer em 30 dias",
    },
    {
      label: "Colaboradores Irregulares",
      value: colaboradoresIrregulares,
      icon: UserX,
      level: colaboradoresIrregulares > 0 ? "critical" : "ok",
      description: "Com pelo menos 1 EPI vencido",
    },
  ];

  const levelStyles = {
    critical: "border-destructive/50 bg-destructive/5",
    warning: "border-warning/50 bg-warning/5",
    ok: "border-success/50 bg-success/5",
  };

  const levelTextColor = {
    critical: "text-destructive",
    warning: "text-warning",
    ok: "text-success",
  };

  return (
    <AppLayout title="Dashboard" description="Visão geral da gestão de EPIs">
      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="conformidade">Conformidade & Risco</TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {stats.map((stat) => (
              <Card
                key={stat.label}
                className="shadow-sm cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
                onClick={() => navigate(stat.href)}
              >
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

          {/* Expiration Alerts */}
          {(vencendo7.length > 0 || vencendo15.length > 0 || vencendo30.length > 0) && (
            <div className="flex flex-wrap gap-3 mb-8">
              {vencendo7.length > 0 && (
                <Badge variant="destructive" className="text-sm px-3 py-1.5">
                  🔴 {vencendo7.length} vencendo em 7 dias
                </Badge>
              )}
              {vencendo15.length > 0 && (
                <Badge className="text-sm px-3 py-1.5 bg-warning text-warning-foreground">
                  🟡 {vencendo15.length} vencendo em 15 dias
                </Badge>
              )}
              {vencendo30.length > 0 && (
                <Badge className="text-sm px-3 py-1.5 bg-success text-success-foreground">
                  🟢 {vencendo30.length} vencendo em 30 dias
                </Badge>
              )}
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  Entregas por Mês
                  {trendUp ? (
                    <TrendingUp className="w-4 h-4 text-success" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-destructive" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData}>
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(215, 70%, 45%)" radius={[4, 4, 0, 0]} name="Entregas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">EPIs Mais Entregues</CardTitle>
              </CardHeader>
              <CardContent>
                {topEpis.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">Nenhuma entrega registrada.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={topEpis} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                        {topEpis.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Expired Table */}
          {vencidos.length > 0 && (
            <Card className="border-destructive/30 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h2 className="text-lg font-semibold text-destructive">EPIs Vencidos</h2>
                  <Badge variant="destructive" className="ml-2">{vencidos.length}</Badge>
                </div>
                <div className="rounded-lg border overflow-x-auto">
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
                      {vencidos.map((item) => (
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
        </TabsContent>

        <TabsContent value="conformidade">
          {/* Risk Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {riskCards.map((card) => (
              <Card key={card.label} className={`shadow-sm border-2 ${levelStyles[card.level as keyof typeof levelStyles]}`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{card.label}</p>
                      <p className={`text-3xl font-bold mt-1 ${levelTextColor[card.level as keyof typeof levelTextColor]}`}>
                        {card.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-muted ${levelTextColor[card.level as keyof typeof levelTextColor]}`}>
                      <card.icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Motivos de Troca Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Motivos de Entrega / Troca</CardTitle>
              </CardHeader>
              <CardContent>
                {motivoData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">Nenhuma entrega registrada.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={motivoData} layout="vertical">
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                      <Tooltip />
                      <Bar dataKey="value" name="Quantidade" radius={[0, 4, 4, 0]}>
                        {motivoData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={
                              entry.name === "Dano / Desgaste" || entry.name === "Extravio"
                                ? "hsl(0, 72%, 51%)"
                                : COLORS[i % COLORS.length]
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Distribuição por Motivo</CardTitle>
              </CardHeader>
              <CardContent>
                {motivoData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">Nenhuma entrega registrada.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={motivoData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45}
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                        {motivoData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={
                              entry.name === "Dano / Desgaste" || entry.name === "Extravio"
                                ? "hsl(0, 72%, 51%)"
                                : COLORS[i % COLORS.length]
                            }
                          />
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
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Dashboard;
