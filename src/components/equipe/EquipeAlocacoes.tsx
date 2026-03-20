import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  canEdit: boolean;
}

const EquipeAlocacoes = ({ canEdit }: Props) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const perPage = 15;

  const { data: alocacoes, isLoading } = useQuery({
    queryKey: ["equipe-alocacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores_obras")
        .select("*, colaboradores(nome_completo), obras(nome)")
        .eq("ativo", true)
        .order("data_inicio", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = alocacoes?.filter((a) => {
    const q = search.toLowerCase();
    const nomeColab = ((a.colaboradores as any)?.nome_completo ?? "").toLowerCase();
    const nomeObra = ((a.obras as any)?.nome ?? "").toLowerCase();
    return nomeColab.includes(q) || nomeObra.includes(q);
  }) ?? [];

  const paginated = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    try { return format(parseISO(d), "dd/MM/yyyy", { locale: ptBR }); } catch { return "—"; }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Visualize quais colaboradores estão alocados em cada obra.
      </p>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por colaborador ou obra..."
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
                <TableHead>Obra</TableHead>
                <TableHead>Início</TableHead>
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
                    Nenhuma alocação encontrada.
                  </TableCell>
                </TableRow>
              ) : paginated.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{(a.colaboradores as any)?.nome_completo ?? "—"}</TableCell>
                  <TableCell>{(a.obras as any)?.nome ?? "—"}</TableCell>
                  <TableCell>{formatDate(a.data_inicio)}</TableCell>
                  <TableCell>
                    <Badge variant={a.ativo ? "success" : "secondary"} className="font-semibold">
                      {a.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{filtered.length} alocação(ões)</p>
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

export default EquipeAlocacoes;
