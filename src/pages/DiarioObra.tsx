import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, BookOpen, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import RoleGate from "@/components/RoleGate";

const DiarioObra = () => {
  const { empresaId } = useEmpresaId();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filtroObra, setFiltroObra] = useState("");
  const [form, setForm] = useState({ obra_id: "", descricao: "" });

  const { data: obras } = useQuery({
    queryKey: ["obras-ativas"],
    queryFn: async () => {
      const { data } = await supabase.from("obras").select("id, nome").eq("status", "ativa").order("nome");
      return data ?? [];
    },
  });

  const { data: registros, isLoading } = useQuery({
    queryKey: ["diario-obra", filtroObra],
    queryFn: async () => {
      let query = supabase
        .from("diario_obra")
        .select("*, obras(nome)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (filtroObra) query = query.eq("obra_id", filtroObra);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("diario_obra").insert({
        obra_id: form.obra_id,
        descricao: form.descricao,
        empresa_id: empresaId!,
        autor_id: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["diario-obra"] });
      toast.success("Registro adicionado ao diário!");
      setOpen(false);
      setForm({ obra_id: "", descricao: "" });
    },
    onError: () => toast.error("Erro ao salvar registro."),
  });

  return (
    <AppLayout title="Diário de Obra" description="Registros diários de atividades nos canteiros.">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Select value={filtroObra} onValueChange={setFiltroObra}>
            <SelectTrigger className="w-[250px]"><SelectValue placeholder="Filtrar por obra" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as obras</SelectItem>
              {obras?.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <RoleGate allowWrite>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Novo Registro</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo Registro no Diário</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label>Obra *</Label>
                    <Select value={form.obra_id} onValueChange={(v) => setForm({ ...form, obra_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione a obra" /></SelectTrigger>
                      <SelectContent>{obras?.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Descrição *</Label>
                    <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva as atividades realizadas..." rows={4} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button onClick={() => save.mutate()} disabled={!form.obra_id || !form.descricao || save.isPending}>
                    {save.isPending ? "Salvando..." : "Registrar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </RoleGate>
        </div>

        <div className="space-y-3">
          {isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />) :
            registros?.length === 0 ? (
              <Card className="shadow-sm"><CardContent className="py-8 text-center text-muted-foreground">Nenhum registro encontrado.</CardContent></Card>
            ) : registros?.map((r: any) => (
              <Card key={r.id} className="shadow-sm">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">{r.obras?.nome ?? "Obra"}</span>
                      </div>
                      <p className="text-sm text-foreground">{r.descricao}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(r.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          }
        </div>
      </div>
    </AppLayout>
  );
};

export default DiarioObra;
