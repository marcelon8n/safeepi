import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, MapPin, Calendar, User, AlertTriangle, Building2, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ativa: { label: "Iniciada", variant: "default" },
  pausada: { label: "Pausada", variant: "secondary" },
  finalizada: { label: "Finalizada", variant: "outline" },
};

const Obras = () => {
  const navigate = useNavigate();
  const { empresaId } = useEmpresaId();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "", cliente: "", endereco: "", cidade: "", responsavel: "",
    data_inicio: format(new Date(), "yyyy-MM-dd"), data_prevista_fim: "", status: "ativa",
    requisitos_obrigatorios: [] as string[],
  });

  const REQUISITOS_PADRAO = [
    { value: "ASO", label: "ASO (Atestado de Saúde Ocupacional)", group: "Saúde" },
    { value: "NR-01", label: "NR-01 (Integração)", group: "Treinamentos" },
    { value: "NR-10", label: "NR-10 (Elétrica)", group: "Treinamentos" },
    { value: "NR-12", label: "NR-12 (Máquinas)", group: "Treinamentos" },
    { value: "NR-18", label: "NR-18 (Construção Civil)", group: "Treinamentos" },
    { value: "NR-33", label: "NR-33 (Espaço Confinado)", group: "Treinamentos" },
    { value: "NR-35", label: "NR-35 (Trabalho em Altura)", group: "Treinamentos" },
    { value: "Ficha de EPI", label: "Ficha de EPI Atualizada (NR-06)", group: "Equipamentos" },
  ];

  const toggleRequisito = (value: string) => {
    setForm((prev) => ({
      ...prev,
      requisitos_obrigatorios: prev.requisitos_obrigatorios.includes(value)
        ? prev.requisitos_obrigatorios.filter((r) => r !== value)
        : [...prev.requisitos_obrigatorios, value],
    }));
  };
  const [alvaraFile, setAlvaraFile] = useState<File | null>(null);

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
    queryKey: ["obras-dashboard", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase.from("obras").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  // Fetch conformidade data per obra
  const { data: entregas } = useQuery({
    queryKey: ["obras-conformidade", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entregas_epi")
        .select("id, status, data_vencimento, colaborador_id, colaboradores_obras!inner(obra_id)")
        .lt("data_vencimento", new Date().toISOString().split("T")[0]);
      // If join fails, return empty
      if (error) return [];
      return data;
    },
    enabled: !!empresaId,
  });

  const save = useMutation({
    mutationFn: async () => {
      let alvara_url: string | null = null;
      if (alvaraFile) {
        const filePath = `${empresaId}/${Date.now()}-${alvaraFile.name}`;
        const { error: uploadError } = await supabase.storage.from("obras-documentos").upload(filePath, alvaraFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("obras-documentos").getPublicUrl(filePath);
        alvara_url = urlData.publicUrl;
      }
      const payload: any = {
        nome: form.nome, cliente: form.cliente || null, endereco: form.endereco || null,
        cidade: form.cidade || null, responsavel: form.responsavel || null,
        data_inicio: form.data_inicio, data_prevista_fim: form.data_prevista_fim || null,
        status: form.status, empresa_id: empresaId,
        requisitos_obrigatorios: form.requisitos_obrigatorios,
      };
      if (alvara_url) payload.alvara_url = alvara_url;
      const { error } = await supabase.from("obras").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obras-dashboard"] });
      qc.invalidateQueries({ queryKey: ["limite-obras"] });
      toast.success("Obra cadastrada!");
      closeDialog();
    },
    onError: () => toast.error("Erro ao cadastrar obra."),
  });

  const closeDialog = () => {
    setOpen(false);
    setAlvaraFile(null);
    setForm({ nome: "", cliente: "", endereco: "", cidade: "", responsavel: "", data_inicio: format(new Date(), "yyyy-MM-dd"), data_prevista_fim: "", status: "ativa", requisitos_obrigatorios: [] });
  };

  const filtered = obras?.filter((o) =>
    o.nome.toLowerCase().includes(search.toLowerCase()) ||
    (o.cidade ?? "").toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const activeCount = obras?.filter((o) => o.status === "ativa").length ?? 0;
  const pausedCount = obras?.filter((o) => o.status === "pausada").length ?? 0;
  const finishedCount = obras?.filter((o) => o.status === "finalizada").length ?? 0;

  return (
    <AppLayout title="Gestão de Obras" description="Gerencie seus canteiros de obras, equipes e documentação">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
            <p className="text-2xl font-bold">{obras?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Ativas</p>
            <p className="text-2xl font-bold">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Pausadas</p>
            <p className="text-2xl font-bold">{pausedCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-muted-foreground">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Finalizadas</p>
            <p className="text-2xl font-bold">{finishedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Limit alert */}
      {!podeCriar && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>Você atingiu o limite de {limiteObras?.total_atual} obras do plano atual. Faça upgrade para obras ilimitadas.</span>
            <Button size="sm" variant="outline" onClick={() => navigate("/precos")}>Ver planos</Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar obra ou cidade..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button disabled={!podeCriar} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />Nova Obra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Cadastrar Nova Obra</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label>Nome da Obra *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Edifício Aurora" /></div>
              <div><Label>Cliente</Label><Input value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} placeholder="Nome do cliente" /></div>
              <div><Label>Endereço Completo</Label><Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Rua, número, bairro" /></div>
              <div><Label>Cidade</Label><Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Data de Início *</Label><Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} /></div>
                <div><Label>Previsão de Término</Label><Input type="date" value={form.data_prevista_fim} onChange={(e) => setForm({ ...form, data_prevista_fim: e.target.value })} /></div>
              </div>
              <div><Label>Engenheiro Responsável</Label><Input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} /></div>
              <div>
                <Label className="mb-2 block flex items-center gap-2"><ShieldCheck className="w-4 h-4" />Requisitos de Acesso</Label>
                <p className="text-xs text-muted-foreground mb-3">Selecione os documentos obrigatórios para alocação nesta obra.</p>
                {["Saúde", "Treinamentos", "Equipamentos"].map((group) => (
                  <div key={group} className="mb-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{group}</p>
                    <div className="space-y-1.5">
                      {REQUISITOS_PADRAO.filter((r) => r.group === group).map((r) => (
                        <label key={r.value} className="flex items-center gap-2 cursor-pointer text-sm hover:bg-muted/50 rounded px-2 py-1 transition-colors">
                          <Checkbox
                            checked={form.requisitos_obrigatorios.includes(r.value)}
                            onCheckedChange={() => toggleRequisito(r.value)}
                          />
                          {r.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <Label>Alvará / Documento</Label>
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setAlvaraFile(e.target.files?.[0] ?? null)} />
                <p className="text-xs text-muted-foreground mt-1">PDF, JPG ou PNG até 10MB</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button onClick={() => save.mutate()} disabled={!form.nome || !form.data_inicio || save.isPending}>
                {save.isPending ? "Salvando..." : "Cadastrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Obra Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Nenhuma obra encontrada</p>
            <p className="text-sm mt-1">Cadastre sua primeira obra para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((obra) => {
            const cfg = statusConfig[obra.status ?? "ativa"] ?? statusConfig.ativa;
            return (
              <Card
                key={obra.id}
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => navigate(`/obras/${obra.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">{obra.nome}</CardTitle>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                  {(obra as any).cliente && (
                    <p className="text-sm text-muted-foreground">{(obra as any).cliente}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {(obra.cidade || (obra as any).endereco) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{(obra as any).endereco || obra.cidade}</span>
                    </div>
                  )}
                  {obra.responsavel && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span>{obra.responsavel}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Início: {format(new Date(obra.data_inicio + "T12:00:00"), "dd/MM/yyyy")}
                      {obra.data_prevista_fim && ` — Prev: ${format(new Date(obra.data_prevista_fim + "T12:00:00"), "dd/MM/yyyy")}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-end pt-2">
                    <span className="text-xs text-primary group-hover:underline flex items-center gap-1">
                      Ver detalhes <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default Obras;
