import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Search, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import RoleGate from "@/components/RoleGate";

type Setor = Tables<"setores">;

const emailSchema = z.string().email("Formato de e-mail inválido").or(z.literal(""));

const Setores = () => {
  const { empresaId } = useEmpresaId();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Setor | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ nome: "", encarregado_nome: "", email_encarregado: "", observacoes: "" });
  const [emailError, setEmailError] = useState("");

  const { data: setores, isLoading } = useQuery({
    queryKey: ["setores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("setores").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: colaboradoresCount } = useQuery({
    queryKey: ["colaboradores-count-by-setor"],
    queryFn: async () => {
      const { data, error } = await supabase.from("colaboradores").select("setor_id").eq("status", "ativo");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((c) => {
        if (c.setor_id) counts[c.setor_id] = (counts[c.setor_id] || 0) + 1;
      });
      return counts;
    },
  });

  const filtered = setores?.filter((s) => s.nome.toLowerCase().includes(search.toLowerCase())) ?? [];

  const validateEmail = (email: string): boolean => {
    if (!email) { setEmailError(""); return true; }
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setEmailError(result.error.errors[0].message);
      return false;
    }
    setEmailError("");
    return true;
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!validateEmail(form.email_encarregado)) throw new Error("EMAIL_INVALIDO");
      const payload = { nome: form.nome, encarregado_nome: form.encarregado_nome || null, email_encarregado: form.email_encarregado || null };
      if (editing) {
        const { error } = await supabase.from("setores").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("setores").insert({ ...payload, empresa_id: empresaId } as TablesInsert<"setores">);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["setores"] });
      toast.success(editing ? "Setor atualizado!" : "Setor cadastrado!");
      closeDialog();
    },
    onError: (err: Error) => {
      if (err.message === "EMAIL_INVALIDO") return;
      toast.error("Erro ao salvar setor.");
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("setores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["setores"] });
      toast.success("Setor removido!");
    },
    onError: () => toast.error("Erro ao remover setor. Verifique se existem colaboradores vinculados."),
  });

  const openEdit = (s: Setor) => {
    setEditing(s);
    setForm({ nome: s.nome, encarregado_nome: (s as any).encarregado_nome ?? "", email_encarregado: s.email_encarregado ?? "", observacoes: "" });
    setEmailError("");
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
    setForm({ nome: "", encarregado_nome: "", email_encarregado: "", observacoes: "" });
    setEmailError("");
  };

  return (
    <AppLayout
      title="Setores"
      description="Gerencie a estrutura organizacional e departamentos da empresa."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar setor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <RoleGate allowEdit>
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
                    <Input
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder="Ex: Engenharia, Segurança do Trabalho"
                    />
                  </div>
                  <div>
                    <Label>E-mail do Encarregado</Label>
                    <Input
                      type="email"
                      value={form.email_encarregado}
                      onChange={(e) => {
                        setForm({ ...form, email_encarregado: e.target.value });
                        if (emailError) validateEmail(e.target.value);
                      }}
                      placeholder="encarregado@empresa.com"
                      className={emailError ? "border-destructive" : ""}
                    />
                    {emailError && (
                      <p className="text-xs text-destructive mt-1">{emailError}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Essencial para notificações automáticas via n8n.
                    </p>
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={form.observacoes}
                      onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                      placeholder="Descrição, localização ou notas sobre o setor (opcional)"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                  <Button
                    onClick={() => save.mutate()}
                    disabled={!form.nome || save.isPending || !!emailError}
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
                  <TableHead>E-mail Encarregado</TableHead>
                  <TableHead>Colaboradores</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhum setor encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          {s.nome}
                        </div>
                      </TableCell>
                      <TableCell>
                        {s.email_encarregado ?? (
                          <span className="text-muted-foreground italic">Não configurado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {colaboradoresCount?.[s.id] ?? 0} ativo(s)
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <RoleGate allowEdit>
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
                                    Tem certeza que deseja excluir "{s.nome}"? Colaboradores vinculados ficarão sem setor.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => remove.mutate(s.id)}>
                                    Excluir
                                  </AlertDialogAction>
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
      </div>
    </AppLayout>
  );
};

export default Setores;
