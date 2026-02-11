import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useEmpresaId() {
  const { user } = useAuth();

  const { data: empresaId, isLoading } = useQuery({
    queryKey: ["empresa-id", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("empresa_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.empresa_id ?? null;
    },
    enabled: !!user,
  });

  return { empresaId: empresaId ?? null, isLoading };
}
