import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, AlertTriangle, Search, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { useEmpresaPlan } from "@/hooks/useEmpresaPlan";
import RoleGate from "@/components/RoleGate";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import ColaboradorSheet from "@/components/colaboradores/ColaboradorSheet";
type Colaborador = Tables<"colaboradores">;

const Colaboradores = () => {
  const { empresaId } = useEmpresaId();
  const { limiteColaboradores } = useEmpresaPlan();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Colaborador | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [form, setForm] = useState({ nome_completo: "", cargo: "", setor_id: "", status: "ativo" });

  // Modal: histórico de EPIs
  const [histOpen, setHistOpen] = useState(false);
  const [histColabId, setHistColabId] = useState<string | null>(null);
  const [histColabNome, setHistColabNome] = useState("");

  const { data: setores } = useQuery({
    queryKey: ["setores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("setores").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: colaboradores, isLoading } = useQuery({
    queryKey: ["colaboradores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores")
        .select("*, setores(nome)")
        .order("nome_completo");
      if (error) throw error;
      return data;
    },
  });

  const { data: historicoEpis, isLoading: histLoading } = useQuery({
    queryKey: ["historico-epis", histColabId],
    queryFn: async () => {
      if (!histColabId) return [];
      const { data, error } = await supabase
        .from("entregas_epi")
        .select("*, epis(nome_epi)")
        .eq("colaborador_id", histColabId)
        .order("data_entrega", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!histColabId,
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        nome_completo: form.nome_completo,
        cargo: form.cargo || null,
        setor_id: form.setor_id || null,
        status: form.status,
      };

      if (editing && form.status === "ativo" && editing.status !== "ativo") {
        const ativos = colaboradores?.filter((c) => c.status === "ativo").length ?? 0;
        if (limiteColaboradores !== null && ativos >= limiteColaboradores) {
          throw new Error("LIMITE_ATINGIDO");
        }
      }

      if (editing) {
        const { error } = await supabase.from("colaboradores").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("colaboradores").insert({ ...payload, empresa_id: empresaId } as TablesInsert<"colaboradores">);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success(editing ? "Colaborador atualizado!" : "Colaborador cadastrado!");
      closeDialog();
    },
    onError: (err: Error) => {
      if (err.message === "LIMITE_ATINGIDO") {
        toast.error("Limite de colaboradores ativos atingido. Faça o upgrade do plano.", {
          action: { label: "Ver planos", onClick: () => window.location.href = "/precos" },
        });
      } else {
        toast.error("Erro ao salvar colaborador.");
      }
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("colaboradores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success("Colaborador removido!");
    },
    onError: () => toast.error("Erro ao remover colaborador."),
  });

  const openEdit = (c: Colaborador) => {
    setEditing(c);
    setForm({
      nome_completo: c.nome_completo,
      cargo: c.cargo ?? "",
      setor_id: (c as any).setor_id ?? "",
      status: c.status ?? "ativo",
    });
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
    setForm({ nome_completo: "", cargo: "", setor_id: "", status: "ativo" });
  };

  const openHistorico = (c: Colaborador) => {
    setHistColabId(c.id);
    setHistColabNome(c.nome_completo);
    setHistOpen(true);
  };

  const getSetorNome = (c: any) => c.setores?.nome ?? "—";

  const filtered = colaboradores?.filter((c) => {
    const matchSearch = c.nome_completo.toLowerCase().includes(search.toLowerCase()) ||
      (c.cargo ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "todos" || c.status === filterStatus;
    return matchSearch && matchStatus;
  }) ?? [];

  const totalAtivos = colaboradores?.filter((c) => c.status === "ativo").length ?? 0;
  const limitReached = !editing && limiteColaboradores !== null && totalAtivos >= limiteColaboradores;

  return (
    <AppLayout
      title="Colaboradores"
      description="Cadastro e consulta de colaboradores da empresa."
    >
      <div className="space-y-4">
        {limitReached && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Limite de colaboradores ativos atingido ({totalAtivos}/{limiteColaboradores}).{" "}
              <a href="/precos" className="underline font-medium">Faça o upgrade</a>.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou cargo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <RoleGate allowEdit>
            <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
              <DialogTrigger asChild>
                <Button disabled={limitReached}>
                  <Plus className="w-4 h-4 mr-2" />Novo Colaborador
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label>Nome Completo *</Label>
                    <Input value={form.nome_completo} onChange={(e) => setForm({ ...form, nome_completo: e.target.value })} />
                  </div>
                  <div>
                    <Label>Cargo</Label>
                    <Input value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
                  </div>
                  <div>
                    <Label>Setor</Label>
                    <Select value={form.setor_id} onValueChange={(v) => setForm({ ...form, setor_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um setor" />
                      </SelectTrigger>
                      <SelectContent>
                        {setores?.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {editing && (
                    <div>
                      <Label>Status</Label>
                      <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                  <Button
                    onClick={() => save.mutate()}
                    disabled={!form.nome_completo || save.isPending || limitReached}
                  >
                    {save.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </RoleGate>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum colaborador encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id} className={c.status === "inativo" ? "opacity-50" : ""}>
                      <TableCell className="font-medium">{c.nome_completo}</TableCell>
                      <TableCell>{c.cargo ?? "—"}</TableCell>
                      <TableCell>{getSetorNome(c)}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === "ativo" ? "default" : "secondary"}>
                          {c.status ?? "ativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openHistorico(c)} title="Histórico de EPIs">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <RoleGate allowEdit>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <RoleGate allowDelete>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir colaborador</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir "{c.nome_completo}"? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => remove.mutate(c.id)}>Excluir</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </RoleGate>
                          </RoleGate>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Modal: Histórico de EPIs (somente leitura) */}
        <Dialog open={histOpen} onOpenChange={setHistOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Histórico de EPIs — {histColabNome}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>EPI</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {histLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : !historicoEpis?.length ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum registro de entrega encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    historicoEpis.map((e: any) => {
                      const vencido = new Date(e.data_vencimento) < new Date();
                      return (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">{e.epis?.nome_epi ?? "—"}</TableCell>
                          <TableCell>{format(new Date(e.data_entrega), "dd/MM/yyyy")}</TableCell>
                          <TableCell>{format(new Date(e.data_vencimento), "dd/MM/yyyy")}</TableCell>
                          <TableCell>
                            <Badge variant={vencido ? "destructive" : e.status === "ativa" ? "default" : "secondary"}>
                              {vencido ? "Vencido" : e.status ?? "ativa"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Colaboradores;
