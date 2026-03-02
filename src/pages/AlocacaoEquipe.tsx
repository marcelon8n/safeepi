import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, UserPlus, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

const AlocacaoEquipe = () => {
  const { empresaId } = useEmpresaId();
  const qc = useQueryClient();
  const [obraId, setObraId] = useState("");
  const [search, setSearch] = useState("");

  // Fetch obras ativas
  const { data: obras } = useQuery({
    queryKey: ["obras-ativas", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("obras")
        .select("id, nome, status")
        .eq("status", "ativa")
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  // Fetch conformidade from view
  const { data: colaboradores, isLoading: loadingColabs } = useQuery({
    queryKey: ["conformidade-colaboradores", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("view_conformidade_colaboradores")
        .select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  // Fetch already allocated to selected obra
  const { data: alocados } = useQuery({
    queryKey: ["obra-alocados", obraId],
    queryFn: async () => {
      if (!obraId) return [];
      const { data, error } = await supabase
        .from("colaboradores_obras")
        .select("colaborador_id")
        .eq("obra_id", obraId)
        .eq("ativo", true);
      if (error) throw error;
      return data;
    },
    enabled: !!obraId,
  });

  const alocadosIds = new Set(alocados?.map((a) => a.colaborador_id) ?? []);

  const alocar = useMutation({
    mutationFn: async (colaboradorId: string) => {
      const { error } = await supabase.from("colaboradores_obras").insert({
        obra_id: obraId,
        colaborador_id: colaboradorId,
        empresa_id: empresaId!,
        data_inicio: new Date().toISOString().split("T")[0],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obra-alocados", obraId] });
      toast.success("Colaborador alocado com sucesso!");
    },
    onError: () => toast.error("Erro ao alocar colaborador."),
  });

  const filtered = colaboradores?.filter((c) => {
    if (!search) return true;
    return (c.nome_colaborador ?? "").toLowerCase().includes(search.toLowerCase());
  }) ?? [];

  const getComplianceStatus = (c: typeof filtered[0]) => {
    const today = new Date().toISOString().split("T")[0];
    const asoVencido = !c.validade_aso || c.validade_aso < today;
    const epiPendente = !c.possui_epis;
    const semIntegracao = !c.integracao_concluida;
    const canAllocate = !asoVencido && !epiPendente;
    return { asoVencido, epiPendente, semIntegracao, canAllocate };
  };

  return (
    <AppLayout title="Alocação de Equipe" description="Aloque colaboradores em obras com verificação de conformidade">
      {/* Obra Selector */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Select value={obraId} onValueChange={setObraId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma obra ativa..." />
                </SelectTrigger>
                <SelectContent>
                  {obras?.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar colaborador por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {!obraId ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Selecione uma obra</p>
            <p className="text-sm mt-1">Escolha uma obra ativa acima para visualizar e alocar colaboradores.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-1.5 text-xs">
              <XCircle className="w-3.5 h-3.5 text-destructive" />
              <span className="text-muted-foreground">ASO Vencido</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <XCircle className="w-3.5 h-3.5 text-destructive" />
              <span className="text-muted-foreground">EPI Pendente</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
              <span className="text-muted-foreground">Sem Integração</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              <span className="text-muted-foreground">Conforme</span>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {loadingColabs ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  Nenhum colaborador encontrado.
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Colaborador</TableHead>
                        <TableHead className="hidden sm:table-cell">Cargo</TableHead>
                        <TableHead>Conformidade</TableHead>
                        <TableHead className="w-[120px] text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((c) => {
                        const { asoVencido, epiPendente, semIntegracao, canAllocate } = getComplianceStatus(c);
                        const isAllocated = alocadosIds.has(c.colaborador_id!);

                        return (
                          <TableRow key={c.colaborador_id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{c.nome_colaborador}</p>
                                <p className="text-xs text-muted-foreground sm:hidden">{c.cargo ?? "—"}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                              {c.cargo ?? "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {asoVencido && (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                    ❌ ASO Vencido
                                  </Badge>
                                )}
                                {epiPendente && (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                    ❌ EPI Pendente
                                  </Badge>
                                )}
                                {semIntegracao && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                    ⚠️ S/ Integração
                                  </Badge>
                                )}
                                {!asoVencido && !epiPendente && !semIntegracao && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-500 text-green-700 dark:text-green-400">
                                    ✅ Conforme
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {isAllocated ? (
                                <Badge variant="outline" className="text-xs">Alocado</Badge>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-block">
                                      <Button
                                        size="sm"
                                        disabled={!canAllocate || alocar.isPending}
                                        onClick={() => alocar.mutate(c.colaborador_id!)}
                                        className="gap-1"
                                      >
                                        <UserPlus className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Alocar</span>
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  {!canAllocate && (
                                    <TooltipContent>
                                      <p>Colaborador precisa de ASO válido e EPIs em dia para ser alocado.</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              )}
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
        </>
      )}
    </AppLayout>
  );
};

export default AlocacaoEquipe;
