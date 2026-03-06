import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, AlertTriangle, ArchiveRestore, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Parse a date-only string (yyyy-MM-dd) as local time, not UTC */
const parseLocalDate = (dateStr: string) => {
  return parseISO(dateStr + "T12:00:00");
};

const formatLocalDate = (dateStr: string) =>
  format(parseLocalDate(dateStr), "dd/MM/yyyy", { locale: ptBR });

import { useEmpresaId } from "@/hooks/useEmpresaId";
import RoleGate from "@/components/RoleGate";
import type { Database } from "@/integrations/supabase/types";

type MotivoEntrega = Database["public"]["Enums"]["motivo_entrega_tipo"];

const MOTIVOS: { value: MotivoEntrega; label: string }[] = [
  { value: "entrega_inicial", label: "Entrega Inicial" },
  { value: "vencimento", label: "Vencimento" },
  { value: "dano_desgaste", label: "Dano / Desgaste" },
  { value: "extravio", label: "Extravio" },
  { value: "ajuste", label: "Ajuste de Tamanho" },
];

const MOTIVO_LABELS: Record<string, string> = {
  entrega_inicial: "Entrega Inicial",
  vencimento: "Vencimento",
  dano_desgaste: "Dano / Desgaste",
  extravio: "Extravio",
  ajuste: "Ajuste",
};

const PAGE_SIZE = 15;

const RegistroEntregas = () => {
  const queryClient = useQueryClient();
  const { empresaId } = useEmpresaId();
  const [colaboradorId, setColaboradorId] = useState("");
  const [epiId, setEpiId] = useState("");
  const [dataEntrega, setDataEntrega] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dataVencimento, setDataVencimento] = useState("");
  const [motivoEntrega, setMotivoEntrega] = useState<MotivoEntrega>("entrega_inicial");
  const [observacoes, setObservacoes] = useState("");
  const [devolucaoId, setDevolucaoId] = useState<string | null>(null);

  // Filters
  const [filtroColaborador, setFiltroColaborador] = useState("");
  const [filtroEpi, setFiltroEpi] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ativa" | "inativa">("todos");

  // Pagination
  const [page, setPage] = useState(0);

  const { data: colaboradores } = useQuery({
    queryKey: ["colaboradores"],
    queryFn: async () => {
      const { data } = await supabase.from("colaboradores").select("*").eq("status", "ativo").order("nome_completo");
      return data ?? [];
    },
  });

  const { data: epis } = useQuery({
    queryKey: ["epis"],
    queryFn: async () => {
      const { data } = await supabase.from("epis").select("*").order("nome_epi");
      return data ?? [];
    },
  });

  // Count query for pagination
  const { data: totalCount } = useQuery({
    queryKey: ["entregas-count", filtroColaborador, filtroEpi, filtroDataInicio, filtroDataFim],
    queryFn: async () => {
      const hasColabFilter = !!filtroColaborador;
      const hasEpiFilter = !!filtroEpi;

      // Only use inner joins when filters require them to avoid excluding records
      const selectParts = ["id"];
      if (hasColabFilter) selectParts.push("colaboradores!inner(nome_completo)");
      if (hasEpiFilter) selectParts.push("epis!inner(nome_epi)");

      let query = supabase
        .from("entregas_epi")
        .select(selectParts.join(", "), { count: "exact", head: true });

      if (hasColabFilter) {
        query = query.ilike("colaboradores.nome_completo", `%${filtroColaborador}%`);
      }
      if (hasEpiFilter) {
        query = query.ilike("epis.nome_epi", `%${filtroEpi}%`);
      }
      if (filtroDataInicio) {
        query = query.gte("data_entrega", filtroDataInicio);
      }
      if (filtroDataFim) {
        query = query.lte("data_entrega", filtroDataFim);
      }

      const { count } = await query;
      return count ?? 0;
    },
  });

  const { data: entregas, isLoading } = useQuery({
    queryKey: ["entregas", page, filtroColaborador, filtroEpi, filtroDataInicio, filtroDataFim],
    queryFn: async () => {
      let query = supabase
        .from("entregas_epi")
        .select("*, colaboradores!inner(nome_completo, setor_id, setores:setor_id(nome)), epis!inner(nome_epi)")
        .order("data_entrega", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filtroColaborador) {
        query = query.ilike("colaboradores.nome_completo", `%${filtroColaborador}%`);
      }
      if (filtroEpi) {
        query = query.ilike("epis.nome_epi", `%${filtroEpi}%`);
      }
      if (filtroDataInicio) {
        query = query.gte("data_entrega", filtroDataInicio);
      }
      if (filtroDataFim) {
        query = query.lte("data_entrega", filtroDataFim);
      }

      const { data } = await query;
      return data ?? [];
    },
  });

  const totalPages = Math.ceil((totalCount ?? 0) / PAGE_SIZE);

  const selectedEpi = epis?.find((e) => e.id === epiId);
  const today = new Date().toISOString().split("T")[0];
  const caVencido = selectedEpi?.data_validade_ca ? selectedEpi.data_validade_ca < today : false;
  const showObservacoes = motivoEntrega === "dano_desgaste" || motivoEntrega === "extravio";

  const handleEpiChange = (id: string) => {
    setEpiId(id);
    const epi = epis?.find((e) => e.id === id);
    if (epi && dataEntrega) {
      const vencimento = addDays(parseLocalDate(dataEntrega), epi.periodicidade_dias);
      setDataVencimento(format(vencimento, "yyyy-MM-dd"));
    }
  };

  const handleDataChange = (date: string) => {
    setDataEntrega(date);
    const epi = epis?.find((e) => e.id === epiId);
    if (epi && date) {
      const vencimento = addDays(parseLocalDate(date), epi.periodicidade_dias);
      setDataVencimento(format(vencimento, "yyyy-MM-dd"));
    }
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["entregas"] });
    queryClient.invalidateQueries({ queryKey: ["entregas-count"] });
    queryClient.invalidateQueries({ queryKey: ["vencidos"] });
    queryClient.invalidateQueries({ queryKey: ["entregas-all"] });
  };

  const devolverMutation = useMutation({
    mutationFn: async (entregaId: string) => {
      const { error } = await supabase
        .from("entregas_epi")
        .update({ status: "inativa", status_troca: "concluida" })
        .eq("id", entregaId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Baixa registrada com sucesso!");
      setDevolucaoId(null);
    },
    onError: () => toast.error("Erro ao registrar baixa."),
  });

  const registrar = useMutation({
    mutationFn: async () => {
      if (motivoEntrega === "vencimento" || motivoEntrega === "dano_desgaste") {
        await supabase
          .from("entregas_epi")
          .update({ status: "inativa", status_troca: "concluida" })
          .eq("colaborador_id", colaboradorId)
          .eq("epi_id", epiId)
          .eq("status", "ativa");
      }

      const { error } = await supabase.from("entregas_epi").insert({
        colaborador_id: colaboradorId,
        epi_id: epiId,
        data_entrega: dataEntrega,
        data_vencimento: dataVencimento,
        empresa_id: empresaId,
        motivo_entrega: motivoEntrega,
        observacoes: observacoes || null,
        ca_numero_entregue: selectedEpi?.ca_numero ?? null,
        data_validade_ca_entregue: selectedEpi?.data_validade_ca ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      setPage(0);
      toast.success("Entrega registrada com sucesso!");
      setColaboradorId("");
      setEpiId("");
      setDataEntrega(format(new Date(), "yyyy-MM-dd"));
      setDataVencimento("");
      setMotivoEntrega("entrega_inicial");
      setObservacoes("");
    },
    onError: () => toast.error("Erro ao registrar entrega."),
  });

  // Reset page when filters change
  const applyFilter = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(0);
  };

  return (
    <AppLayout title="Registro de Entregas" description="Registre a entrega de EPIs aos colaboradores">
      <Dialog open={!!devolucaoId} onOpenChange={(open) => !open && setDevolucaoId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Devolução / Baixa</DialogTitle>
            <DialogDescription>
              Confirmar a devolução/baixa deste EPI? O status será alterado para inativo e a troca será marcada como concluída.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDevolucaoId(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => devolucaoId && devolverMutation.mutate(devolucaoId)}
              disabled={devolverMutation.isPending}
            >
              {devolverMutation.isPending ? "Processando..." : "Confirmar Baixa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RoleGate allowWrite>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="w-5 h-5" />
              Nova Entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Colaborador *</Label>
              <Select value={colaboradorId} onValueChange={setColaboradorId}>
                <SelectTrigger><SelectValue placeholder="Selecione o colaborador" /></SelectTrigger>
                <SelectContent>
                  {colaboradores?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>EPI *</Label>
              <Select value={epiId} onValueChange={handleEpiChange}>
                <SelectTrigger><SelectValue placeholder="Selecione o EPI" /></SelectTrigger>
                <SelectContent>
                  {epis?.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome_epi} {e.ca_numero ? `(CA: ${e.ca_numero})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {caVencido && (
              <Alert variant="destructive" className="border-destructive bg-destructive/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="font-semibold">
                  ⚠️ O CA deste EPI está vencido ({selectedEpi?.data_validade_ca ? formatLocalDate(selectedEpi.data_validade_ca) : ""}). 
                  Entrega bloqueada por irregularidade jurídica.
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label>Motivo da Entrega *</Label>
              <Select value={motivoEntrega} onValueChange={(v) => setMotivoEntrega(v as MotivoEntrega)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MOTIVOS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showObservacoes && (
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Descreva o ocorrido..."
                  rows={3}
                />
              </div>
            )}

            <div>
              <Label>Data de Entrega *</Label>
              <Input type="date" value={dataEntrega} onChange={(e) => handleDataChange(e.target.value)} />
            </div>
            <div>
              <Label>Data de Vencimento (automático)</Label>
              <Input type="date" value={dataVencimento} disabled className="bg-muted" />
            </div>
            <Button
              className="w-full"
              onClick={() => registrar.mutate()}
              disabled={!colaboradorId || !epiId || !dataEntrega || !dataVencimento || caVencido || registrar.isPending}
            >
              {registrar.isPending ? "Registrando..." : "Registrar Entrega"}
            </Button>
          </CardContent>
        </Card>
        </RoleGate>

        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Entregas Recentes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Filters row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-4 pb-3">
                <Input
                  placeholder="Filtrar colaborador..."
                  value={filtroColaborador}
                  onChange={(e) => applyFilter(setFiltroColaborador, e.target.value)}
                  className="h-8 text-xs"
                />
                <Input
                  placeholder="Filtrar EPI..."
                  value={filtroEpi}
                  onChange={(e) => applyFilter(setFiltroEpi, e.target.value)}
                  className="h-8 text-xs"
                />
                <Input
                  type="date"
                  placeholder="Data início"
                  value={filtroDataInicio}
                  onChange={(e) => applyFilter(setFiltroDataInicio, e.target.value)}
                  className="h-8 text-xs"
                  title="Data início"
                />
                <Input
                  type="date"
                  placeholder="Data fim"
                  value={filtroDataFim}
                  onChange={(e) => applyFilter(setFiltroDataFim, e.target.value)}
                  className="h-8 text-xs"
                  title="Data fim"
                />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>EPI</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Entrega</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : entregas?.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma entrega encontrada.</TableCell></TableRow>
                  ) : (
                    entregas?.map((e) => {
                      const isAtiva = e.status === "ativa";
                      const vencido = isAtiva && e.data_vencimento < today;
                      const colab = e.colaboradores as any;
                      const setorNome = colab?.setores?.nome ?? "—";
                      return (
                        <TableRow key={e.id} className={!isAtiva ? "opacity-60" : ""}>
                          <TableCell className="font-medium">{colab?.nome_completo ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{setorNome}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {(e.epis as any)?.nome_epi ?? "—"}
                              {(e as any).ca_numero_entregue && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="font-medium">CA na entrega: {(e as any).ca_numero_entregue}</p>
                                      {(e as any).data_validade_ca_entregue && (
                                        <p className="text-xs text-muted-foreground">
                                          Validade CA: {formatLocalDate((e as any).data_validade_ca_entregue)}
                                        </p>
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {MOTIVO_LABELS[e.motivo_entrega ?? ""] ?? "—"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatLocalDate(e.data_entrega)}</TableCell>
                          <TableCell>{formatLocalDate(e.data_vencimento)}</TableCell>
                          <TableCell>
                            {isAtiva ? (
                              <Badge variant={vencido ? "destructive" : "secondary"}>
                                {vencido ? "Vencido" : "Válido"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Inativa</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {isAtiva && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Dar baixa / Devolver"
                                onClick={() => setDevolucaoId(e.id)}
                              >
                                <ArchiveRestore className="w-4 h-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {/* Pagination - always visible */}
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="text-xs text-muted-foreground">
                  {totalCount != null
                    ? `Página ${page + 1} de ${Math.max(totalPages, 1)} (${totalCount} registros)`
                    : "Carregando..."}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1 || totalPages <= 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Próximo <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default RegistroEntregas;
