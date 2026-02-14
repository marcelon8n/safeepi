import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HardHat, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Obter o user.id do usuário autenticado
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        console.error("Erro ao obter usuário:", authError);
        toast.error("Erro de autenticação. Faça login novamente.");
        return;
      }

      // 2. INSERT na tabela empresas e capturar o ID gerado
      const { data: empresa, error: empresaError } = await supabase
        .from("empresas")
        .insert({ nome_fantasia: nomeFantasia, cnpj })
        .select("id")
        .single();

      if (empresaError) {
        console.error("Erro ao criar empresa:", empresaError);
        toast.error(`Erro ao criar empresa: ${empresaError.message}`);
        return;
      }

      const empresaId = empresa.id;

      // 3. UPDATE na tabela profiles vinculando a empresa ao usuário
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ empresa_id: empresaId })
        .eq("user_id", authUser.id);

      if (profileError) {
        console.error("Erro ao vincular empresa ao perfil:", profileError);
        toast.error(`Erro ao vincular empresa: ${profileError.message}`);
        return;
      }

      // 4. Sucesso: invalidar cache, mostrar toast e redirecionar
      queryClient.invalidateQueries({ queryKey: ["empresa-id"] });
      toast.success("Empresa cadastrada com sucesso!");
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Erro inesperado no onboarding:", err);
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
          <form onSubmit={handleSubmit} className="space-y-5">
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
            <Button type="submit" className="w-full" disabled={loading || !nomeFantasia || !cnpj}>
              {loading ? "Salvando..." : "Cadastrar e Começar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
