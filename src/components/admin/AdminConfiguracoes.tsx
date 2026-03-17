import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HardHat, Network, ScrollText } from "lucide-react";
import AdminEpisCatalog from "./AdminEpisCatalog";
import AdminAuditLog from "./AdminAuditLog";

// Inline Setores management (adapted from pages/Setores without AppLayout wrapper)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Search, Building2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import RoleGate from "@/components/RoleGate";

type Setor = Tables<"setores">;
const emailSchema = z.string().email("Formato de e-mail inválido").or(z.literal(""));

const SetoresPanel = () => {
  const { empresaId } = useEmpresaId();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Setor | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ nome: "", encarregado_nome: "", email_encarregado: "" });
  const [emailError, setEmailError] = useState("");

  const { data: setores, isLoading } = useQuery({
    queryKey: ["setores-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("setores").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: colaboradoresCount } = useQuery({
    queryKey: ["colaboradores-count-by-setor"],
    queryFn: async () => {
      const { data } = await supabase.from("colaboradores").select("setor_id").eq("status", "ativo");
      const counts: Record<string, number> = {};
      data?.forEach((c) => { if (c.setor_id) counts[c.setor_id] = (counts[c.setor_id] || 0) + 1; });
      return counts;
    },
  });

  const filtered = setores?.filter((s) => s.nome.toLowerCase().includes(search.toLowerCase())) ?? [];

  const validateEmail = (email: string) => {
    if (!email) { setEmailError(""); return true; }
    const result = emailSchema.safeParse(email);
    if (!result.success) { setEmailError(result.error.errors[0].message); return false; }
    setEmailError(""); return true;
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["setores-list"] }); toast.success(editing ? "Setor atualizado!" : "Setor cadastrado!"); closeDialog(); },
    onError: (err: Error) => { if (err.message !== "EMAIL_INVALIDO") toast.error("Erro ao salvar setor."); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("setores").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["setores-list"] }); toast.success("Setor removido!"); },
    onError: () => toast.error("Erro ao remover setor."),
  });

  const openEdit = (s: Setor) => { setEditing(s); setForm({ nome: s.nome, encarregado_nome: s.encarregado_nome ?? "", email_encarregado: s.email_encarregado ?? "" }); setEmailError(""); setOpen(true); };
  const closeDialog = () => { setOpen(false); setEditing(null); setForm({ nome: "", encarregado_nome: "", email_encarregado: "" }); setEmailError(""); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar setor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <RoleGate allowEdit>
          <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo Setor</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Editar Setor" : "Novo Setor"}</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div><Label>Nome do Setor *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
                <div><Label>Nome do Encarregado</Label><Input value={form.encarregado_nome} onChange={(e) => setForm({ ...form, encarregado_nome: e.target.value })} /></div>
                <div>
                  <Label>E-mail do Encarregado</Label>
                  <Input type="email" value={form.email_encarregado} onChange={(e) => { setForm({ ...form, email_encarregado: e.target.value }); if (emailError) validateEmail(e.target.value); }} className={emailError ? "border-destructive" : ""} />
                  {emailError && <p className="text-xs text-destructive mt-1">{emailError}</p>}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                <Button onClick={() => save.mutate()} disabled={!form.nome || save.isPending || !!emailError}>{save.isPending ? "Salvando..." : "Salvar"}</Button>
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
                <TableHead>Encarregado</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Colaboradores</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>
              )) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum setor encontrado.</TableCell></TableRow>
              ) : filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium"><div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" />{s.nome}</div></TableCell>
                  <TableCell>{s.encarregado_nome || <span className="text-muted-foreground italic">—</span>}</TableCell>
                  <TableCell className="text-muted-foreground">{s.email_encarregado || "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{colaboradoresCount?.[s.id] ?? 0} ativo(s)</Badge></TableCell>
                  <TableCell>
                    <RoleGate allowEdit>
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
                    </RoleGate>
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

const AdminConfiguracoes = () => {
  return (
    <Tabs defaultValue="setores" className="w-full">
      <TabsList className="mb-4 flex-wrap h-auto gap-1">
        <TabsTrigger value="setores" className="gap-2">
          <Network className="w-4 h-4" />
          Setores
        </TabsTrigger>
        <TabsTrigger value="epis" className="gap-2">
          <HardHat className="w-4 h-4" />
          Catálogo de EPIs
        </TabsTrigger>
        <TabsTrigger value="auditoria" className="gap-2">
          <ScrollText className="w-4 h-4" />
          Auditoria
        </TabsTrigger>
      </TabsList>
      <TabsContent value="setores"><SetoresPanel /></TabsContent>
      <TabsContent value="epis"><AdminEpisCatalog /></TabsContent>
      <TabsContent value="auditoria"><AdminAuditLog /></TabsContent>
    </Tabs>
  );
};

export default AdminConfiguracoes;
