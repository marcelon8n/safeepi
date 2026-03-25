import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import RoleGate from "@/components/RoleGate";
import { useFormDraft } from "@/hooks/useFormDraft";

type Epi = Tables<"epis">;

const CatalogoEpis = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { empresaId } = useEmpresaId();
  const [searchParams, setSearchParams] = useSearchParams();
  const modalParam = searchParams.get("modal");
  const open = modalParam === "novo-epi" || modalParam === "editar-epi";
  const [editingData, setEditingData] = useState<Epi | null>(null);
  const editing = modalParam === "editar-epi" ? editingData : null;
  const [form, setForm] = useState({ nome_epi: "", ca_numero: "", periodicidade_dias: "", fabricante: "", data_validade_ca: "", custo_estimado: "" });
  const isNewModal = modalParam === "novo-epi";
  const { clearDraft } = useFormDraft("draft_novo_epi", form, setForm, isNewModal);

  const today = new Date().toISOString().split("T")[0];

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
        fabricante: form.fabricante || null,
        data_validade_ca: form.data_validade_ca || null,
        custo_estimado: form.custo_estimado ? parseFloat(form.custo_estimado) : 0,
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
      clearDraft();
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
    setEditingData(e);
    setForm({
      nome_epi: e.nome_epi,
      ca_numero: e.ca_numero ?? "",
      periodicidade_dias: String(e.periodicidade_dias),
      fabricante: e.fabricante ?? "",
      data_validade_ca: e.data_validade_ca ?? "",
      custo_estimado: e.custo_estimado ? String(e.custo_estimado) : "",
    });
    const newParams = new URLSearchParams(searchParams);
    newParams.set("modal", "editar-epi");
    setSearchParams(newParams);
  };

  const closeDialog = () => {
    setEditingData(null);
    setForm({ nome_epi: "", ca_numero: "", periodicidade_dias: "", fabricante: "", data_validade_ca: "", custo_estimado: "" });
    clearDraft();
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("modal");
    setSearchParams(newParams);
  };

  const openNewDialog = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("modal", "novo-epi");
    setSearchParams(newParams);
  };

  const getCaStatus = (e: Epi) => {
    if (!e.data_validade_ca) return null;
    if (e.data_validade_ca < today) return "vencido";
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    if (e.data_validade_ca <= format(in30, "yyyy-MM-dd")) return "proximo";
    return "valido";
  };

  return (
    <AppLayout title="Catálogo de EPIs" description="Cadastre e gerencie os equipamentos de proteção">
      <RoleGate allowWrite>
      <div className="flex justify-end mb-4">
        <Button onClick={openNewDialog}><Plus className="w-4 h-4 mr-2" />Novo EPI</Button>
        <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar EPI" : "Novo EPI"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Nome do EPI *</Label>
                <Input value={form.nome_epi} onChange={(e) => setForm({ ...form, nome_epi: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Número do CA</Label>
                  <Input value={form.ca_numero} onChange={(e) => setForm({ ...form, ca_numero: e.target.value })} />
                </div>
                <div>
                  <Label>Validade do CA</Label>
                  <Input type="date" value={form.data_validade_ca} onChange={(e) => setForm({ ...form, data_validade_ca: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Fabricante</Label>
                <Input value={form.fabricante} onChange={(e) => setForm({ ...form, fabricante: e.target.value })} placeholder="Ex: 3M, Honeywell..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Periodicidade (dias) *</Label>
                  <Input type="number" min={1} value={form.periodicidade_dias} onChange={(e) => setForm({ ...form, periodicidade_dias: e.target.value })} onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }} />
                </div>
                <div>
                  <Label>Custo Estimado (R$)</Label>
                  <Input type="number" step="0.01" min={0} placeholder="0,00" value={form.custo_estimado} onChange={(e) => setForm({ ...form, custo_estimado: e.target.value })} onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }} />
                </div>
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
      </RoleGate>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do EPI</TableHead>
                <TableHead>CA</TableHead>
                <TableHead>Validade CA</TableHead>
                <TableHead>Fabricante</TableHead>
                <TableHead>Periodicidade</TableHead>
                <TableHead>Custo Est.</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : epis?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum EPI cadastrado.</TableCell></TableRow>
              ) : (
                epis?.map((e) => {
                  const caStatus = getCaStatus(e);
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.nome_epi}</TableCell>
                      <TableCell>{e.ca_numero ?? "—"}</TableCell>
                      <TableCell>
                        {e.data_validade_ca ? (
                          <Badge variant={caStatus === "vencido" ? "destructive" : caStatus === "proximo" ? "outline" : "secondary"}
                            className={caStatus === "proximo" ? "border-warning text-warning" : ""}>
                            {format(new Date(e.data_validade_ca), "dd/MM/yyyy")}
                          </Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell>{e.fabricante ?? "—"}</TableCell>
                      <TableCell>{e.periodicidade_dias} dias</TableCell>
                      <TableCell>{e.custo_estimado ? `R$ ${Number(e.custo_estimado).toFixed(2)}` : "—"}</TableCell>
                      <TableCell>
                        <RoleGate allowWrite>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" title="Registrar Entrega" onClick={() => navigate(`/entregas?epi=${e.id}`)}>
                            <ClipboardList className="w-4 h-4 text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
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
                                <AlertDialogTitle>Excluir EPI</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir "{e.nome_epi}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => remove.mutate(e.id)}>Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        </RoleGate>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default CatalogoEpis;
