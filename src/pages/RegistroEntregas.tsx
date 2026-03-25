import { useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardList, AlertTriangle, ArchiveRestore, Info, ChevronLeft, ChevronRight, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";

/** Parse a date-only string (yyyy-MM-dd) as local time, not UTC */
const parseLocalDate = (dateStr: string) => {
  return parseISO(dateStr + "T12:00:00");
};

const formatLocalDate = (dateStr: string) =>
  format(parseLocalDate(dateStr), "dd/MM/yyyy", { locale: ptBR });

import { useEmpresaId } from "@/hooks/useEmpresaId";
import RoleGate from "@/components/RoleGate";
import { useFormDraft } from "@/hooks/useFormDraft";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const urlStatus = searchParams.get("status") as "todos" | "ativa" | "inativa" | null;
  const [colaboradorId, setColaboradorId] = useState("");
  const [epiId, setEpiId] = useState("");
  const [dataEntrega, setDataEntrega] = useState(format(new Date(), "yyyy-MM-dd"));
  const [motivoEntrega, setMotivoEntrega] = useState<MotivoEntrega>("entrega_inicial");
  const [observacoes, setObservacoes] = useState("");

  // Draft persistence for the delivery form
  const entregaForm = { colaboradorId, epiId, dataEntrega, motivoEntrega, observacoes };
  const { clearDraft: clearEntregaDraft } = useFormDraft(
    "draft_nova_entrega",
    entregaForm,
    (restored) => {
      setColaboradorId(restored.colaboradorId ?? "");
      setEpiId(restored.epiId ?? "");
      setDataEntrega(restored.dataEntrega ?? format(new Date(), "yyyy-MM-dd"));
      setMotivoEntrega(restored.motivoEntrega ?? "entrega_inicial");
      setObservacoes(restored.observacoes ?? "");
    },
    true, // always enabled since this is a standalone form
  );

  const [devolucaoId, setDevolucaoId] = useState<string | null>(null);
  const [caConfirmado, setCaConfirmado] = useState(false);

  // Modal pós-registro
  const [entregaConfirmada, setEntregaConfirmada] = useState<{
    colaboradorNome: string;
    epiNome: string;
    caNumerо: string | null;
    dataEntrega: string;
    empresaNome: string;
  } | null>(null);

  // Filters
  const [filtroColaborador, setFiltroColaborador] = useState("");
  const [filtroEpi, setFiltroEpi] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ativa" | "inativa">(urlStatus || "todos");

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

  const { data: empresa } = useQuery({
    queryKey: ["empresa", empresaId],
    queryFn: async () => {
      if (!empresaId) return null;
      const { data } = await supabase.from("empresas").select("nome_fantasia").eq("id", empresaId).single();
      return data;
    },
    enabled: !!empresaId,
  });

  // Count query for pagination (using v_alertas_vencimento)
  const { data: totalCount } = useQuery({
    queryKey: ["entregas-count", filtroColaborador, filtroEpi, filtroDataInicio, filtroDataFim, filtroStatus],
    queryFn: async () => {
      let query = supabase
        .from("entregas_epi")
        .select("id", { count: "exact", head: true });

      if (filtroDataInicio) {
        query = query.gte("data_entrega", filtroDataInicio);
      }
      if (filtroDataFim) {
        query = query.lte("data_entrega", filtroDataFim);
      }
      if (filtroStatus !== "todos") {
        query = query.eq("status", filtroStatus);
      }

      const { count } = await query;
      return count ?? 0;
    },
  });

  const { data: entregas, isLoading } = useQuery({
    queryKey: ["entregas", page, filtroColaborador, filtroEpi, filtroDataInicio, filtroDataFim, filtroStatus],
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
      if (filtroStatus !== "todos") {
        query = query.eq("status", filtroStatus);
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
    setCaConfirmado(false);
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

  const clearForm = () => {
    setColaboradorId("");
    setEpiId("");
    setDataEntrega(format(new Date(), "yyyy-MM-dd"));
    setMotivoEntrega("entrega_inicial");
    setObservacoes("");
    setCaConfirmado(false);
    clearEntregaDraft();
  };

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
        data_vencimento: dataEntrega, // placeholder - trigger overwrites this
        empresa_id: empresaId,
        motivo_entrega: motivoEntrega,
        observacoes: observacoes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      setPage(0);

      const colabNome = colaboradores?.find((c) => c.id === colaboradorId)?.nome_completo ?? "—";
      const epiNome = selectedEpi?.nome_epi ?? "—";
      const caNum = selectedEpi?.ca_numero ?? null;

      setEntregaConfirmada({
        colaboradorNome: colabNome,
        epiNome: epiNome,
        caNumerо: caNum,
        dataEntrega: dataEntrega,
        empresaNome: empresa?.nome_fantasia ?? "Empresa",
      });

      toast.success("Entrega registrada com sucesso!");
    },
    onError: () => toast.error("Erro ao registrar entrega."),
  });

  const gerarFichaPDF = () => {
    if (!entregaConfirmada) return;

    const doc = new jsPDF();
    const { colaboradorNome, epiNome, caNumerо, dataEntrega: dtEntrega, empresaNome } = entregaConfirmada;

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("FICHA DE ENTREGA DE EPI", 105, 25, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(empresaNome, 105, 35, { align: "center" });

    // Line
    doc.setLineWidth(0.5);
    doc.line(20, 42, 190, 42);

    // Content
    let y = 55;
    const lineHeight = 12;

    const addField = (label: string, value: string) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 25, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, 80, y);
      y += lineHeight;
    };

    addField("Colaborador", colaboradorNome);
    addField("EPI", epiNome);
    addField("CA", caNumerо ?? "N/A");
    addField("Data de Entrega", formatLocalDate(dtEntrega));

    // Disclaimer
    y += 15;
    doc.setFontSize(10);
    doc.text(
      "Declaro ter recebido o equipamento de proteção individual acima descrito,",
      25,
      y
    );
    y += 6;
    doc.text(
      "comprometendo-me a utilizá-lo adequadamente e a zelar pela sua conservação.",
      25,
      y
    );

    // Signature
    y += 35;
    doc.line(25, y, 110, y);
    y += 6;
    doc.text("Assinatura do Colaborador", 25, y);

    y += 20;
    doc.line(25, y, 110, y);
    y += 6;
    doc.text("Assinatura do Responsável", 25, y);

    // Footer
    doc.setFontSize(8);
    doc.text(
      `Documento gerado em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`,
      105,
      285,
      { align: "center" }
    );

    doc.save(`ficha-entrega-${colaboradorNome.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  const handleNovaEntrega = () => {
    clearForm();
    setEntregaConfirmada(null);
  };

  // Disable register button logic
  const canRegister = colaboradorId && epiId && dataEntrega && !registrar.isPending && (!caVencido || caConfirmado);

  // Reset page when filters change
  const applyFilter = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(0);
  };

  return (
    <AppLayout title="Registro de Entregas" description="Registre a entrega de EPIs aos colaboradores">
      {/* Modal Devolução */}
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

      {/* Modal Entrega Confirmada */}
      <Dialog open={!!entregaConfirmada} onOpenChange={(open) => !open && handleNovaEntrega()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              ✅ Entrega Confirmada
            </DialogTitle>
            <DialogDescription>
              O registro foi salvo com sucesso. Você pode gerar a ficha de entrega para assinatura física.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 text-sm">
            <p><span className="font-medium">Colaborador:</span> {entregaConfirmada?.colaboradorNome}</p>
            <p><span className="font-medium">EPI:</span> {entregaConfirmada?.epiNome}</p>
            <p><span className="font-medium">CA:</span> {entregaConfirmada?.caNumerо ?? "N/A"}</p>
            <p><span className="font-medium">Data:</span> {entregaConfirmada ? formatLocalDate(entregaConfirmada.dataEntrega) : ""}</p>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={gerarFichaPDF} className="w-full gap-2">
              <FileText className="w-4 h-4" />
              Gerar Ficha de Entrega (PDF)
            </Button>
            <Button variant="outline" onClick={handleNovaEntrega} className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Registrar Nova Entrega
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
              <div className="space-y-3">
                <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-300">
                    ⚠️ Atenção: O CA deste equipamento expirou em{" "}
                    <strong>{selectedEpi?.data_validade_ca ? formatLocalDate(selectedEpi.data_validade_ca) : ""}</strong>.
                    O fornecimento é legal apenas se o lote foi adquirido antes desta data (NT 130/2018). Deseja prosseguir?
                  </AlertDescription>
                </Alert>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="ca-confirm"
                    checked={caConfirmado}
                    onCheckedChange={(checked) => setCaConfirmado(checked === true)}
                  />
                  <Label htmlFor="ca-confirm" className="text-xs leading-tight cursor-pointer">
                    Confirmo que este lote foi adquirido dentro da validade do CA.
                  </Label>
                </div>
              </div>
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
              <Input type="date" value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} />
            </div>

            <Badge variant="secondary" className="w-full justify-center py-1.5 text-xs font-normal text-muted-foreground">
              Vencimento calculado automaticamente pelo sistema
            </Badge>

            <Button
              className="w-full"
              onClick={() => registrar.mutate()}
              disabled={!canRegister}
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
              {/* Status tabs + Filters row */}
              <div className="px-4 pb-3 space-y-3">
                <Tabs value={filtroStatus} onValueChange={(v) => { setFiltroStatus(v as any); setPage(0); const p = new URLSearchParams(searchParams); p.set("status", v); setSearchParams(p, { replace: true }); }}>
                  <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="todos">Todos</TabsTrigger>
                    <TabsTrigger value="ativa">Ativos</TabsTrigger>
                    <TabsTrigger value="inativa">Inativos / Histórico</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                              vencido ? (
                                <Badge variant="destructive" className="font-semibold">Vencido</Badge>
                              ) : (
                                <Badge variant="success" className="font-semibold">Ativo</Badge>
                              )
                            ) : (
                              <Badge variant="secondary" className="font-semibold">
                                {e.status_troca === "substituido" ? "Substituído" : "Inativo"}
                              </Badge>
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
