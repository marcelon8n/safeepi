import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ACAO_LABELS: Record<string, string> = {
  INSERT: "Criação",
  UPDATE: "Atualização",
  DELETE: "Exclusão",
};

const TABELA_LABELS: Record<string, string> = {
  colaboradores: "Colaboradores",
  epis: "EPIs",
  entregas_epi: "Entregas de EPI",
  obras: "Obras",
};

const getResumo = (detalhes: any): string => {
  if (!detalhes) return "—";
  const d = typeof detalhes === "string" ? tryParse(detalhes) : detalhes;
  if (d?._resumo) return d._resumo;
  // Fallback for old records
  const nomeEpi = d?.nome_epi || d?.new?.nome_epi;
  const nomeColab = d?.nome_colaborador || d?.new?.nome_colaborador || d?.new?.nome_completo;
  if (nomeEpi && nomeColab) return `Entrega de ${nomeEpi} para ${nomeColab}`;
  if (nomeColab) return `Colaborador ${nomeColab}`;
  if (nomeEpi) return `EPI ${nomeEpi}`;
  const nome = d?.nome || d?.new?.nome;
  if (nome) return `Obra ${nome}`;
  return "—";
};

const tryParse = (str: string) => {
  try { return JSON.parse(str); } catch { return null; }
};

const getUserName = (detalhes: any): string | null => {
  if (!detalhes) return null;
  const d = typeof detalhes === "string" ? tryParse(detalhes) : detalhes;
  return d?._usuario_nome || null;
};

const AdminAuditLog = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState<any>(null);
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

  const filtered = logs?.filter((l) => {
    const q = search.toLowerCase();
    const summary = getResumo(l.detalhes).toLowerCase();
    const userName = (getUserName(l.detalhes) || "").toLowerCase();
    return (
      l.acao.toLowerCase().includes(q) ||
      l.tabela.toLowerCase().includes(q) ||
      summary.includes(q) ||
      userName.includes(q)
    );
  }) ?? [];

  const paginated = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      const date = parseISO(dateStr);
      return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
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
        <Input placeholder="Buscar por ação, tabela ou usuário..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
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
                <TableRow key={l.id} className="cursor-pointer" onClick={() => setSelectedLog(l)}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDate(l.created_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getUserName(l.detalhes) || l.usuario_id?.slice(0, 8) || "Sistema"}
                  </TableCell>
                  <TableCell className="font-medium text-sm">{ACAO_LABELS[l.acao] || l.acao}</TableCell>
                  <TableCell className="text-sm">{TABELA_LABELS[l.tabela] || l.tabela}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                    {getResumo(l.detalhes)}
                  </TableCell>
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

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Auditoria</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3 text-sm">
              <div><span className="font-medium">Data:</span> {formatDate(selectedLog.created_at)}</div>
              <div><span className="font-medium">Usuário:</span> {getUserName(selectedLog.detalhes) || selectedLog.usuario_id || "Sistema"}</div>
              <div><span className="font-medium">Ação:</span> {ACAO_LABELS[selectedLog.acao] || selectedLog.acao}</div>
              <div><span className="font-medium">Tabela:</span> {TABELA_LABELS[selectedLog.tabela] || selectedLog.tabela}</div>
              <div><span className="font-medium">Resumo:</span> {getResumo(selectedLog.detalhes)}</div>
              <div>
                <span className="font-medium">Dados completos:</span>
                <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto whitespace-pre-wrap break-all max-h-[400px]">
                  {JSON.stringify(selectedLog.detalhes, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAuditLog;
