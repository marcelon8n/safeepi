import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, Save } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DadosEmpresa = () => {
  const { empresaId } = useEmpresaId();
  const qc = useQueryClient();
  const [form, setForm] = useState({ nome_fantasia: "", razao_social: "", cnpj: "" });
  const [loaded, setLoaded] = useState(false);

  const { data: empresa, isLoading } = useQuery({
    queryKey: ["empresa-dados", empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("*, planos(nome, slug)")
        .eq("id", empresaId!)
        .maybeSingle();
      if (error) throw error;
      if (data && !loaded) {
        setForm({
          nome_fantasia: data.nome_fantasia ?? "",
          razao_social: data.razao_social ?? "",
          cnpj: data.cnpj ?? "",
        });
        setLoaded(true);
      }
      return data;
    },
    enabled: !!empresaId,
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("empresas")
        .update({
          nome_fantasia: form.nome_fantasia,
          razao_social: form.razao_social || null,
        })
        .eq("id", empresaId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["empresa-dados"] });
      toast.success("Dados da empresa atualizados!");
    },
    onError: () => toast.error("Erro ao atualizar dados."),
  });

  if (isLoading) {
    return (
      <AppLayout title="Dados da Empresa" description="Informações cadastrais da empresa.">
        <Skeleton className="h-64 w-full max-w-lg" />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dados da Empresa" description="Informações cadastrais e plano contratado.">
      <div className="max-w-lg space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building className="w-5 h-5" />
              Informações Cadastrais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Razão Social</Label>
              <Input value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} placeholder="Nome oficial da empresa" />
              <p className="text-xs text-muted-foreground mt-1">Usado em documentos e fichas oficiais.</p>
            </div>
            <div>
              <Label>Nome Fantasia</Label>
              <Input value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} />
              <p className="text-xs text-muted-foreground mt-1">Usado como identificação visual no dashboard.</p>
            </div>
            <div>
              <Label>CNPJ</Label>
              <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground">{form.cnpj || "—"}</div>
            </div>
            <div className="flex items-center gap-2">
              <Label>Plano:</Label>
              <Badge variant="secondary">{(empresa as any)?.planos?.nome ?? "Sem plano"}</Badge>
            </div>
            <div>
              <Label>Status Assinatura:</Label>
              <Badge variant={empresa?.status_assinatura === "ativa" ? "default" : "outline"} className="ml-2">
                {empresa?.status_assinatura ?? "trial"}
              </Badge>
            </div>
            {empresa?.trial_ends_at && (
              <p className="text-xs text-muted-foreground">
                Trial expira em: {format(new Date(empresa.trial_ends_at), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}
            <Button onClick={() => update.mutate()} disabled={update.isPending || !form.nome_fantasia} className="gap-2">
              <Save className="w-4 h-4" />
              {update.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default DadosEmpresa;
