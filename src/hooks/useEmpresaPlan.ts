import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface EmpresaPlan {
  empresaId: string | null;
  statusAssinatura: string | null;
  limiteColaboradores: number | null;
  permiteObras: boolean;
  planoNome: string | null;
  planoSlug: string | null;
  isLoading: boolean;
  isBlocked: boolean;
}

export function useEmpresaPlan(): EmpresaPlan {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["empresa-plan", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("empresa_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile?.empresa_id) return null;

      const { data: empresa, error } = await supabase
        .from("empresas")
        .select("id, status_assinatura, plano_id, planos(nome, limite_colaboradores, permite_obras)")
        .eq("id", profile.empresa_id)
        .maybeSingle();

      if (error) throw error;
      return empresa;
    },
    enabled: !!user,
  });

  const plano = (data as any)?.planos;

  return {
    empresaId: data?.id ?? null,
    statusAssinatura: data?.status_assinatura ?? null,
    limiteColaboradores: plano?.limite_colaboradores ?? null,
    permiteObras: plano?.permite_obras ?? false,
    planoNome: plano?.nome ?? null,
    isLoading,
    isBlocked: data?.status_assinatura === "blocked" || data?.status_assinatura === "overdue",
  };
}
