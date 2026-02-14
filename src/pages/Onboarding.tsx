import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Users } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(false);

  // Buscar convites pendentes para o email do usuário
  const { data: convitesPendentes = [] } = useQuery({
    queryKey: ["convites-pendentes", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data, error } = await supabase
        .from("convites")
        .select("id, empresa_id, email, status")
        .eq("email", user.email.toLowerCase())
        .eq("status", "pendente");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.email,
  });

  const handleCreateEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("create_empresa_onboarding", {
        p_nome_fantasia: nomeFantasia,
        p_cnpj: cnpj,
      });
      if (error) {
        toast.error(`Erro ao criar empresa: ${error.message}`);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["empresa-id"] });
      toast.success("Empresa cadastrada com sucesso!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(`Erro inesperado: ${err.message || "Tente novamente."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (conviteId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("accept_invite", {
        p_convite_id: conviteId,
      });
      if (error) {
        toast.error(`Erro ao aceitar convite: ${error.message}`);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["empresa-id"] });
      toast.success("Você foi vinculado à empresa com sucesso!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(`Erro inesperado: ${err.message || "Tente novamente."}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  // Tela de escolha
  if (mode === "choose") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
              <Building2 className="w-7 h-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Bem-vindo ao SafeEPI</CardTitle>
            <CardDescription>
              Como deseja começar?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Convites pendentes */}
            {convitesPendentes.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-foreground">
                  Você tem {convitesPendentes.length} convite(s) pendente(s):
                </p>
                {convitesPendentes.map((c) => (
                  <Button
                    key={c.id}
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3"
                    onClick={() => handleAcceptInvite(c.id)}
                    disabled={loading}
                  >
                    <Users className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">Aceitar convite</p>
                      <p className="text-xs text-muted-foreground">
                        Entrar na empresa que te convidou
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            )}

            <Button
              className="w-full h-auto py-4"
              onClick={() => setMode("create")}
            >
              <Building2 className="w-5 h-5 mr-2" />
              <div className="text-left">
                <p className="font-medium">Criar Nova Empresa</p>
                <p className="text-xs opacity-80">Cadastrar minha empresa no sistema</p>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de criar empresa
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
            <Building2 className="w-7 h-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Cadastre sua Empresa</CardTitle>
          <CardDescription>
            Para começar a usar o SafeEPI, precisamos dos dados da sua empresa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateEmpresa} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Fantasia *</Label>
              <Input
                id="nome"
                value={nomeFantasia}
                onChange={(e) => setNomeFantasia(e.target.value)}
                placeholder="Ex: Construtora ABC"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(formatCnpj(e.target.value))}
                placeholder="00.000.000/0000-00"
                required
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setMode("choose")}
              >
                Voltar
              </Button>
              <Button type="submit" className="flex-1" disabled={loading || !nomeFantasia || !cnpj}>
                {loading ? "Salvando..." : "Cadastrar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
