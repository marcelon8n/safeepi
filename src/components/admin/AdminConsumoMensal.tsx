import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Layers } from "lucide-react";

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

const AdminConsumoMensal = () => {
  const { empresaId } = useEmpresaId();
  const [mes, setMes] = useState(String(currentDate.getMonth() + 1));
  const [ano, setAno] = useState(String(currentDate.getFullYear()));

  const startDate = `${ano}-${mes.padStart(2, "0")}-01`;
  const endMonth = Number(mes) === 12 ? 1 : Number(mes) + 1;
  const endYear = Number(mes) === 12 ? Number(ano) + 1 : Number(ano);
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const { data, isLoading } = useQuery({
    queryKey: ["consumo-mensal", empresaId, mes, ano],
    queryFn: async () => {
      // Fetch deliveries for the month with EPI and collaborator info
      const { data: entregas, error } = await supabase
        .from("entregas_epi")
        .select("id, data_entrega, colaborador_id, epi_id, epis(nome_epi), colaboradores(nome_completo, setor_id)")
        .eq("empresa_id", empresaId!)
        .gte("data_entrega", startDate)
        .lt("data_entrega", endDate);
      if (error) throw error;

      // Fetch setores
      const { data: setores, error: setoresError } = await supabase
        .from("setores")
        .select("id, nome")
        .eq("empresa_id", empresaId!);
      if (setoresError) throw setoresError;

      const setorMap = new Map(setores?.map((s) => [s.id, s.nome]) || []);

      // Group by setor -> EPI
      const grouped: Record<string, { setorNome: string; epis: Record<string, { nomeEpi: string; count: number }> }> = {};

      for (const e of entregas || []) {
        const colab = e.colaboradores as any;
        const epi = e.epis as any;
        const setorId = colab?.setor_id || "sem-setor";
        const setorNome = setorId === "sem-setor" ? "Sem Setor" : (setorMap.get(setorId) || "Sem Setor");
        const epiNome = epi?.nome_epi || "EPI Desconhecido";
        const epiId = e.epi_id || "unknown";

        if (!grouped[setorId]) grouped[setorId] = { setorNome, epis: {} };
        if (!grouped[setorId].epis[epiId]) grouped[setorId].epis[epiId] = { nomeEpi: epiNome, count: 0 };
        grouped[setorId].epis[epiId].count++;
      }

      return Object.values(grouped).sort((a, b) => a.setorNome.localeCompare(b.setorNome));
    },
    enabled: !!empresaId,
  });

  const totalEntregas = data?.reduce((sum, setor) => sum + Object.values(setor.epis).reduce((s, e) => s + e.count, 0), 0) || 0;
  const mesLabel = MESES.find((m) => m.value === mes)?.label || "";

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
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
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid gap-4">
          {data.map((setor, idx) => {
            const episList = Object.values(setor.epis).sort((a, b) => b.count - a.count);
            const setorTotal = episList.reduce((s, e) => s + e.count, 0);
            return (
              <Card key={idx}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      {setor.setorNome}
                    </span>
                    <Badge variant="outline">{setorTotal} item{setorTotal !== 1 ? "s" : ""}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>EPI</TableHead>
                          <TableHead className="text-right w-32">Quantidade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {episList.map((epi, eIdx) => (
                          <TableRow key={eIdx}>
                            <TableCell className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              {epi.nomeEpi}
                            </TableCell>
                            <TableCell className="text-right font-semibold">{epi.count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
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
