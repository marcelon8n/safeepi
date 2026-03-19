import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Shield, Save } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  owner: "Proprietário",
  admin: "Administrador (SESMT)",
  editor: "Editor (Encarregado)",
  viewer: "Visualizador",
};

const MeuPerfil = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [loaded, setLoaded] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["meu-perfil", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (data && !loaded) {
        setNome(data.nome ?? "");
        setLoaded(true);
      }
      return data;
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ nome })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meu-perfil"] });
      toast.success("Perfil atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar perfil."),
  });

  if (isLoading) {
    return (
      <AppLayout title="Meu Perfil" description="Gerencie suas informações pessoais.">
        <Skeleton className="h-64 w-full max-w-lg" />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Meu Perfil" description="Gerencie suas informações pessoais.">
      <div className="max-w-lg space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5" />
              Informações da Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome completo" />
            </div>
            <div>
              <Label>E-mail</Label>
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                {user?.email}
              </div>
            </div>
            <div>
              <Label>Nível de Acesso</Label>
              <div className="mt-1">
                <Badge variant="default" className="gap-1">
                  <Shield className="w-3 h-3" />
                  {ROLE_LABELS[profile?.role ?? "viewer"] ?? profile?.role}
                </Badge>
              </div>
            </div>
            <div>
              <Label>Membro desde</Label>
              <p className="text-sm text-muted-foreground">
                {profile?.created_at ? format(new Date(profile.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "—"}
              </p>
            </div>
            <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending} className="gap-2">
              <Save className="w-4 h-4" />
              {updateProfile.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default MeuPerfil;
