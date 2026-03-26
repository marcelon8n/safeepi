import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaPlan } from "@/hooks/useEmpresaPlan";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ClipboardList,
  AlertTriangle,
  CalendarClock,
  Lock,
  TrendingUp,
  ShieldCheck,
  FileText,
  FileSpreadsheet,
  Sparkles,
  DollarSign,
  PieChart,
  Download,
} from "lucide-react";
import { format, addDays, isBefore, isAfter, startOfMonth, endOfMonth } from "date-fns";

/** Safely parse a date string (YYYY-MM-DD) avoiding timezone shift */
const safeDate = (d: string) => new Date(d.length === 10 ? `${d}T12:00:00` : d);
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const MOTIVO_LABELS: Record<string, string> = {
  entrega_inicial: "Entrega Inicial",
  vencimento: "Vencimento",
  dano_desgaste: "Dano / Desgaste",
  extravio: "Extravio",
  ajuste: "Ajuste",
};

const PIE_COLORS = [
  "hsl(var(--primary))", // Mantém a sua cor principal (provavelmente azul ou preto)
  "hsl(var(--destructive))", // Mantém o vermelho (ótimo para "perda" ou "dano")
  "#8b5cf6", // Roxo vibrante (Substituiu o cinza claro do --accent)
  "hsl(210 60% 50%)", // Mantém o azul intermediário
  "hsl(40 80% 50%)", // Mantém o tom mostarda/dourado
];

const Relatorios = () => {
  const navigate = useNavigate();
  const { planoSlug, isLoading: planLoading } = useEmpresaPlan();
  const { empresaId } = useEmpresaId();

  const isPro = planoSlug === "epi-pro" || planoSlug === "obras-premium";

  // Month selector for cost analysis
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"));

  // Fetch empresa name for exports
  const { data: empresa } = useQuery({
    queryKey: ["empresa-nome", empresaId],
    queryFn: async () => {
      const { data } = await supabase.from("empresas").select("nome_fantasia").eq("id", empresaId!).maybeSingle();
      return data;
    },
    enabled: !!empresaId,
  });

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const in30Days = addDays(today, 30);

  // ---- Entregas do mês ----
  const { data: entregas, isLoading: loadingEntregas } = useQuery({
    queryKey: ["relatorio-entregas", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entregas_epi")
        .select("*, colaboradores(nome_completo, setores(nome)), epis(nome_epi, custo_estimado)")
        .eq("empresa_id", empresaId!)
        .order("data_entrega", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  // ---- Compliance data (for pro) ----
  const { data: complianceEntregas, isLoading: loadingCompliance } = useQuery({
    queryKey: ["relatorio-compliance", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entregas_epi")
        .select("id, data_entrega, ca_numero_entregue, hash_registro, colaboradores(nome_completo), epis(nome_epi)")
        .eq("empresa_id", empresaId!)
        .order("data_entrega", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId && isPro,
  });

  // ---- KPIs ----
  const kpis = useMemo(() => {
    if (!entregas) return { totalMes: 0, vencidos: 0, aVencer30: 0 };
    const totalMes = entregas.filter((e) => {
      const d = safeDate(e.data_entrega);
      return d >= monthStart && d <= monthEnd;
    }).length;
    const vencidos = entregas.filter(
      (e) => isBefore(safeDate(e.data_vencimento), today) && e.status === "ativa",
    ).length;
    const aVencer30 = entregas.filter((e) => {
      const dv = safeDate(e.data_vencimento);
      return isAfter(dv, today) && isBefore(dv, in30Days) && e.status === "ativa";
    }).length;
    return { totalMes, vencidos, aVencer30 };
  }, [entregas]);

  const formatBRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  // ---- Previsão financeira (pro) com breakdown ----
  type EpiItem = { nome: string; qtd: number; custoUnitario: number; subtotal: number; motivos: string[] };
  type SetorGroup = { setor: string; subtotal: number; epis: EpiItem[] };

  const isFutureMonth = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const now = new Date();
    return y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth() + 1);
  }, [selectedMonth]);

  const { custoTotal, custoBreakdown, custoPorSetor } = useMemo(() => {
    if (!entregas) return { custoTotal: 0, custoBreakdown: [] as EpiItem[], custoPorSetor: [] as SetorGroup[] };

    const [selY, selM] = selectedMonth.split("-").map(Number);
    const selStart = startOfMonth(new Date(selY, selM - 1));
    const selEnd = endOfMonth(new Date(selY, selM - 1));

    const filtered = entregas.filter((e) => {
      if (isFutureMonth) {
        const dv = safeDate(e.data_vencimento);
        return dv >= selStart && dv <= selEnd && e.status === "ativa";
      } else {
        const de = safeDate(e.data_entrega);
        return de >= selStart && de <= selEnd;
      }
    });

    const flatGroups: Record<string, { qtd: number; custoUnitario: number; subtotal: number; motivos: string[] }> = {};
    const setorMap: Record<string, Record<string, { qtd: number; custoUnitario: number; subtotal: number; motivos: string[] }>> = {};
    let total = 0;

    filtered.forEach((e) => {
      const nome = (e as any).epis?.nome_epi ?? "EPI sem nome";
      const custo = Number((e as any).epis?.custo_estimado) || 0;
      const setorNome = (e as any).colaboradores?.setores?.nome ?? "Sem Setor";
      const motivo = isFutureMonth ? "__programada__" : (e.motivo_entrega ?? "entrega_inicial");

      if (!flatGroups[nome]) flatGroups[nome] = { qtd: 0, custoUnitario: custo, subtotal: 0, motivos: [] };
      flatGroups[nome].qtd += 1;
      flatGroups[nome].subtotal += custo;
      flatGroups[nome].motivos.push(motivo);

      if (!setorMap[setorNome]) setorMap[setorNome] = {};
      if (!setorMap[setorNome][nome]) setorMap[setorNome][nome] = { qtd: 0, custoUnitario: custo, subtotal: 0, motivos: [] };
      setorMap[setorNome][nome].qtd += 1;
      setorMap[setorNome][nome].subtotal += custo;
      setorMap[setorNome][nome].motivos.push(motivo);

      total += custo;
    });

    const breakdown = Object.entries(flatGroups)
      .map(([nome, v]) => ({ nome, ...v }))
      .sort((a, b) => b.subtotal - a.subtotal);

    const porSetor: SetorGroup[] = Object.entries(setorMap)
      .map(([setor, episMap]) => {
        const epis = Object.entries(episMap)
          .map(([nome, v]) => ({ nome, ...v }))
          .sort((a, b) => b.subtotal - a.subtotal);
        const subtotal = epis.reduce((s, e) => s + e.subtotal, 0);
        return { setor, subtotal, epis };
      })
      .sort((a, b) => b.subtotal - a.subtotal);

    return { custoTotal: total, custoBreakdown: breakdown, custoPorSetor: porSetor };
  }, [entregas, selectedMonth, isFutureMonth]);

  // ---- Gráfico de motivos ----
  const motivoData = useMemo(() => {
    if (!entregas) return [];
    const counts: Record<string, number> = {};
    entregas.forEach((e) => {
      const m = e.motivo_entrega ?? "entrega_inicial";
      counts[m] = (counts[m] || 0) + 1;
    });
    return Object.entries(counts).map(([key, value]) => ({
      name: MOTIVO_LABELS[key] || key,
      value,
    }));
  }, [entregas]);

  const recentes = entregas?.slice(0, 10) ?? [];
  const isLoading = loadingEntregas || planLoading;

  const empresaNome = empresa?.nome_fantasia ?? "Empresa";

  const handleExportCSV = useCallback(() => {
    const header = "Empresa;Entregues no Mês;Pendentes;Vencidos";
    const row = `${empresaNome};${kpis.totalMes};${kpis.aVencer30};${kpis.vencidos}`;
    const csvContent = "\ufeff" + header + "\n" + row;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-epi-${format(today, "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso!");
  }, [empresaNome, kpis, today]);

  const handleExportPDF = useCallback(() => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Safe Solutions - Relatório de Gestão de EPI", 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(today, "dd/MM/yyyy 'às' HH:mm")}`, 14, 28);

    autoTable(doc, {
      startY: 36,
      head: [["Empresa", "Entregues no Mês", "Pendentes", "Vencidos"]],
      body: [[empresaNome, kpis.totalMes, kpis.aVencer30, kpis.vencidos]],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`relatorio-epi-${format(today, "yyyy-MM-dd")}.pdf`);
    toast.success("PDF exportado com sucesso!");
  }, [empresaNome, kpis, today]);

  const handleExportCustosCSV = useCallback(() => {
    if (custoBreakdown.length === 0) {
      toast.error("Não há dados de previsão de custos para exportar.");
      return;
    }
    const header = "Setor;Nome do EPI;Quantidade para Reposição;Custo Unitário Estimado;Custo Total Sugerido";
    const rows = custoPorSetor.flatMap((s) =>
      s.epis.map(
        (item) =>
          `${s.setor};${item.nome};${item.qtd};${item.custoUnitario.toFixed(2).replace(".", ",")};${item.subtotal.toFixed(2).replace(".", ",")}`,
      ),
    );
    const csvContent = "\ufeff" + header + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `previsao_custos_safe_solutions_${format(today, "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Planilha de custos exportada com sucesso!");
  }, [custoPorSetor, today]);

  return (
    <AppLayout title="Relatórios" description="Visão consolidada de entregas, conformidade e custos.">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">Visão consolidada de entregas, conformidade e custos.</p>
        </div>

        {/* ===== SEÇÃO A: Visão Operacional ===== */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" /> Visão Operacional
          </h2>

          {/* KPI Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <KpiCard
              title="Entregas no Mês"
              value={kpis.totalMes}
              icon={<ClipboardList className="w-5 h-5 text-primary" />}
              loading={isLoading}
            />
            <KpiCard
              title="EPIs Vencidos"
              value={kpis.vencidos}
              icon={<AlertTriangle className="w-5 h-5 text-destructive" />}
              loading={isLoading}
              variant="destructive"
            />
            <KpiCard
              title="A Vencer (30 dias)"
              value={kpis.aVencer30}
              icon={<CalendarClock className="w-5 h-5 text-amber-500" />}
              loading={isLoading}
              variant="warning"
            />
          </div>

          {/* Entregas Recentes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Entregas Recentes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>EPI</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : recentes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhuma entrega encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentes.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{(e as any).colaboradores?.nome_completo ?? "—"}</TableCell>
                        <TableCell>{(e as any).epis?.nome_epi ?? "—"}</TableCell>
                        <TableCell>{format(safeDate(e.data_entrega), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{format(safeDate(e.data_vencimento), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {MOTIVO_LABELS[e.motivo_entrega ?? "entrega_inicial"] ?? e.motivo_entrega}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {/* ===== SEÇÃO B: Relatórios Avançados ===== */}
        <section className="space-y-4 relative">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Relatórios Avançados
            {!isPro && (
              <Badge variant="secondary" className="ml-2 gap-1">
                <Lock className="w-3 h-3" /> Pro
              </Badge>
            )}
          </h2>

          {/* Overlay de bloqueio */}
          {!isPro && !planLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-background/70 backdrop-blur-[2px]">
              <div className="text-center space-y-4 max-w-md px-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Desbloqueie Relatórios Avançados</h3>
                <p className="text-muted-foreground text-sm">
                  Dossiês Jurídicos, Previsão Financeira e Análise de Desperdícios estão disponíveis nos planos Pro e
                  Premium.
                </p>
                <Button onClick={() => navigate("/precos")} size="lg" className="gap-2">
                  <TrendingUp className="w-4 h-4" /> Fazer Upgrade
                </Button>
              </div>
            </div>
          )}

          <div className={!isPro ? "opacity-40 pointer-events-none select-none" : ""}>
            {/* Painel Financeiro */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-primary" /> Previsão de Custos (30 dias)
                    </CardTitle>
                    <CardDescription>Soma do custo estimado dos EPIs que vencem nos próximos 30 dias.</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    disabled={!isPro || custoPorSetor.length === 0}
                    onClick={handleExportCustosCSV}
                  >
                    <Download className="w-4 h-4" /> Exportar Planilha
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-10 w-40" />
                  ) : (
                    <div>
                      <p className="text-3xl font-bold text-primary">{formatBRL(previsaoFinanceira)}</p>
                      {custoPorSetor.length > 0 && (
                        <>
                          <Separator className="my-3" />
                          <ScrollArea className="max-h-[320px]">
                            <Accordion type="multiple" className="w-full">
                              {custoPorSetor.map((s) => (
                                <AccordionItem key={s.setor} value={s.setor} className="border-b-0">
                                  <AccordionTrigger className="py-2 text-sm hover:no-underline">
                                    <div className="flex items-center justify-between w-full mr-2">
                                      <span className="font-semibold">{s.setor}</span>
                                      <Badge variant="secondary" className="ml-2 font-mono text-xs">
                                        {formatBRL(s.subtotal)}
                                      </Badge>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="pb-2 pl-4">
                                    <ul className="space-y-1.5">
                                      {s.epis.map((item) => (
                                        <li key={item.nome} className="flex items-center justify-between text-sm">
                                          <span className="text-muted-foreground truncate mr-2">
                                            {item.nome} <span className="text-xs">({item.qtd}x)</span>
                                          </span>
                                          <span className="font-medium whitespace-nowrap">
                                            {formatBRL(item.subtotal)}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          </ScrollArea>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Gráfico de Motivos */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-primary" /> Consumo por Motivo
                  </CardTitle>
                  <CardDescription>Distribuição das entregas por motivo.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading || motivoData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                      Sem dados suficientes.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <RechartsPie>
                        <Pie
                          data={motivoData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {motivoData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPie>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Dossiê de Compliance */}
            <Card className="mt-4">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" /> Dossiê de Compliance
                  </CardTitle>
                  <CardDescription>Rastreabilidade jurídica das entregas com CA e hash de registro.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" disabled={!isPro} onClick={handleExportCSV}>
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> CSV
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" disabled={!isPro} onClick={handleExportPDF}>
                    <FileText className="w-4 h-4 text-destructive" /> PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>EPI</TableHead>
                      <TableHead>CA Entregue</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Hash</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isPro && loadingCompliance ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-20" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : isPro && complianceEntregas && complianceEntregas.length > 0 ? (
                      complianceEntregas.slice(0, 20).map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">
                            {(e as any).colaboradores?.nome_completo ?? "—"}
                          </TableCell>
                          <TableCell>{(e as any).epis?.nome_epi ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{e.ca_numero_entregue ?? "—"}</Badge>
                          </TableCell>
                          <TableCell>{format(safeDate(e.data_entrega), "dd/MM/yyyy")}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {e.hash_registro ? `${e.hash_registro.slice(0, 4)}...${e.hash_registro.slice(-4)}` : "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Sem dados de compliance.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

// ---- Sub-component ----
function KpiCard({
  title,
  value,
  icon,
  loading,
  variant,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  loading: boolean;
  variant?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-muted flex items-center justify-center">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="h-7 w-12 mt-1" />
          ) : (
            <p
              className={`text-2xl font-bold ${variant === "destructive" ? "text-destructive" : variant === "warning" ? "text-amber-500" : ""}`}
            >
              {value}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default Relatorios;
