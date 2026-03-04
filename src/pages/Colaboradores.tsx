import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, AlertTriangle, Power } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { useEmpresaPlan } from "@/hooks/useEmpresaPlan";
import RoleGate from "@/components/RoleGate";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Colaborador = Tables<"colaboradores">;
type Setor = Tables<"setores">;

// ── Setores Tab ──────────────────────────────────────────────────────────────

const SetoresTab = ({ empresaId }: { empresaId: string | null }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Setor | null>(null);
  const [form, setForm] = useState({ nome: "", email_encarregado: "" });

  const { data: setores, isLoading } = useQuery({
    queryKey: ["setores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("setores").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("setores").update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("setores").insert({ ...form, empresa_id: empresaId } as TablesInsert<"setores">);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["setores"] });
      toast.success(editing ? "Setor atualizado!" : "Setor cadastrado!");
      closeDialog();
    },
    onError: () => toast.error("Erro ao salvar setor."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("setores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["setores"] });
      toast.success("Setor removido!");
    },
    onError: () => toast.error("Erro ao remover setor."),
  });

  const openEdit = (s: Setor) => {
    setEditing(s);
    setForm({ nome: s.nome, email_encarregado: s.email_encarregado ?? "" });
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
    setForm({ nome: "", email_encarregado: "" });
  };

  return (
    <>
      <RoleGate allowWrite>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Novo Setor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Setor" : "Novo Setor"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Nome do Setor *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div>
                <Label>Email do Encarregado</Label>
                <Input value={form.email_encarregado} onChange={(e) => setForm({ ...form, email_encarregado: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button onClick={() => save.mutate()} disabled={!form.nome || save.isPending}>
                {save.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </RoleGate>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email Encarregado</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : setores?.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhum setor cadastrado.</TableCell></TableRow>
              ) : (
                setores?.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.nome}</TableCell>
                    <TableCell>{s.email_encarregado ?? "—"}</TableCell>
                    <TableCell>
                      <RoleGate allowWrite>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir setor</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o setor "{s.nome}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove.mutate(s.id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      </RoleGate>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};

// ── Colaboradores Tab ────────────────────────────────────────────────────────

const ColaboradoresTab = ({ empresaId }: { empresaId: string | null }) => {
  const { limiteColaboradores } = useEmpresaPlan();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Colaborador | null>(null);
  const [form, setForm] = useState({ nome_completo: "", cargo: "", setor_id: "", status: "ativo" });

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

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        nome_completo: form.nome_completo,
        cargo: form.cargo || null,
        setor_id: form.setor_id || null,
        status: form.status,
      };
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
    onError: () => toast.error("Erro ao salvar colaborador."),
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

  const toggleStatus = useMutation({
    mutationFn: async (c: Colaborador) => {
      const newStatus = c.status === "ativo" ? "inativo" : "ativo";
      const { error } = await supabase.from("colaboradores").update({ status: newStatus }).eq("id", c.id);
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success(`Colaborador ${newStatus === "ativo" ? "ativado" : "inativado"}!`);
    },
    onError: () => toast.error("Erro ao alterar status."),
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

  const getSetorNome = (c: any) => c.setores?.nome ?? "—";

  const totalColaboradores = colaboradores?.length ?? 0;
  const limitReached = !editing && limiteColaboradores !== null && totalColaboradores >= limiteColaboradores;

  return (
    <>
      {limitReached && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Limite de colaboradores atingido para o seu plano atual ({totalColaboradores}/{limiteColaboradores}). <a href="/precos" className="underline font-medium">Faça o upgrade para continuar</a>.
          </AlertDescription>
        </Alert>
      )}
      <RoleGate allowWrite>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button disabled={limitReached}><Plus className="w-4 h-4 mr-2" />Novo Colaborador</Button>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
              <Button onClick={() => save.mutate()} disabled={!form.nome_completo || save.isPending || limitReached}>
                {save.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </RoleGate>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : colaboradores?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum colaborador cadastrado.</TableCell></TableRow>
              ) : (
                colaboradores?.map((c) => (
                  <TableRow key={c.id} className={c.status === "inativo" ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{c.nome_completo}</TableCell>
                    <TableCell>{c.cargo ?? "—"}</TableCell>
                    <TableCell>{getSetorNome(c)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.status === "ativo" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                        {c.status ?? "ativo"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <RoleGate allowWrite>
                      <div className="flex gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleStatus.mutate(c)}
                                disabled={toggleStatus.isPending}
                              >
                                <Power className={`w-4 h-4 ${c.status === "ativo" ? "text-success" : "text-muted-foreground"}`} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {c.status === "ativo" ? "Inativar colaborador" : "Ativar colaborador"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
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
                      </div>
                      </RoleGate>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────

const Colaboradores = () => {
  const { empresaId } = useEmpresaId();

  return (
    <AppLayout title="Colaboradores" description="Gerencie setores e colaboradores da empresa">
      <Tabs defaultValue="setores" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="setores">Gestão de Setores</TabsTrigger>
          <TabsTrigger value="colaboradores">Colaboradores</TabsTrigger>
        </TabsList>
        <TabsContent value="setores">
          <SetoresTab empresaId={empresaId} />
        </TabsContent>
        <TabsContent value="colaboradores">
          <ColaboradoresTab empresaId={empresaId} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Colaboradores;
