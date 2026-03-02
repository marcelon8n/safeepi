import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminAuditLog = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const perPage = 15;

  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-auditoria"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auditoria")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const filtered = logs?.filter((l) =>
    l.acao.toLowerCase().includes(search.toLowerCase()) ||
    l.tabela.toLowerCase().includes(search.toLowerCase()) ||
    (typeof l.detalhes === "string" && l.detalhes.toLowerCase().includes(search.toLowerCase()))
  ) ?? [];

  const paginated = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const formatDetails = (detalhes: any): string => {
    if (!detalhes) return "—";
    if (typeof detalhes === "string") return detalhes;
    try {
      return JSON.stringify(detalhes, null, 0).slice(0, 100);
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Registro somente leitura das últimas ações realizadas no sistema.
      </p>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por ação ou tabela..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Tabela</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>
              )) : paginated.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum registro de auditoria encontrado.</TableCell></TableRow>
              ) : paginated.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {l.created_at ? format(new Date(l.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{l.usuario_id?.slice(0, 8) ?? "Sistema"}</TableCell>
                  <TableCell className="font-medium text-sm">{l.acao}</TableCell>
                  <TableCell className="text-sm">{l.tabela}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{formatDetails(l.detalhes)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{filtered.length} registro(s)</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>Anterior</Button>
            <span className="text-sm flex items-center px-2">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>Próximo</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLog;
