import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Search, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Obra = Tables<"obras">;
type Setor = Tables<"setores">;

// ── Obras ──
const ObrasSection = ({ empresaId }: { empresaId: string | null }) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Obra | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ nome: "", cidade: "", responsavel: "", data_inicio: format(new Date(), "yyyy-MM-dd"), status: "ativa" });

  const { data: limiteObras } = useQuery({
    queryKey: ["limite-obras", empresaId],
    queryFn: async () => {
      if (!empresaId) return null;
      const { data, error } = await supabase.rpc("verificar_limite_obras", { empresa_uuid: empresaId });
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!empresaId,
  });

  const podeCriar = limiteObras?.pode_criar ?? true;

  const { data: obras, isLoading } = useQuery({
    queryKey: ["admin-obras"],
    queryFn: async () => {
      const { data, error } = await supabase.from("obras").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const filtered = obras?.filter((o) => o.nome.toLowerCase().includes(search.toLowerCase())) ?? [];

  const save = useMutation({
    mutationFn: async () => {
      const payload = { nome: form.nome, cidade: form.cidade || null, responsavel: form.responsavel || null, data_inicio: form.data_inicio, status: form.status };
      if (editing) {
        const { error } = await supabase.from("obras").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("obras").insert({ ...payload, empresa_id: empresaId } as TablesInsert<"obras">);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-obras"] }); qc.invalidateQueries({ queryKey: ["limite-obras"] }); toast.success(editing ? "Obra atualizada!" : "Obra cadastrada!"); closeDialog(); },
    onError: () => toast.error("Erro ao salvar obra."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("obras").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-obras"] }); qc.invalidateQueries({ queryKey: ["limite-obras"] }); toast.success("Obra removida!"); },
    onError: () => toast.error("Erro ao remover obra."),
  });

  const openEdit = (o: Obra) => {
    setEditing(o);
    setForm({ nome: o.nome, cidade: o.cidade ?? "", responsavel: o.responsavel ?? "", data_inicio: o.data_inicio, status: o.status ?? "ativa" });
    setOpen(true);
  };

  const closeDialog = () => { setOpen(false); setEditing(null); setForm({ nome: "", cidade: "", responsavel: "", data_inicio: format(new Date(), "yyyy-MM-dd"), status: "ativa" }); };

  return (
    <div className="space-y-4">
      {!podeCriar && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Você atingiu o limite de {limiteObras?.total_atual} obras do plano atual. Faça upgrade para o plano Gestão Avançada para obras ilimitadas.
          </AlertDescription>
        </Alert>
      )}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar obra..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild><Button disabled={!podeCriar}><Plus className="w-4 h-4 mr-2" />Nova Obra</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar Obra" : "Nova Obra"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div><Label>Cidade</Label><Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></div>
              <div><Label>Responsável</Label><Input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} /></div>
              <div><Label>Data de Início *</Label><Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button onClick={() => save.mutate()} disabled={!form.nome || !form.data_inicio || save.isPending}>{save.isPending ? "Salvando..." : "Salvar"}</Button>
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
                <TableHead>Cidade</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>
              )) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma obra encontrada.</TableCell></TableRow>
              ) : filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.nome}</TableCell>
                  <TableCell>{o.cidade ?? "—"}</TableCell>
                  <TableCell>{o.responsavel ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={o.status === "ativa" ? "default" : "secondary"}>{o.status ?? "ativa"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(o)}><Pencil className="w-4 h-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Excluir obra</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir "{o.nome}"?</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => remove.mutate(o.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
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

// ── Setores ──
const SetoresSection = ({ empresaId }: { empresaId: string | null }) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Setor | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ nome: "", email_encarregado: "" });

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
      if (editing) {
        const { error } = await supabase.from("setores").update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("setores").insert({ ...form, empresa_id: empresaId } as TablesInsert<"setores">);
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

  const openEdit = (s: Setor) => { setEditing(s); setForm({ nome: s.nome, email_encarregado: s.email_encarregado ?? "" }); setOpen(true); };
  const closeDialog = () => { setOpen(false); setEditing(null); setForm({ nome: "", email_encarregado: "" }); };

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
              <div><Label>Email do Encarregado</Label><Input type="email" value={form.email_encarregado} onChange={(e) => setForm({ ...form, email_encarregado: e.target.value })} placeholder="Essencial para notificações automáticas" /></div>
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
                <TableHead>Email Encarregado</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 3 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>
              )) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhum setor encontrado.</TableCell></TableRow>
              ) : filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.nome}</TableCell>
                  <TableCell>{s.email_encarregado ?? <span className="text-muted-foreground italic">Não configurado</span>}</TableCell>
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
  return (
    <Tabs defaultValue="obras" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="obras">Obras</TabsTrigger>
        <TabsTrigger value="setores">Setores</TabsTrigger>
      </TabsList>
      <TabsContent value="obras"><ObrasSection empresaId={empresaId} /></TabsContent>
      <TabsContent value="setores"><SetoresSection empresaId={empresaId} /></TabsContent>
    </Tabs>
  );
};

export default AdminStructure;
