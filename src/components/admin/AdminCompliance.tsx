import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ShieldAlert, FileWarning, CheckCircle2 } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

const AdminCompliance = () => {
  const { empresaId } = useEmpresaId();
  const today = new Date().toISOString().split("T")[0];

  const { data: alertas, isLoading: l1 } = useQuery({
    queryKey: ["admin-compliance-alertas", empresaId],
    queryFn: async () => {
      const { data } = await supabase
        .from("v_alertas_vencimento")
        .select("*")
        .eq("status_troca", "pendente");
      return data ?? [];
    },
    enabled: !!empresaId,
  });

  const { data: requisitos, isLoading: l2 } = useQuery({
    queryKey: ["admin-compliance-requisitos", empresaId],
    queryFn: async () => {
      const { data } = await supabase
        .from("requisitos_colaboradores")
        .select("*, colaboradores(nome_completo)")
        .eq("status_verificado", false);
      return data ?? [];
    },
    enabled: !!empresaId,
  });

  const { data: casVencidos, isLoading: l3 } = useQuery({
    queryKey: ["admin-compliance-cas", empresaId],
    queryFn: async () => {
      const { data } = await supabase
        .from("epis")
        .select("id, nome_epi, ca_numero, data_validade_ca")
        .lt("data_validade_ca", today);
      return data ?? [];
    },
    enabled: !!empresaId,
  });

  const isLoading = l1 || l2 || l3;

  // EPIs vencidos há mais de 5 dias
  const urgentes = alertas
    ?.filter((a) => {
      if (!a.data_vencimento) return false;
      const dias = differenceInDays(new Date(), parseISO(a.data_vencimento));
      return dias > 5;
    })
    .sort((a, b) => {
      const dA = differenceInDays(new Date(), parseISO(a.data_vencimento!));
      const dB = differenceInDays(new Date(), parseISO(b.data_vencimento!));
      return dB - dA;
    }) ?? [];

  const asosPendentes = requisitos?.filter((r) => r.tipo_requisito === "ASO") ?? [];

  const summaryCards = [
    {
      label: "EPIs Vencidos",
      value: alertas?.filter((a) => a.data_vencimento && a.data_vencimento < today).length ?? 0,
      icon: ShieldAlert,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "CAs Vencidos",
      value: casVencidos?.length ?? 0,
      icon: FileWarning,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "ASOs Pendentes",
      value: asosPendentes.length,
      icon: AlertTriangle,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  const noIssues = summaryCards.every((c) => c.value === 0) && urgentes.length === 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {summaryCards.map((card) => (
          <Card key={card.label} className="shadow-sm">
            <CardContent className="p-5">
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-3xl font-bold mt-1">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bgColor} ${card.color}`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Urgent list */}
      {noIssues ? (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
            <h3 className="text-lg font-semibold">Tudo em conformidade! ✅</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Nenhuma pendência crítica encontrada.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Atenção Urgente — EPIs vencidos há mais de 5 dias
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6"><Skeleton className="h-40 w-full" /></div>
            ) : urgentes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum EPI vencido há mais de 5 dias.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>EPI</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Atraso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {urgentes.slice(0, 20).map((a) => {
                    const dias = differenceInDays(new Date(), parseISO(a.data_vencimento!));
                    return (
                      <TableRow key={a.entrega_id}>
                        <TableCell className="font-medium">{a.colaborador_nome ?? "—"}</TableCell>
                        <TableCell>{a.epi_nome ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(a.data_vencimento!).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">{dias} dias</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* CAs Vencidos */}
      {(casVencidos?.length ?? 0) > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-warning">
              <FileWarning className="w-5 h-5" />
              Certificados de Aprovação (CA) Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>EPI</TableHead>
                  <TableHead>Nº CA</TableHead>
                  <TableHead>Validade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {casVencidos?.map((ca) => (
                  <TableRow key={ca.id}>
                    <TableCell className="font-medium">{ca.nome_epi}</TableCell>
                    <TableCell>{ca.ca_numero}</TableCell>
                    <TableCell className="text-destructive">
                      {ca.data_validade_ca ? new Date(ca.data_validade_ca).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminCompliance;
