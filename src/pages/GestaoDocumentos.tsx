import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, FileText, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const TIPOS_REQUISITO = [
  { value: "ASO", label: "ASO - Atestado de Saúde Ocupacional" },
  { value: "NR-35", label: "NR-35 - Trabalho em Altura" },
  { value: "NR-10", label: "NR-10 - Segurança em Eletricidade" },
  { value: "NR-33", label: "NR-33 - Espaço Confinado" },
  { value: "Integração", label: "Integração de Segurança" },
  { value: "CIPA", label: "CIPA" },
  { value: "Outro", label: "Outro" },
];

const GestaoDocumentos = () => {
  const { empresaId } = useEmpresaId();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedColabId, setSelectedColabId] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    colaborador_id: "",
    tipo_requisito: "",
    data_emissao: "",
    data_validade: "",
  });

  // Fetch colaboradores
  const { data: colaboradores } = useQuery({
    queryKey: ["colaboradores-docs", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores")
        .select("id, nome_completo, cargo")
        .eq("status", "ativo")
        .order("nome_completo");
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  // Fetch requisitos for selected colaborador
  const { data: requisitos, isLoading } = useQuery({
    queryKey: ["requisitos", selectedColabId],
    queryFn: async () => {
      if (!selectedColabId) return [];
      const { data, error } = await supabase
        .from("requisitos_colaboradores")
        .select("*")
        .eq("colaborador_id", selectedColabId)
        .order("data_validade", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedColabId,
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
      qc.invalidateQueries({ queryKey: ["requisitos", selectedColabId] });
      toast.success("Documento registrado com sucesso!");
      setOpen(false);
      setForm({ colaborador_id: "", tipo_requisito: "", data_emissao: "", data_validade: "" });
    },
    onError: () => toast.error("Erro ao registrar documento."),
  });

  const filteredColabs = colaboradores?.filter((c) =>
    c.nome_completo.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const today = new Date().toISOString().split("T")[0];

  const isVencido = (dataValidade: string | null) => {
    if (!dataValidade) return true;
    return dataValidade < today;
  };

  return (
    <AppLayout title="Gestão de Documentos" description="Registre e acompanhe ASOs, NRs e integrações dos colaboradores">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar colaborador por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />Novo Documento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Documento</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Colaborador *</Label>
                <Select value={form.colaborador_id} onValueChange={(v) => setForm({ ...form, colaborador_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {colaboradores?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de Requisito *</Label>
                <Select value={form.tipo_requisito} onValueChange={(v) => setForm({ ...form, tipo_requisito: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_REQUISITO.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data de Emissão</Label>
                  <Input type="date" value={form.data_emissao} onChange={(e) => setForm({ ...form, data_emissao: e.target.value })} />
                </div>
                <div>
                  <Label>Data de Validade</Label>
                  <Input type="date" value={form.data_validade} onChange={(e) => setForm({ ...form, data_validade: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button
                onClick={() => save.mutate()}
                disabled={!form.colaborador_id || !form.tipo_requisito || save.isPending}
              >
                {save.isPending ? "Salvando..." : "Registrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Colaboradores list with click to show docs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Colaboradores</CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[500px] overflow-y-auto">
              {filteredColabs.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedColabId(c.id)}
                  className={`w-full text-left px-4 py-3 border-b last:border-0 transition-colors hover:bg-muted/50 ${
                    selectedColabId === c.id ? "bg-muted" : ""
                  }`}
                >
                  <p className="font-medium text-sm">{c.nome_completo}</p>
                  <p className="text-xs text-muted-foreground">{c.cargo ?? "Sem cargo"}</p>
                </button>
              ))}
              {filteredColabs.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum colaborador encontrado.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {!selectedColabId ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Selecione um colaborador</p>
                <p className="text-sm mt-1">Clique em um nome ao lado para ver seus documentos.</p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (requisitos?.length ?? 0) === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Nenhum documento registrado.</p>
                <p className="text-sm mt-1">Use o botão "Novo Documento" para adicionar.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Emissão</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requisitos?.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.tipo_requisito}</TableCell>
                        <TableCell>
                          {r.data_emissao ? format(new Date(r.data_emissao + "T12:00:00"), "dd/MM/yyyy") : "—"}
                        </TableCell>
                        <TableCell>
                          {r.data_validade ? format(new Date(r.data_validade + "T12:00:00"), "dd/MM/yyyy") : "—"}
                        </TableCell>
                        <TableCell>
                          {isVencido(r.data_validade) ? (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="w-3 h-3" />Vencido
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 border-green-500 text-green-700 dark:text-green-400">
                              <CheckCircle2 className="w-3 h-3" />Válido
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default GestaoDocumentos;
