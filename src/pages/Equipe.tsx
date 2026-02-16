import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, UserPlus, Copy, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

const Equipe = () => {
  const { empresaId } = useEmpresaId();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [emailConvite, setEmailConvite] = useState("");
  const [copied, setCopied] = useState(false);

  // Listar membros da equipe (profiles com mesmo empresa_id)
  const { data: membros = [], isLoading: loadingMembros } = useQuery({
    queryKey: ["equipe-membros", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, nome, email, created_at")
        .eq("empresa_id", empresaId!);
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  // Listar convites pendentes
  const { data: convites = [], isLoading: loadingConvites } = useQuery({
    queryKey: ["convites", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("convites")
        .select("*")
        .eq("empresa_id", empresaId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  const enviarConvite = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.from("convites").insert({
        empresa_id: empresaId!,
        email: email.toLowerCase().trim(),
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Convite enviado com sucesso!");
      setEmailConvite("");
      queryClient.invalidateQueries({ queryKey: ["convites"] });
    },
    onError: (err: any) => {
      if (err.message?.includes("convites_empresa_email_unique")) {
        toast.error("Já existe um convite para este e-mail.");
      } else {
        toast.error(`Erro ao enviar convite: ${err.message}`);
      }
    },
  });

  const excluirConvite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("convites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Convite removido.");
      queryClient.invalidateQueries({ queryKey: ["convites"] });
    },
  });

  const handleCopyId = () => {
    if (empresaId) {
      navigator.clipboard.writeText(empresaId);
      setCopied(true);
      toast.success("ID da empresa copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmitConvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailConvite.trim()) return;
    enviarConvite.mutate(emailConvite);
  };

  return (
    <AppLayout title="Equipe" description="Gerencie os usuários que acessam sua empresa.">
      <div className="space-y-6">

        {/* ID da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Código de Acesso da Empresa</CardTitle>
            <CardDescription>
              Compartilhe este código com novos membros para que eles possam se vincular à sua empresa durante o cadastro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <code className="flex-1 px-4 py-2 bg-muted rounded-md text-sm font-mono truncate">
                {empresaId || "..."}
              </code>
              <Button variant="outline" size="sm" onClick={handleCopyId}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Convidar novo membro */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Convidar Novo Membro
            </CardTitle>
            <CardDescription>
              O usuário convidado verá o convite ao fazer login e será vinculado automaticamente à sua empresa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitConvite} className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="email-convite" className="sr-only">E-mail</Label>
                <Input
                  id="email-convite"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={emailConvite}
                  onChange={(e) => setEmailConvite(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={enviarConvite.isPending}>
                {enviarConvite.isPending ? "Enviando..." : "Convidar"}
              </Button>
            </form>

            {/* Convites pendentes */}
            {convites.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Convites enviados</h4>
                <div className="space-y-2">
                  {convites.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-3 py-2 bg-muted rounded-md">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{c.email}</span>
                        <Badge variant={c.status === "aceito" ? "default" : "secondary"}>
                          {c.status}
                        </Badge>
                      </div>
                      {c.status === "pendente" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir convite</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o convite para "{c.email}"?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => excluirConvite.mutate(c.id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Membros da equipe */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Membros da Equipe ({membros.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Membro desde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {membros.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.nome || "Sem nome"}</TableCell>
                    <TableCell className="text-muted-foreground">{(m as any).email || "—"}</TableCell>
                    <TableCell>
                      {m.created_at
                        ? new Date(m.created_at).toLocaleDateString("pt-BR")
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {membros.length === 0 && !loadingMembros && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Nenhum membro encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Equipe;
