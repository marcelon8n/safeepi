import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, FileCheck, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import RoleGate from "@/components/RoleGate";

const TIPOS_REQUISITO = [
  { value: "ASO", label: "ASO - Atestado de Saúde Ocupacional" },
  { value: "NR-06", label: "NR-06 - EPI" },
  { value: "NR-10", label: "NR-10 - Segurança em Eletricidade" },
  { value: "NR-18", label: "NR-18 - Construção Civil" },
  { value: "NR-33", label: "NR-33 - Espaço Confinado" },
  { value: "NR-35", label: "NR-35 - Trabalho em Altura" },
  { value: "INTEGRACAO", label: "Integração de Segurança" },
  { value: "FICHA_EPI", label: "Ficha de EPI Assinada" },
  { value: "OUTRO", label: "Outro" },
];

const Requisitos = () => {
  const { empresaId } = useEmpresaId();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filtroColab, setFiltroColab] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    colaborador_id: "",
    tipo_requisito: "",
    data_emissao: "",
    data_validade: "",
  });

  const { data: colaboradores } = useQuery({
    queryKey: ["colaboradores-ativos"],
    queryFn: async () => {
      const { data } = await supabase.from("colaboradores").select("id, nome_completo").eq("status", "ativo").order("nome_completo");
      return data ?? [];
    },
  });

  const { data: requisitos, isLoading } = useQuery({
    queryKey: ["requisitos-colaboradores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requisitos_colaboradores")
        .select("*, colaboradores(nome_completo)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("requisitos_colaboradores").insert({
        colaborador_id: form.colaborador_id,
        tipo_requisito: form.tipo_requisito,
        data_emissao: form.data_emissao || null,
        data_validade: form.data_validade || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["requisitos-colaboradores"] });
      toast.success("Requisito adicionado!");
      setOpen(false);
      setForm({ colaborador_id: "", tipo_requisito: "", data_emissao: "", data_validade: "" });
    },
    onError: () => toast.error("Erro ao salvar requisito."),
  });

  const today = new Date().toISOString().split("T")[0];

  const filtered = requisitos?.filter((r: any) => {
    const matchSearch = r.tipo_requisito.toLowerCase().includes(search.toLowerCase()) ||
      (r.colaboradores?.nome_completo ?? "").toLowerCase().includes(search.toLowerCase());
    const matchColab = !filtroColab || r.colaborador_id === filtroColab;
    return matchSearch && matchColab;
  }) ?? [];

  return (
    <AppLayout title="Requisitos de Colaboradores" description="Controle de documentos, certificações e treinamentos obrigatórios.">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar requisito ou colaborador..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filtroColab} onValueChange={setFiltroColab}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Todos os colaboradores" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {colaboradores?.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <RoleGate allowEdit>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Novo Requisito</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Adicionar Requisito</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label>Colaborador *</Label>
                    <Select value={form.colaborador_id} onValueChange={(v) => setForm({ ...form, colaborador_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{colaboradores?.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tipo de Requisito *</Label>
                    <Select value={form.tipo_requisito} onValueChange={(v) => setForm({ ...form, tipo_requisito: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{TIPOS_REQUISITO.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Data Emissão</Label><Input type="date" value={form.data_emissao} onChange={(e) => setForm({ ...form, data_emissao: e.target.value })} /></div>
                    <div><Label>Data Validade</Label><Input type="date" value={form.data_validade} onChange={(e) => setForm({ ...form, data_validade: e.target.value })} /></div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button onClick={() => save.mutate()} disabled={!form.colaborador_id || !form.tipo_requisito || save.isPending}>
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
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Requisito</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>
                )) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum requisito encontrado.</TableCell></TableRow>
                ) : filtered.map((r: any) => {
                  const vencido = r.data_validade && r.data_validade < today;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.colaboradores?.nome_completo ?? "—"}</TableCell>
                      <TableCell>{TIPOS_REQUISITO.find((t) => t.value === r.tipo_requisito)?.label ?? r.tipo_requisito}</TableCell>
                      <TableCell>{r.data_emissao ? format(new Date(r.data_emissao + "T12:00:00"), "dd/MM/yyyy") : "—"}</TableCell>
                      <TableCell>{r.data_validade ? format(new Date(r.data_validade + "T12:00:00"), "dd/MM/yyyy") : "—"}</TableCell>
                      <TableCell>
                        {vencido ? (
                          <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Vencido</Badge>
                        ) : r.status_verificado ? (
                          <Badge variant="default" className="gap-1"><CheckCircle2 className="w-3 h-3" />Verificado</Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Requisitos;
