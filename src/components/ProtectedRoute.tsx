import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresaPlan } from "@/hooks/useEmpresaPlan";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import TermsAcceptanceModal from "@/components/TermsAcceptanceModal";

interface ProtectedRouteProps {
  children: React.ReactNode;
  editOnly?: boolean;
  adminOnly?: boolean;
  ownerOnly?: boolean;
  requireObras?: boolean;
  requireSuperAdmin?: boolean;
}

const ProtectedRoute = ({ children, editOnly, adminOnly, ownerOnly, requireObras, requireSuperAdmin }: ProtectedRouteProps) => {
  const { session, user, loading, roleLoading } = useAuth();
  const { empresaId, isLoading: loadingPlan, isBlocked, permiteObras } = useEmpresaPlan();
  const { isEditor, isAdmin, isOwner, isSuperAdmin } = useRole();
  const queryClient = useQueryClient();

  const { data: termsAccepted, isLoading: loadingTerms } = useQuery({
    queryKey: ["terms-accepted", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("terms_accepted")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data?.terms_accepted === true;
    },
    enabled: !!user,
  });

  if (loading || loadingPlan || roleLoading || loadingTerms) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;
  if (!empresaId) return <Navigate to="/onboarding" replace />;
  if (isBlocked) return <Navigate to="/blocked" replace />;

  if (requireSuperAdmin && !isSuperAdmin) return <Navigate to="/dashboard" replace />;
  if (ownerOnly && !isOwner) return <Navigate to="/dashboard" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  if (editOnly && !isEditor) return <Navigate to="/dashboard" replace />;
  if (requireObras && !permiteObras) return <Navigate to="/upgrade" replace />;

  if (!termsAccepted) {
    return (
      <>
        <TermsAcceptanceModal
          open={true}
          userId={user!.id}
          onAccepted={() => queryClient.invalidateQueries({ queryKey: ["terms-accepted", user!.id] })}
        />
      </>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
