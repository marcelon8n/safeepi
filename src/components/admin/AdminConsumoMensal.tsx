import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Package, Layers, Printer, ChevronDown, AlertTriangle, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const MESES = [
  { value: "1", label: "Janeiro" }, { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" }, { value: "4", label: "Abril" },
  { value: "5", label: "Maio" }, { value: "6", label: "Junho" },
  { value: "7", label: "Julho" }, { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" }, { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
];

const currentDate = new Date();
const ANOS = Array.from({ length: 5 }, (_, i) => String(currentDate.getFullYear() - i));

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CHART_COLORS = [
  "hsl(200, 98%, 39%)", // secondary blue
  "hsl(160, 60%, 45%)", // emerald
  "hsl(45, 93%, 47%)",  // amber
  "hsl(280, 60%, 55%)", // purple
  "hsl(15, 80%, 55%)",  // coral
  "hsl(190, 70%, 42%)", // teal
  "hsl(340, 65%, 50%)", // rose
  "hsl(100, 50%, 45%)", // lime
];

interface SetorData {
  setorNome: string;
  epis: Record<string, { nomeEpi: string; count: number; custo: number; semPreco: boolean }>;
}

const AdminConsumoMensal = () => {
  const { empresaId } = useEmpresaId();
  const [mes, setMes] = useState(String(currentDate.getMonth() + 1));
  const [ano, setAno] = useState(String(currentDate.getFullYear()));

  const startDate = `${ano}-${mes.padStart(2, "0")}-01`;
  const endMonth = Number(mes) === 12 ? 1 : Number(mes) + 1;
  const endYear = Number(mes) === 12 ? Number(ano) + 1 : Number(ano);
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const { data, isLoading } = useQuery({
    queryKey: ["consumo-mensal-v2", empresaId, mes, ano],
    queryFn: async () => {
      const { data: entregas, error } = await supabase
        .from("entregas_epi")
        .select("id, data_entrega, colaborador_id, epi_id, epis(nome_epi, custo_estimado), colaboradores(nome_completo, setor_id)")
        .eq("empresa_id", empresaId!)
        .gte("data_entrega", startDate)
        .lt("data_entrega", endDate);
      if (error) throw error;

      const { data: setores, error: setoresError } = await supabase
        .from("setores")
        .select("id, nome")
        .eq("empresa_id", empresaId!);
      if (setoresError) throw setoresError;

      const setorMap = new Map(setores?.map((s) => [s.id, s.nome]) || []);

      const grouped: Record<string, SetorData> = {};

      for (const e of entregas || []) {
        const colab = e.colaboradores as any;
        const epi = e.epis as any;
        const setorId = colab?.setor_id || "sem-setor";
        const setorNome = setorId === "sem-setor" ? "Sem Setor" : (setorMap.get(setorId) || "Sem Setor");
        const epiNome = epi?.nome_epi || "EPI Desconhecido";
        const epiId = e.epi_id || "unknown";
        const custoUnit = Number(epi?.custo_estimado) || 0;

        if (!grouped[setorId]) grouped[setorId] = { setorNome, epis: {} };
        if (!grouped[setorId].epis[epiId]) {
          grouped[setorId].epis[epiId] = { nomeEpi: epiNome, count: 0, custo: 0, semPreco: custoUnit === 0 };
        }
        grouped[setorId].epis[epiId].count++;
        grouped[setorId].epis[epiId].custo += custoUnit;
      }

      return Object.values(grouped).sort((a, b) => a.setorNome.localeCompare(b.setorNome));
    },
    enabled: !!empresaId,
  });

  // Derived metrics
  const totalEntregas = data?.reduce((sum, s) => sum + Object.values(s.epis).reduce((a, e) => a + e.count, 0), 0) || 0;
  const totalCusto = data?.reduce((sum, s) => sum + Object.values(s.epis).reduce((a, e) => a + e.custo, 0), 0) || 0;
  const temSemPreco = data?.some((s) => Object.values(s.epis).some((e) => e.semPreco && e.count > 0)) || false;
  const mesLabel = MESES.find((m) => m.value === mes)?.label || "";

  // Chart data: stacked bars per setor, one key per EPI
  const { chartData, allEpiNames } = useMemo(() => {
    if (!data) return { chartData: [], allEpiNames: [] as string[] };
    const epiSet = new Set<string>();
    data.forEach((s) => Object.values(s.epis).forEach((e) => epiSet.add(e.nomeEpi)));
    const names = Array.from(epiSet).sort();

    const cd = data.map((s) => {
      const row: Record<string, any> = { setor: s.setorNome };
      for (const epi of Object.values(s.epis)) {
        row[epi.nomeEpi] = epi.custo;
      }
      return row;
    });
    return { chartData: cd, allEpiNames: names };
  }, [data]);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      {/* Filters — hidden on print */}
      <Card className="print:hidden">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5 w-40">
              <Label>Mês</Label>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MESES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 w-32">
              <Label>Ano</Label>
              <Select value={ano} onValueChange={setAno}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ANOS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Badge variant="secondary" className="mb-0.5 h-8 px-3 text-sm">
              {totalEntregas} entrega{totalEntregas !== 1 ? "s" : ""} em {mesLabel}/{ano}
            </Badge>
            <Badge variant="outline" className="mb-0.5 h-8 px-3 text-sm gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              {BRL(totalCusto)}
            </Badge>
            <Button variant="outline" size="sm" className="mb-0.5 gap-2 ml-auto" onClick={handlePrint}>
              <Printer className="w-4 h-4" />
              Imprimir Relatório
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Print header — visible only on print */}
      <div className="hidden print:block mb-6">
        <h2 className="text-xl font-bold text-foreground">Relatório de Consumo Mensal</h2>
        <p className="text-sm text-muted-foreground">Período: {mesLabel}/{ano} · Total: {totalEntregas} entregas · Custo: {BRL(totalCusto)}</p>
      </div>

      {/* Warning if EPIs without cost */}
      {temSemPreco && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground print:hidden">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
          <span>Alguns EPIs não possuem custo estimado cadastrado. O valor total pode estar subestimado.</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : data && data.length > 0 ? (
        <>
          {/* Stacked Bar Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Custo por Setor e Tipo de EPI</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 60)}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => BRL(v)} fontSize={12} />
                    <YAxis type="category" dataKey="setor" width={140} fontSize={12} />
                    <Tooltip formatter={(v: number) => BRL(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {allEpiNames.map((name, i) => (
                      <Bar key={name} dataKey={name} stackId="cost" fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Detail cards per setor */}
          <div className="grid gap-4">
            {data.map((setor, idx) => {
              const episList = Object.values(setor.epis).sort((a, b) => b.custo - a.custo);
              const setorTotal = episList.reduce((s, e) => s + e.count, 0);
              const setorCusto = episList.reduce((s, e) => s + e.custo, 0);
              return (
                <Collapsible key={idx} defaultOpen>
                  <Card>
                    <CollapsibleTrigger className="w-full text-left">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-secondary" />
                            {setor.setorNome}
                          </span>
                          <span className="flex items-center gap-2">
                            <Badge variant="outline">{setorTotal} item{setorTotal !== 1 ? "s" : ""}</Badge>
                            <Badge variant="secondary" className="gap-1">
                              <DollarSign className="w-3 h-3" />
                              {BRL(setorCusto)}
                            </Badge>
                            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
                          </span>
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>EPI</TableHead>
                                <TableHead className="text-right w-28">Qtd</TableHead>
                                <TableHead className="text-right w-36">Custo Unit.</TableHead>
                                <TableHead className="text-right w-36">Custo Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {episList.map((epi, eIdx) => (
                                <TableRow key={eIdx}>
                                  <TableCell className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    {epi.nomeEpi}
                                    {epi.semPreco && (
                                      <AlertTriangle className="h-3.5 w-3.5 text-warning" title="Sem custo cadastrado" />
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">{epi.count}</TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    {epi.count > 0 ? BRL(epi.custo / epi.count) : "—"}
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">{BRL(epi.custo)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma entrega registrada em {mesLabel}/{ano}.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminConsumoMensal;
