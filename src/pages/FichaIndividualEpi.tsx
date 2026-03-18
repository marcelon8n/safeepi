import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Printer, User } from "lucide-react";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const parseLocalDate = (dateStr: string) => parseISO(dateStr + "T12:00:00");
const formatLocalDate = (dateStr: string) =>
  format(parseLocalDate(dateStr), "dd/MM/yyyy", { locale: ptBR });

const MOTIVO_LABELS: Record<string, string> = {
  entrega_inicial: "Entrega Inicial",
  vencimento: "Vencimento",
  dano_desgaste: "Dano / Desgaste",
  extravio: "Extravio",
  ajuste: "Ajuste de Tamanho",
};

const FichaIndividualEpi = () => {
  const { empresaId } = useEmpresaId();
  const [selectedColaboradorId, setSelectedColaboradorId] = useState<string>("");

  const { data: empresa, isLoading: empresaLoading } = useQuery({
    queryKey: ["empresa-ficha", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("razao_social, cnpj, nome_fantasia")
        .eq("id", empresaId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  const { data: colaboradores, isLoading: colabLoading } = useQuery({
    queryKey: ["colaboradores-ficha", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores")
        .select("id, nome_completo, cargo")
        .eq("empresa_id", empresaId!)
        .eq("status", "ativo")
        .order("nome_completo");
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  const selectedColab = colaboradores?.find((c) => c.id === selectedColaboradorId);

  const { data: entregas, isLoading: entregasLoading } = useQuery({
    queryKey: ["entregas-ficha", selectedColaboradorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entregas_epi")
        .select("id, data_entrega, ca_numero_entregue, motivo_entrega, data_vencimento, epi_id, epis(nome_epi)")
        .eq("colaborador_id", selectedColaboradorId)
        .order("data_entrega", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedColaboradorId,
  });

  const handlePrintPDF = () => {
    if (!empresa || !selectedColab || !entregas) return;

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 15;

    // Header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("FICHA INDIVIDUAL DE CONTROLE DE EPI", pageW / 2, y, { align: "center" });
    y += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Empresa: ${empresa.razao_social || empresa.nome_fantasia}`, 14, y);
    doc.text(`CNPJ: ${formatCNPJ(empresa.cnpj)}`, pageW - 14, y, { align: "right" });
    y += 6;

    doc.setDrawColor(200);
    doc.line(14, y, pageW - 14, y);
    y += 8;

    // Employee info
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Dados do Colaborador", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${selectedColab.nome_completo}`, 14, y);
    doc.text(`Cargo: ${selectedColab.cargo || "—"}`, pageW / 2, y);
    y += 10;

    // Table
    const rows = entregas.map((e) => [
      formatLocalDate(e.data_entrega),
      (e.epis as any)?.nome_epi || "—",
      e.ca_numero_entregue || "—",
      MOTIVO_LABELS[e.motivo_entrega || ""] || e.motivo_entrega || "—",
      formatLocalDate(e.data_vencimento),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Data Entrega", "EPI", "CA", "Motivo", "Vencimento"]],
      body: rows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 98, 155], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || y + 20;
    let sigY = finalY + 25;

    if (sigY > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      sigY = 30;
    }

    // Signature
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Declaro ter recebido os EPIs acima listados, em perfeito estado de conservação,", 14, sigY);
    doc.text("comprometendo-me a utilizá-los corretamente conforme instruções recebidas.", 14, sigY + 5);

    sigY += 25;
    const sigLineW = 70;
    const gap = (pageW - 28 - sigLineW * 2) ;

    doc.line(14, sigY, 14 + sigLineW, sigY);
    doc.text("Assinatura do Colaborador", 14 + sigLineW / 2, sigY + 5, { align: "center" });

    doc.line(14 + sigLineW + gap, sigY, 14 + sigLineW * 2 + gap, sigY);
    doc.text("Assinatura do Responsável", 14 + sigLineW + gap + sigLineW / 2, sigY + 5, { align: "center" });

    sigY += 15;
    doc.text(`Data: ____/____/________`, 14, sigY);

    doc.save(`ficha-epi-${selectedColab.nome_completo.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Ficha Individual de EPI</h1>
              <p className="text-sm text-muted-foreground">Controle individual de entrega e recebimento de EPIs</p>
            </div>
          </div>
          {selectedColaboradorId && entregas && entregas.length > 0 && (
            <Button onClick={handlePrintPDF} className="gap-2">
              <Printer className="h-4 w-4" /> Imprimir PDF
            </Button>
          )}
        </div>

        {/* Company Header */}
        <Card>
          <CardContent className="pt-6">
            {empresaLoading ? (
              <div className="flex gap-8">
                <Skeleton className="h-5 w-64" />
                <Skeleton className="h-5 w-48" />
              </div>
            ) : empresa ? (
              <div className="flex flex-wrap gap-x-12 gap-y-2 text-sm">
                <div>
                  <span className="font-semibold text-muted-foreground">Razão Social:</span>{" "}
                  <span className="font-medium text-foreground">{empresa.razao_social || empresa.nome_fantasia}</span>
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">CNPJ:</span>{" "}
                  <span className="font-medium text-foreground">{formatCNPJ(empresa.cnpj)}</span>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Collaborator Selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" /> Selecionar Colaborador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-full max-w-sm space-y-1.5">
                <Label>Colaborador</Label>
                {colabLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={selectedColaboradorId} onValueChange={setSelectedColaboradorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um colaborador..." />
                    </SelectTrigger>
                    <SelectContent>
                      {colaboradores?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {selectedColab && (
                <div className="flex gap-6 text-sm pb-1">
                  <div>
                    <span className="text-muted-foreground">Nome:</span>{" "}
                    <span className="font-medium">{selectedColab.nome_completo}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cargo:</span>{" "}
                    <span className="font-medium">{selectedColab.cargo || "—"}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delivery History */}
        {selectedColaboradorId && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Histórico de Entregas</CardTitle>
            </CardHeader>
            <CardContent>
              {entregasLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : entregas && entregas.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data Entrega</TableHead>
                        <TableHead>EPI</TableHead>
                        <TableHead>CA</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Vencimento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entregas.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>{formatLocalDate(e.data_entrega)}</TableCell>
                          <TableCell className="font-medium">{(e.epis as any)?.nome_epi || "—"}</TableCell>
                          <TableCell>{e.ca_numero_entregue || "—"}</TableCell>
                          <TableCell>{MOTIVO_LABELS[e.motivo_entrega || ""] || e.motivo_entrega || "—"}</TableCell>
                          <TableCell>{formatLocalDate(e.data_vencimento)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhuma entrega encontrada para este colaborador.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

function formatCNPJ(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return cnpj;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export default FichaIndividualEpi;
