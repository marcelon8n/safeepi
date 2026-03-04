import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format, parseISO, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  canEdit: boolean;
}

const EquipeDocumentos = ({ canEdit }: Props) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const perPage = 15;
  const today = new Date().toISOString().split("T")[0];

  const { data: requisitos, isLoading } = useQuery({
    queryKey: ["equipe-requisitos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requisitos_colaboradores")
        .select("*, colaboradores(nome_completo)")
        .order("data_validade", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const filtered = requisitos?.filter((r) => {
    const q = search.toLowerCase();
    const nome = ((r.colaboradores as any)?.nome_completo ?? "").toLowerCase();
    return nome.includes(q) || r.tipo_requisito.toLowerCase().includes(q);
  }) ?? [];

  const paginated = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    try { return format(parseISO(d), "dd/MM/yyyy", { locale: ptBR }); } catch { return "—"; }
  };

  const isExpired = (d: string | null) => {
    if (!d) return false;
    return isBefore(parseISO(d), new Date());
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Controle centralizado de ASOs, NRs e certificados dos colaboradores.
      </p>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por colaborador ou tipo..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="pl-9"
        />
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                  ))}
                </TableRow>
              )) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum documento encontrado.
                  </TableCell>
                </TableRow>
              ) : paginated.map((r) => {
                const expired = isExpired(r.data_validade);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{(r.colaboradores as any)?.nome_completo ?? "—"}</TableCell>
                    <TableCell>{r.tipo_requisito}</TableCell>
                    <TableCell>{formatDate(r.data_validade)}</TableCell>
                    <TableCell>
                      {expired ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="w-3 h-3" /> Vencido
                        </Badge>
                      ) : (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Válido
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{filtered.length} documento(s)</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>Anterior</Button>
            <span className="text-sm flex items-center px-2">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}>Próximo</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipeDocumentos;
