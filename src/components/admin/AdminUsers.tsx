import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  viewer: "Visualizador",
};

const ROLE_VARIANTS: Record<string, "default" | "secondary" | "destructive"> = {
  super_admin: "destructive",
  admin: "default",
  viewer: "secondary",
};

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const { empresaId } = useEmpresaId();
  const { user } = useAuth();
  const { isSuperAdmin } = useRole();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin-profiles", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, nome, email, role, created_at")
        .eq("empresa_id", empresaId!);
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ role } as any)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast.success("Permissão atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar permissão."),
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Gerencie os usuários com acesso ao sistema. {isSuperAdmin ? "Como Super Admin, você pode alterar as permissões." : "Apenas Super Admins podem alterar permissões."}
      </p>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Permissão</TableHead>
                <TableHead>Membro desde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 4 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>
              )) : profiles?.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado.</TableCell></TableRow>
              ) : profiles?.map((p) => {
                const isOwnUser = p.user_id === user?.id;
                const role = (p.role as string) ?? "viewer";
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome || "Sem nome"}{isOwnUser && <span className="text-xs text-muted-foreground ml-2">(você)</span>}</TableCell>
                    <TableCell className="text-muted-foreground">{p.email ?? "—"}</TableCell>
                    <TableCell>
                      {isSuperAdmin && !isOwnUser ? (
                        <Select value={role} onValueChange={(v) => updateRole.mutate({ userId: p.user_id, role: v })}>
                          <SelectTrigger className="w-[160px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="viewer">Visualizador</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={ROLE_VARIANTS[role] ?? "secondary"}>
                          {ROLE_LABELS[role] ?? role}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{p.created_at ? format(new Date(p.created_at), "dd/MM/yyyy", { locale: ptBR }) : "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
