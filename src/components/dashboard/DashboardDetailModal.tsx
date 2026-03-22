import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ModalItem {
  colaborador_nome?: string | null;
  epi_nome?: string | null;
  nome_epi?: string | null;
  nome_completo?: string | null;
  ca_numero?: string | null;
  data_vencimento?: string | null;
  entrega_id?: string | null;
}

interface DashboardDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: ModalItem[];
  isLoading: boolean;
  variant: "destructive" | "warning";
}

const DashboardDetailModal = ({ open, onOpenChange, title, data, isLoading, variant }: DashboardDetailModalProps) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((item) => {
      const nome = (item.colaborador_nome ?? item.nome_completo ?? "").toLowerCase();
      const epi = (item.epi_nome ?? item.nome_epi ?? "").toLowerCase();
      return nome.includes(q) || epi.includes(q);
    });
  }, [data, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant={variant} className="text-xs">{data.length}</Badge>
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por funcionário ou EPI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="overflow-y-auto flex-1 min-h-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Nenhum item encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>EPI</TableHead>
                  <TableHead>Data de Vencimento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item, idx) => {
                  const vencDate = item.data_vencimento ? new Date(item.data_vencimento + "T00:00:00") : null;
                  return (
                    <TableRow key={`${item.entrega_id}-${idx}`}>
                      <TableCell className="font-medium">
                        {item.colaborador_nome ?? item.nome_completo ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{item.epi_nome ?? item.nome_epi ?? "—"}</span>
                          {item.ca_numero && (
                            <span className="text-xs text-muted-foreground">CA: {item.ca_numero}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {vencDate ? format(vencDate, "dd/MM/yyyy", { locale: ptBR }) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DashboardDetailModal;
