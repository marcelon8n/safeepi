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
import { useEmpresaId } from "@/hooks/useEmpresaId";

type Epi = Tables<"epis">;

const CatalogoEpis = () => {
  const queryClient = useQueryClient();
  const { empresaId } = useEmpresaId();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Epi | null>(null);
  const [form, setForm] = useState({ nome_epi: "", ca_numero: "", periodicidade_dias: "" });

  const { data: epis, isLoading } = useQuery({
    queryKey: ["epis"],
    queryFn: async () => {
      const { data, error } = await supabase.from("epis").select("*").order("nome_epi");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        nome_epi: form.nome_epi,
        ca_numero: form.ca_numero || null,
        periodicidade_dias: parseInt(form.periodicidade_dias),
      };
      if (editing) {
        const { error } = await supabase.from("epis").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("epis").insert({ ...payload, empresa_id: empresaId } as TablesInsert<"epis">);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epis"] });
      toast.success(editing ? "EPI atualizado!" : "EPI cadastrado!");
      closeDialog();
    },
    onError: () => toast.error("Erro ao salvar EPI."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("epis").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epis"] });
      toast.success("EPI removido!");
    },
    onError: () => toast.error("Erro ao remover EPI."),
  });

  const openEdit = (e: Epi) => {
    setEditing(e);
    setForm({ nome_epi: e.nome_epi, ca_numero: e.ca_numero ?? "", periodicidade_dias: String(e.periodicidade_dias) });
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
    setForm({ nome_epi: "", ca_numero: "", periodicidade_dias: "" });
  };

  return (
    <AppLayout title="Catálogo de EPIs" description="Cadastre e gerencie os equipamentos de proteção">
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Novo EPI</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar EPI" : "Novo EPI"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Nome do EPI *</Label>
                <Input value={form.nome_epi} onChange={(e) => setForm({ ...form, nome_epi: e.target.value })} />
              </div>
              <div>
                <Label>Número do CA</Label>
                <Input value={form.ca_numero} onChange={(e) => setForm({ ...form, ca_numero: e.target.value })} />
              </div>
              <div>
                <Label>Periodicidade (dias) *</Label>
                <Input type="number" value={form.periodicidade_dias} onChange={(e) => setForm({ ...form, periodicidade_dias: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button onClick={() => save.mutate()} disabled={!form.nome_epi || !form.periodicidade_dias || save.isPending}>
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
                <TableHead>Nome do EPI</TableHead>
                <TableHead>CA</TableHead>
                <TableHead>Periodicidade (dias)</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : epis?.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum EPI cadastrado.</TableCell></TableRow>
              ) : (
                epis?.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.nome_epi}</TableCell>
                    <TableCell>{e.ca_numero ?? "—"}</TableCell>
                    <TableCell>{e.periodicidade_dias} dias</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove.mutate(e.id)}>
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

export default CatalogoEpis;
