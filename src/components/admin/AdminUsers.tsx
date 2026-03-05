import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UserPlus, Trash2, Mail, Clock } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  owner: "Proprietário",
  admin: "Administrador (SESMT)",
  editor: "Editor (Encarregado)",
  viewer: "Visualizador",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: "Gestão completa: colaboradores, EPIs, setores e exclusões.",
  editor: "Operação de campo: registar entregas, assinaturas e dados de contato.",
  viewer: "Apenas visualização de dashboards e relatórios.",
};

const ROLE_VARIANTS: Record<string, "default" | "secondary" | "destructive"> = {
  super_admin: "destructive",
  owner: "destructive",
  admin: "default",
  editor: "default",
  viewer: "secondary",
};

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  aceito: "Aceito",
  cancelado: "Cancelado",
};

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const { empresaId } = useEmpresaId();
  const { user } = useAuth();
  const { isSuperAdmin, isOwner } = useRole();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("viewer");

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

  const { data: convites, isLoading: convitesLoading } = useQuery({
    queryKey: ["admin-convites", empresaId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("convites")
        .select("id, email, role, status, created_at")
        .eq("empresa_id", empresaId!)
        .eq("status", "pendente")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Array<{ id: string; email: string; role: string; status: string; created_at: string }>;
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

  const sendInvite = useMutation({
    mutationFn: async () => {
      const email = inviteEmail.trim().toLowerCase();
      if (!email) throw new Error("E-mail obrigatório");
      
      const { error } = await (supabase as any)
        .from("convites")
        .insert({
          empresa_id: empresaId,
          email,
          role: inviteRole,
          created_by: user?.id,
        });
      if (error) {
        if (error.code === "23505") throw new Error("Já existe um convite para este e-mail.");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-convites"] });
      toast.success("Convite enviado com sucesso!");
      setInviteEmail("");
      setInviteRole("viewer");
      setInviteOpen(false);
    },
    onError: (err: any) => toast.error(err.message || "Erro ao enviar convite."),
  });

  const cancelInvite = useMutation({
    mutationFn: async (conviteId: string) => {
      const { error } = await (supabase as any)
        .from("convites")
        .update({ status: "cancelado" })
        .eq("id", conviteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-convites"] });
      toast.success("Convite cancelado.");
    },
    onError: () => toast.error("Erro ao cancelar convite."),
  });

  const canChangeRoles = isSuperAdmin || isOwner;
  const assignableRoles = isSuperAdmin
    ? [
        { value: "super_admin", label: "Super Admin" },
        { value: "owner", label: "Proprietário" },
        { value: "admin", label: "Administrador (SESMT)" },
        { value: "editor", label: "Editor (Encarregado)" },
        { value: "viewer", label: "Visualizador" },
      ]
    : [
        { value: "admin", label: "Administrador (SESMT)" },
        { value: "editor", label: "Editor (Encarregado)" },
        { value: "viewer", label: "Visualizador" },
      ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Gerencie os usuários com acesso ao sistema.{" "}
          {canChangeRoles
            ? isSuperAdmin
              ? "Como Super Admin, você pode alterar todas as permissões."
              : "Como Proprietário, você pode convidar e atribuir funções."
            : "Apenas Proprietários podem alterar permissões."}
        </p>

        {canChangeRoles && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <UserPlus className="w-4 h-4" />
                Convidar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Envie um convite por e-mail. Quando o usuário criar uma conta ou fizer login, será vinculado à sua empresa automaticamente.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">E-mail</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="colaborador@exemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nível de Acesso</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableRoles.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          <div className="flex flex-col">
                            <span>{r.label}</span>
                            {ROLE_DESCRIPTIONS[r.value] && (
                              <span className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[r.value]}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button>
                <Button
                  onClick={() => sendInvite.mutate()}
                  disabled={!inviteEmail.trim() || sendInvite.isPending}
                >
                  {sendInvite.isPending ? "Enviando..." : "Enviar Convite"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Pending invites */}
      {canChangeRoles && convites && convites.length > 0 && (
        <Card className="shadow-sm border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Convites Pendentes ({convites.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {convites.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      {c.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ROLE_LABELS[c.role] ?? c.role}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(c.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancelar convite?</AlertDialogTitle>
                            <AlertDialogDescription>
                              O convite para {c.email} será cancelado e não poderá mais ser aceito.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Voltar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => cancelInvite.mutate(c.id)}>Cancelar Convite</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Active users */}
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
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : profiles?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                profiles?.map((p) => {
                  const isOwnUser = p.user_id === user?.id;
                  const role = (p.role as string) ?? "viewer";
                  const isProtectedRole = role === "super_admin" || role === "owner";
                  const canEdit = canChangeRoles && !isOwnUser && (!isProtectedRole || isSuperAdmin);

                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.nome || "Sem nome"}
                        {isOwnUser && <span className="text-xs text-muted-foreground ml-2">(você)</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.email ?? "—"}</TableCell>
                      <TableCell>
                        {canEdit ? (
                          <Select value={role} onValueChange={(v) => updateRole.mutate({ userId: p.user_id, role: v })}>
                            <SelectTrigger className="w-[200px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {assignableRoles.map((r) => (
                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={ROLE_VARIANTS[role] ?? "secondary"}>
                            {ROLE_LABELS[role] ?? role}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.created_at ? format(new Date(p.created_at), "dd/MM/yyyy", { locale: ptBR }) : "—"}
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
  );
};

export default AdminUsers;
