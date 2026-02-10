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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Colaborador = Tables<"colaboradores">;

const Colaboradores = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Colaborador | null>(null);
  const [form, setForm] = useState({ nome_completo: "", cargo: "", email_encarregado: "" });

  const { data: colaboradores, isLoading } = useQuery({
    queryKey: ["colaboradores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("colaboradores").select("*").order("nome_completo");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("colaboradores").update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("colaboradores").insert(form as TablesInsert<"colaboradores">);
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

  const openEdit = (c: Colaborador) => {
    setEditing(c);
    setForm({ nome_completo: c.nome_completo, cargo: c.cargo ?? "", email_encarregado: c.email_encarregado ?? "" });
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
    setForm({ nome_completo: "", cargo: "", email_encarregado: "" });
  };

  return (
    <AppLayout title="Colaboradores" description="Gerencie os colaboradores da empresa">
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Novo Colaborador</Button>
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
                <Label>Email do Encarregado</Label>
                <Input value={form.email_encarregado} onChange={(e) => setForm({ ...form, email_encarregado: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button onClick={() => save.mutate()} disabled={!form.nome_completo || save.isPending}>
                {save.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Email Encarregado</TableHead>
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
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome_completo}</TableCell>
                    <TableCell>{c.cargo ?? "—"}</TableCell>
                    <TableCell>{c.email_encarregado ?? "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.status === "ativo" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                        {c.status ?? "ativo"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove.mutate(c.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default Colaboradores;
