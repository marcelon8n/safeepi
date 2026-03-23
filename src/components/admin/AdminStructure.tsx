import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { Card, CardContent } from "@/components/ui/card";
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

type Setor = Tables<"setores">;

// ── Setores ──
export const SetoresSection = ({ empresaId, canEdit = true }: { empresaId: string | null; canEdit?: boolean }) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Setor | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ nome: "", encarregado_nome: "", email_encarregado: "" });

  const { data: setores, isLoading } = useQuery({
    queryKey: ["admin-setores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("setores").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const filtered = setores?.filter((s) => s.nome.toLowerCase().includes(search.toLowerCase())) ?? [];

  const save = useMutation({
    mutationFn: async () => {
      const payload = { nome: form.nome, encarregado_nome: form.encarregado_nome || null, email_encarregado: form.email_encarregado || null };
      if (editing) {
        const { error } = await supabase.from("setores").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("setores").insert({ ...payload, empresa_id: empresaId } as TablesInsert<"setores">);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-setores"] }); toast.success(editing ? "Setor atualizado!" : "Setor cadastrado!"); closeDialog(); },
    onError: () => toast.error("Erro ao salvar setor."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("setores").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-setores"] }); toast.success("Setor removido!"); },
    onError: () => toast.error("Erro ao remover setor."),
  });

  const openEdit = (s: Setor) => { setEditing(s); setForm({ nome: s.nome, encarregado_nome: s.encarregado_nome ?? "", email_encarregado: s.email_encarregado ?? "" }); setOpen(true); };
  const closeDialog = () => { setOpen(false); setEditing(null); setForm({ nome: "", encarregado_nome: "", email_encarregado: "" }); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar setor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo Setor</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar Setor" : "Novo Setor"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label>Nome do Setor *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div><Label>Nome do Encarregado</Label><Input value={form.encarregado_nome} onChange={(e) => setForm({ ...form, encarregado_nome: e.target.value })} placeholder="Ex: João Silva" /></div>
              <div><Label>E-mail do Encarregado</Label><Input type="email" value={form.email_encarregado} onChange={(e) => setForm({ ...form, email_encarregado: e.target.value })} placeholder="Essencial para notificações automáticas" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button onClick={() => save.mutate()} disabled={!form.nome || save.isPending}>{save.isPending ? "Salvando..." : "Salvar"}</Button>
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
                <TableHead>Encarregado</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 4 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>
              )) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum setor encontrado.</TableCell></TableRow>
              ) : filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.nome}</TableCell>
                  <TableCell>{s.encarregado_nome ? <span className="font-medium">{s.encarregado_nome}</span> : <span className="text-muted-foreground italic">—</span>}</TableCell>
                  <TableCell>{s.email_encarregado ? <span className="text-sm text-muted-foreground">{s.email_encarregado}</span> : <span className="text-muted-foreground italic">—</span>}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Excluir setor</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir "{s.nome}"?</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => remove.mutate(s.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
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
    </div>
  );
};

const AdminStructure = () => {
  const { empresaId } = useEmpresaId();
  return <SetoresSection empresaId={empresaId} />;
};

export default AdminStructure;
