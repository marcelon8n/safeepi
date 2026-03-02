import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, UserPlus, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
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
        .select("id, nome, status, requisitos_obrigatorios")
        .eq("empresa_id", empresaId!)
        .eq("status", "ativa")
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  const obraSelecionada = obras?.find((o) => o.id === obraId);
  const requisitosObra = obraSelecionada?.requisitos_obrigatorios ?? [];

  // Fetch colaboradores
  const { data: colaboradores, isLoading: loadingColabs } = useQuery({
    queryKey: ["colaboradores-alocacao", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores")
        .select("id, nome_completo, cargo, status")
        .eq("empresa_id", empresaId!)
        .eq("status", "ativo")
        .order("nome_completo");
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  // Fetch requisitos de todos os colaboradores (via RLS + join on colaboradores.empresa_id)
  const { data: requisitosColab } = useQuery({
    queryKey: ["requisitos-colaboradores", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requisitos_colaboradores")
        .select("colaborador_id, tipo_requisito, data_validade, status_verificado");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!empresaId,
  });

  // Fetch EPIs dos colaboradores (para "Ficha de EPI")
  const { data: episColab } = useQuery({
    queryKey: ["epis-colaboradores-alocacao", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entregas_epi")
        .select("colaborador_id, status, data_vencimento")
        .eq("empresa_id", empresaId!)
        .eq("status", "ativa");
      if (error) throw error;
      return data ?? [];
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

  // Build requisitos map per collaborator
  const requisitosPorColab = useMemo(() => {
    const map = new Map<string, Map<string, { validade: string | null; verificado: boolean }>>();
    requisitosColab?.forEach((r) => {
      if (!r.colaborador_id) return;
      if (!map.has(r.colaborador_id)) map.set(r.colaborador_id, new Map());
      map.get(r.colaborador_id)!.set(r.tipo_requisito, {
        validade: r.data_validade,
        verificado: r.status_verificado ?? false,
      });
    });
    return map;
  }, [requisitosColab]);

  // Build EPI status map
  const epiPorColab = useMemo(() => {
    const map = new Map<string, boolean>();
    const today = new Date().toISOString().split("T")[0];
    episColab?.forEach((e) => {
      if (!e.colaborador_id) return;
      const hasValid = e.data_vencimento >= today;
      if (hasValid) map.set(e.colaborador_id, true);
      else if (!map.has(e.colaborador_id)) map.set(e.colaborador_id, false);
    });
    return map;
  }, [episColab]);

  const getComplianceForObra = (colaboradorId: string) => {
    if (requisitosObra.length === 0) return { apto: true, pendentes: [] as string[] };

    const today = new Date().toISOString().split("T")[0];
    const colabReqs = requisitosPorColab.get(colaboradorId);
    const pendentes: string[] = [];

    requisitosObra.forEach((req) => {
      if (req === "Ficha de EPI") {
        const hasEpi = epiPorColab.get(colaboradorId);
        if (!hasEpi) pendentes.push("Ficha de EPI");
        return;
      }

      const doc = colabReqs?.get(req);
      if (!doc) {
        pendentes.push(req);
      } else if (doc.validade && doc.validade < today) {
        pendentes.push(`${req} (vencido)`);
      }
    });

    return { apto: pendentes.length === 0, pendentes };
  };

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
    return c.nome_completo.toLowerCase().includes(search.toLowerCase());
  }) ?? [];

  return (
    <AppLayout title="Alocação de Equipe" description="Aloque colaboradores em obras com verificação de conformidade">
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

      {obraId && requisitosObra.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="text-xs text-muted-foreground font-medium mr-1">Requisitos da obra:</span>
          {requisitosObra.map((r) => (
            <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>
          ))}
        </div>
      )}

      {!obraId ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Selecione uma obra</p>
            <p className="text-sm mt-1">Escolha uma obra ativa acima para visualizar e alocar colaboradores.</p>
          </CardContent>
        </Card>
      ) : (
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
                      const { apto, pendentes } = getComplianceForObra(c.id);
                      const isAllocated = alocadosIds.has(c.id);

                      return (
                        <TableRow key={c.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{c.nome_completo}</p>
                              <p className="text-xs text-muted-foreground sm:hidden">{c.cargo ?? "—"}</p>
                              {!apto && pendentes.length > 0 && (
                                <p className="text-[11px] text-destructive mt-0.5">
                                  Pendências: {pendentes.join(", ")}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {c.cargo ?? "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {requisitosObra.length === 0 ? (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-500 text-green-700 dark:text-green-400">
                                  ✅ Sem requisitos
                                </Badge>
                              ) : apto ? (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-500 text-green-700 dark:text-green-400">
                                  ✅ Apto
                                </Badge>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 cursor-help">
                                      ❌ Pendente ({pendentes.length})
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="max-w-xs">
                                    <p className="font-medium text-xs mb-1">Pendências:</p>
                                    <ul className="text-xs space-y-0.5">
                                      {pendentes.map((p) => (
                                        <li key={p}>• {p}</li>
                                      ))}
                                    </ul>
                                  </TooltipContent>
                                </Tooltip>
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
                                      disabled={!apto || alocar.isPending}
                                      onClick={() => alocar.mutate(c.id)}
                                      className="gap-1"
                                    >
                                      <UserPlus className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline">Alocar</span>
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {!apto && (
                                  <TooltipContent>
                                    <p>Colaborador possui pendências e não pode ser alocado nesta obra.</p>
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
      )}
    </AppLayout>
  );
};

export default AlocacaoEquipe;
