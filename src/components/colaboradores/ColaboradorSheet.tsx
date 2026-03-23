import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { HardHat, FileCheck } from "lucide-react";

interface ColaboradorSheetProps {
  colaboradorId: string | null;
  colaboradorNome: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ColaboradorSheet = ({ colaboradorId, colaboradorNome, open, onOpenChange }: ColaboradorSheetProps) => {
  const { data: entregas, isLoading: loadingEntregas } = useQuery({
    queryKey: ["colab-sheet-entregas", colaboradorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entregas_epi")
        .select("*, epis(nome_epi)")
        .eq("colaborador_id", colaboradorId!)
        .order("data_entrega", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!colaboradorId && open,
  });

  const { data: requisitos, isLoading: loadingReq } = useQuery({
    queryKey: ["colab-sheet-requisitos", colaboradorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requisitos_colaboradores")
        .select("*")
        .eq("colaborador_id", colaboradorId!)
        .order("data_validade", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!colaboradorId && open,
  });

  const today = new Date().toISOString().split("T")[0];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">{colaboradorNome}</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="epis" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="epis" className="flex-1 gap-2">
              <HardHat className="w-4 h-4" /> EPIs
            </TabsTrigger>
            <TabsTrigger value="docs" className="flex-1 gap-2">
              <FileCheck className="w-4 h-4" /> Documentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="epis" className="mt-4">
            {loadingEntregas ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !entregas?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma entrega registrada.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>EPI</TableHead>
                    <TableHead>Entrega</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entregas.map((e: any) => {
                    const vencido = e.data_vencimento < today;
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium text-sm">{e.epis?.nome_epi ?? "—"}</TableCell>
                        <TableCell className="text-sm">{format(new Date(e.data_entrega), "dd/MM/yy")}</TableCell>
                        <TableCell className="text-sm">{format(new Date(e.data_vencimento), "dd/MM/yy")}</TableCell>
                        <TableCell>
                          <Badge variant={vencido ? "destructive" : e.status === "ativa" ? "default" : "secondary"} className="text-xs">
                            {vencido ? "Vencido" : e.status ?? "ativa"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="docs" className="mt-4">
            {loadingReq ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !requisitos?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum documento registrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requisitos.map((r) => {
                    const vencido = r.data_validade ? r.data_validade < today : false;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium text-sm">{r.tipo_requisito}</TableCell>
                        <TableCell className="text-sm">
                          {r.data_validade ? format(new Date(r.data_validade), "dd/MM/yy") : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={vencido ? "destructive" : r.status_verificado ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {vencido ? "Vencido" : r.status_verificado ? "Verificado" : "Pendente"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default ColaboradorSheet;
