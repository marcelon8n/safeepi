import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Users, BookOpen, ShieldCheck, Plus, Trash2, MapPin, Calendar, User, FileText, ExternalLink, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ativa: { label: "Iniciada", variant: "default" },
  pausada: { label: "Pausada", variant: "secondary" },
  finalizada: { label: "Finalizada", variant: "outline" },
};

const ObraDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { empresaId } = useEmpresaId();
  const { user } = useAuth();
  const qc = useQueryClient();

  // Fetch obra
  const { data: obra, isLoading: obraLoading } = useQuery({
    queryKey: ["obra-detalhe", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("obras").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Status update
  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const payload: any = { status: newStatus };
      if (newStatus === "finalizada") payload.data_fim_real = new Date().toISOString().split("T")[0];
      const { error } = await supabase.from("obras").update(payload).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obra-detalhe", id] });
      qc.invalidateQueries({ queryKey: ["obras-dashboard"] });
      toast.success("Status atualizado!");
    },
  });

  if (obraLoading) {
    return (
      <AppLayout title="Carregando..." description="">
        <Skeleton className="h-64 w-full" />
      </AppLayout>
    );
  }

  if (!obra) {
    return (
      <AppLayout title="Obra não encontrada" description="">
        <Button variant="outline" onClick={() => navigate("/obras")}>
          <ArrowLeft className="w-4 h-4 mr-2" />Voltar
        </Button>
      </AppLayout>
    );
  }

  const cfg = statusConfig[obra.status ?? "ativa"] ?? statusConfig.ativa;

  return (
    <AppLayout title={obra.nome} description={(obra as any).cliente ?? "Gestão do canteiro de obras"}>
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => navigate("/obras")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />Voltar para obras
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant={cfg.variant} className="text-sm">{cfg.label}</Badge>
          <Select value={obra.status ?? "ativa"} onValueChange={(v) => updateStatus.mutate(v)}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ativa">Iniciada</SelectItem>
              <SelectItem value="pausada">Pausada</SelectItem>
              <SelectItem value="finalizada">Finalizada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {(obra as any).endereco && (
          <Card><CardContent className="p-4 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
            <div><p className="text-xs text-muted-foreground">Endereço</p><p className="text-sm font-medium">{(obra as any).endereco}</p></div>
          </CardContent></Card>
        )}
        {obra.cidade && (
          <Card><CardContent className="p-4 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
            <div><p className="text-xs text-muted-foreground">Cidade</p><p className="text-sm font-medium">{obra.cidade}</p></div>
          </CardContent></Card>
        )}
        {obra.responsavel && (
          <Card><CardContent className="p-4 flex items-center gap-3">
            <User className="w-5 h-5 text-muted-foreground shrink-0" />
            <div><p className="text-xs text-muted-foreground">Engenheiro</p><p className="text-sm font-medium">{obra.responsavel}</p></div>
          </CardContent></Card>
        )}
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Período</p>
            <p className="text-sm font-medium">
              {format(new Date(obra.data_inicio + "T12:00:00"), "dd/MM/yy")}
              {obra.data_prevista_fim && ` → ${format(new Date(obra.data_prevista_fim + "T12:00:00"), "dd/MM/yy")}`}
            </p>
          </div>
        </CardContent></Card>
        {(obra as any).alvara_url && (
          <Card><CardContent className="p-4 flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Alvará</p>
              <a href={(obra as any).alvara_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex items-center gap-1">
                Ver documento <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </CardContent></Card>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="equipe" className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="equipe" className="gap-2"><Users className="w-4 h-4" />Equipe</TabsTrigger>
          <TabsTrigger value="diario" className="gap-2"><BookOpen className="w-4 h-4" />Diário de Obra</TabsTrigger>
          <TabsTrigger value="conformidade" className="gap-2"><ShieldCheck className="w-4 h-4" />Conformidade</TabsTrigger>
        </TabsList>
        <TabsContent value="equipe"><EquipeTab obraId={id!} empresaId={empresaId} /></TabsContent>
        <TabsContent value="diario"><DiarioTab obraId={id!} empresaId={empresaId} userId={user?.id ?? null} /></TabsContent>
        <TabsContent value="conformidade"><ConformidadeTab obraId={id!} /></TabsContent>
      </Tabs>
    </AppLayout>
  );
};

// ── Equipe Tab ──
const EquipeTab = ({ obraId, empresaId }: { obraId: string; empresaId: string | null }) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedColabId, setSelectedColabId] = useState("");

  const { data: alocacoes, isLoading } = useQuery({
    queryKey: ["obra-equipe", obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores_obras")
        .select("*, colaboradores(nome_completo, cargo)")
        .eq("obra_id", obraId)
        .eq("ativo", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: colaboradores } = useQuery({
    queryKey: ["colaboradores-disponiveis", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("colaboradores").select("id, nome_completo, cargo").eq("status", "ativo").order("nome_completo");
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  const alocadosIds = new Set(alocacoes?.map((a) => a.colaborador_id) ?? []);
  const disponiveis = colaboradores?.filter((c) => !alocadosIds.has(c.id)) ?? [];

  const alocar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("colaboradores_obras").insert({
        obra_id: obraId, colaborador_id: selectedColabId, empresa_id: empresaId!,
        data_inicio: new Date().toISOString().split("T")[0],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obra-equipe", obraId] });
      toast.success("Colaborador alocado!");
      setOpen(false);
      setSelectedColabId("");
    },
    onError: () => toast.error("Erro ao alocar colaborador."),
  });

  const desalocar = useMutation({
    mutationFn: async (alocacaoId: string) => {
      const { error } = await supabase.from("colaboradores_obras")
        .update({ ativo: false, data_fim: new Date().toISOString().split("T")[0] })
        .eq("id", alocacaoId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obra-equipe", obraId] });
      toast.success("Colaborador removido da obra.");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{alocacoes?.length ?? 0} colaborador(es) alocado(s)</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" />Alocar</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Alocar Colaborador</DialogTitle></DialogHeader>
            <div className="py-4">
              <Label>Colaborador</Label>
              <Select value={selectedColabId} onValueChange={setSelectedColabId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {disponiveis.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome_completo} {c.cargo ? `(${c.cargo})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {disponiveis.length === 0 && <p className="text-xs text-muted-foreground mt-2">Todos os colaboradores já estão alocados.</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => alocar.mutate()} disabled={!selectedColabId || alocar.isPending}>Alocar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                ))
              ) : (alocacoes?.length ?? 0) === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum colaborador alocado.</TableCell></TableRow>
              ) : (
                alocacoes?.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{(a as any).colaboradores?.nome_completo ?? "—"}</TableCell>
                    <TableCell>{(a as any).colaboradores?.cargo ?? "—"}</TableCell>
                    <TableCell>{a.data_inicio ? format(new Date(a.data_inicio + "T12:00:00"), "dd/MM/yy") : "—"}</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Remover da obra?</AlertDialogTitle><AlertDialogDescription>O colaborador será desalocado desta obra.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => desalocar.mutate(a.id)}>Remover</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// ── Diário de Obra Tab ──
const DiarioTab = ({ obraId, empresaId, userId }: { obraId: string; empresaId: string | null; userId: string | null }) => {
  const qc = useQueryClient();
  const [descricao, setDescricao] = useState("");
  const [foto, setFoto] = useState<File | null>(null);

  const { data: registros, isLoading } = useQuery({
    queryKey: ["obra-diario", obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diario_obra" as any)
        .select("*")
        .eq("obra_id", obraId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const addEntry = useMutation({
    mutationFn: async () => {
      let foto_url: string | null = null;
      if (foto) {
        const filePath = `diario/${empresaId}/${obraId}/${Date.now()}-${foto.name}`;
        const { error: uploadError } = await supabase.storage.from("obras-documentos").upload(filePath, foto);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("obras-documentos").getPublicUrl(filePath);
        foto_url = urlData.publicUrl;
      }
      const { error } = await supabase.from("diario_obra" as any).insert({
        obra_id: obraId, empresa_id: empresaId, descricao, foto_url, autor_id: userId,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obra-diario", obraId] });
      toast.success("Registro adicionado!");
      setDescricao("");
      setFoto(null);
    },
    onError: () => toast.error("Erro ao registrar."),
  });

  return (
    <div className="space-y-6">
      {/* New entry form */}
      <Card>
        <CardHeader><CardTitle className="text-base">Nova Ocorrência</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Descreva a ocorrência do dia..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
          />
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            <div className="flex-1">
              <Label>Foto (opcional)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files?.[0] ?? null)} />
            </div>
            <Button onClick={() => addEntry.mutate()} disabled={!descricao.trim() || addEntry.isPending}>
              {addEntry.isPending ? "Salvando..." : "Registrar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Entries list */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : (registros?.length ?? 0) === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum registro no diário de obra.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {registros?.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">
                  {format(new Date(r.created_at), "dd/MM/yyyy 'às' HH:mm")}
                </p>
                <p className="text-sm whitespace-pre-wrap">{r.descricao}</p>
                {r.foto_url && (
                  <a href={r.foto_url} target="_blank" rel="noopener noreferrer">
                    <img src={r.foto_url} alt="Foto do diário" className="mt-3 rounded-lg max-h-48 object-cover" />
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Conformidade Tab ──
const ConformidadeTab = ({ obraId }: { obraId: string }) => {
  // Get colaboradores alocados
  const { data: alocacoes } = useQuery({
    queryKey: ["obra-equipe", obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores_obras")
        .select("colaborador_id, colaboradores(id, nome_completo)")
        .eq("obra_id", obraId)
        .eq("ativo", true);
      if (error) throw error;
      return data;
    },
  });

  const colabIds = alocacoes?.map((a) => a.colaborador_id) ?? [];

  // Get entregas vencidas for these colaboradores
  const { data: pendencias, isLoading } = useQuery({
    queryKey: ["obra-conformidade", obraId, colabIds],
    queryFn: async () => {
      if (colabIds.length === 0) return [];
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("entregas_epi")
        .select("id, data_vencimento, status, colaborador_id, colaboradores(nome_completo), epis(nome_epi)")
        .in("colaborador_id", colabIds)
        .lt("data_vencimento", today)
        .eq("status", "ativa");
      if (error) throw error;
      return data;
    },
    enabled: colabIds.length > 0,
  });

  const hasPendencias = (pendencias?.length ?? 0) > 0;

  return (
    <div className="space-y-4">
      <Card className={hasPendencias ? "border-destructive" : "border-green-500"}>
        <CardContent className="p-6 flex items-center gap-4">
          {hasPendencias ? (
            <>
              <AlertTriangle className="w-8 h-8 text-destructive shrink-0" />
              <div>
                <p className="font-semibold text-destructive">Pendências encontradas</p>
                <p className="text-sm text-muted-foreground">{pendencias?.length} EPI(s) vencido(s) para colaboradores desta obra.</p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0" />
              <div>
                <p className="font-semibold text-green-700 dark:text-green-400">Obra em conformidade</p>
                <p className="text-sm text-muted-foreground">Nenhum EPI vencido para os colaboradores alocados.</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {hasPendencias && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>EPI</TableHead>
                  <TableHead>Vencimento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendencias?.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.colaboradores?.nome_completo ?? "—"}</TableCell>
                    <TableCell>{p.epis?.nome_epi ?? "—"}</TableCell>
                    <TableCell className="text-destructive font-medium">
                      {format(new Date(p.data_vencimento + "T12:00:00"), "dd/MM/yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!isLoading && colabIds.length === 0 && (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Aloque colaboradores para verificar a conformidade de EPIs.</p>
        </CardContent></Card>
      )}
    </div>
  );
};

export default ObraDetalhe;
