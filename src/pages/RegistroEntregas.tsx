import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const RegistroEntregas = () => {
  const queryClient = useQueryClient();
  const [colaboradorId, setColaboradorId] = useState("");
  const [epiId, setEpiId] = useState("");
  const [dataEntrega, setDataEntrega] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dataVencimento, setDataVencimento] = useState("");

  const { data: colaboradores } = useQuery({
    queryKey: ["colaboradores"],
    queryFn: async () => {
      const { data } = await supabase.from("colaboradores").select("*").eq("status", "ativo").order("nome_completo");
      return data ?? [];
    },
  });

  const { data: epis } = useQuery({
    queryKey: ["epis"],
    queryFn: async () => {
      const { data } = await supabase.from("epis").select("*").order("nome_epi");
      return data ?? [];
    },
  });

  const { data: entregas, isLoading } = useQuery({
    queryKey: ["entregas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("entregas_epi")
        .select("*, colaboradores(nome_completo), epis(nome_epi)")
        .order("data_entrega", { ascending: false });
      return data ?? [];
    },
  });

  const handleEpiChange = (id: string) => {
    setEpiId(id);
    const epi = epis?.find((e) => e.id === id);
    if (epi && dataEntrega) {
      const vencimento = addDays(new Date(dataEntrega), epi.periodicidade_dias);
      setDataVencimento(format(vencimento, "yyyy-MM-dd"));
    }
  };

  const handleDataChange = (date: string) => {
    setDataEntrega(date);
    const epi = epis?.find((e) => e.id === epiId);
    if (epi && date) {
      const vencimento = addDays(new Date(date), epi.periodicidade_dias);
      setDataVencimento(format(vencimento, "yyyy-MM-dd"));
    }
  };

  const registrar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("entregas_epi").insert({
        colaborador_id: colaboradorId,
        epi_id: epiId,
        data_entrega: dataEntrega,
        data_vencimento: dataVencimento,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
      queryClient.invalidateQueries({ queryKey: ["vencidos"] });
      queryClient.invalidateQueries({ queryKey: ["entregas-count"] });
      toast.success("Entrega registrada com sucesso!");
      setColaboradorId("");
      setEpiId("");
      setDataEntrega(format(new Date(), "yyyy-MM-dd"));
      setDataVencimento("");
    },
    onError: () => toast.error("Erro ao registrar entrega."),
  });

  const today = new Date().toISOString().split("T")[0];

  return (
    <AppLayout title="Registro de Entregas" description="Registre a entrega de EPIs aos colaboradores">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="w-5 h-5" />
              Nova Entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Colaborador *</Label>
              <Select value={colaboradorId} onValueChange={setColaboradorId}>
                <SelectTrigger><SelectValue placeholder="Selecione o colaborador" /></SelectTrigger>
                <SelectContent>
                  {colaboradores?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>EPI *</Label>
              <Select value={epiId} onValueChange={handleEpiChange}>
                <SelectTrigger><SelectValue placeholder="Selecione o EPI" /></SelectTrigger>
                <SelectContent>
                  {epis?.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nome_epi}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data de Entrega *</Label>
              <Input type="date" value={dataEntrega} onChange={(e) => handleDataChange(e.target.value)} />
            </div>
            <div>
              <Label>Data de Vencimento (automático)</Label>
              <Input type="date" value={dataVencimento} disabled className="bg-muted" />
            </div>
            <Button
              className="w-full"
              onClick={() => registrar.mutate()}
              disabled={!colaboradorId || !epiId || !dataEntrega || !dataVencimento || registrar.isPending}
            >
              {registrar.isPending ? "Registrando..." : "Registrar Entrega"}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Entregas Recentes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>EPI</TableHead>
                    <TableHead>Entrega</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : entregas?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma entrega registrada.</TableCell></TableRow>
                  ) : (
                    entregas?.map((e) => {
                      const vencido = e.data_vencimento < today;
                      return (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">{(e.colaboradores as any)?.nome_completo ?? "—"}</TableCell>
                          <TableCell>{(e.epis as any)?.nome_epi ?? "—"}</TableCell>
                          <TableCell>{format(new Date(e.data_entrega), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                          <TableCell>{format(new Date(e.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                          <TableCell>
                            <Badge variant={vencido ? "destructive" : "secondary"}>
                              {vencido ? "Vencido" : "Válido"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default RegistroEntregas;
