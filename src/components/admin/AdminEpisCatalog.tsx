import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Epi = Tables<"epis">;

const AdminEpisCatalog = () => {
  const queryClient = useQueryClient();
  const { empresaId } = useEmpresaId();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Epi | null>(null);
  const [form, setForm] = useState({ nome_epi: "", ca_numero: "", periodicidade_dias: "", custo_estimado: "" });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const perPage = 10;

  const { data: epis, isLoading } = useQuery({
    queryKey: ["admin-epis"],
    queryFn: async () => {
      const { data, error } = await supabase.from("epis").select("*").order("nome_epi");
      if (error) throw error;
      return data;
    },
  });

  const filtered = epis?.filter((e) => e.nome_epi.toLowerCase().includes(search.toLowerCase()) || (e.ca_numero ?? "").toLowerCase().includes(search.toLowerCase())) ?? [];
  const paginated = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        nome_epi: form.nome_epi,
        ca_numero: form.ca_numero || null,
        periodicidade_dias: parseInt(form.periodicidade_dias),
        custo_estimado: form.custo_estimado ? parseFloat(form.custo_estimado) : null,
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
      queryClient.invalidateQueries({ queryKey: ["admin-epis"] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-epis"] });
      toast.success("EPI removido!");
    },
    onError: () => toast.error("Erro ao remover EPI."),
  });

  const openEdit = (e: Epi) => {
    setEditing(e);
    setForm({ nome_epi: e.nome_epi, ca_numero: e.ca_numero ?? "", periodicidade_dias: String(e.periodicidade_dias), custo_estimado: e.custo_estimado ? String(e.custo_estimado) : "" });
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
    setForm({ nome_epi: "", ca_numero: "", periodicidade_dias: "", custo_estimado: "" });
  };

  return (
    <div className="space-y-4">
      <CardDescription>
        Estas são as regras mestre que definem quando um EPI deve ser trocado em qualquer obra.
      </CardDescription>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou CA..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Novo EPI</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar EPI" : "Novo EPI"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label>Nome do EPI *</Label><Input value={form.nome_epi} onChange={(e) => setForm({ ...form, nome_epi: e.target.value })} /></div>
              <div><Label>Número do CA</Label><Input value={form.ca_numero} onChange={(e) => setForm({ ...form, ca_numero: e.target.value })} /></div>
              <div><Label>Periodicidade (dias) *</Label><Input type="number" min={1} value={form.periodicidade_dias} onChange={(e) => setForm({ ...form, periodicidade_dias: e.target.value })} onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }} /></div>
              <div><Label>Custo Estimado (R$)</Label><Input type="number" step="0.01" min={0} placeholder="0,00" value={form.custo_estimado} onChange={(e) => setForm({ ...form, custo_estimado: e.target.value })} onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }} /></div>
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
                <TableHead>Periodicidade</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                </TableRow>
              )) : paginated.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum EPI encontrado.</TableCell></TableRow>
              ) : paginated.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.nome_epi}</TableCell>
                  <TableCell>{e.ca_numero ?? "—"}</TableCell>
                  <TableCell>{e.periodicidade_dias} dias</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Pencil className="w-4 h-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir EPI</AlertDialogTitle>
                            <AlertDialogDescription>Tem certeza que deseja excluir "{e.nome_epi}"?</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove.mutate(e.id)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{filtered.length} registro(s)</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>Anterior</Button>
            <span className="text-sm flex items-center px-2">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>Próximo</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEpisCatalog;
