import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresaPlan } from "@/hooks/useEmpresaPlan";
import { useRole } from "@/hooks/useRole";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Requires editor+ (editor, owner, super_admin) */
  editOnly?: boolean;
  /** Requires owner+ (owner, super_admin) */
  ownerOnly?: boolean;
  requireObras?: boolean;
  requireSuperAdmin?: boolean;
}

const ProtectedRoute = ({ children, editOnly, ownerOnly, requireObras, requireSuperAdmin }: ProtectedRouteProps) => {
  const { session, loading, roleLoading } = useAuth();
  const { empresaId, isLoading: loadingPlan, isBlocked, permiteObras } = useEmpresaPlan();
  const { isEditor, isOwner, isSuperAdmin } = useRole();

  if (loading || loadingPlan || roleLoading) {
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
  if (editOnly && !isEditor) return <Navigate to="/dashboard" replace />;
  if (requireObras && !permiteObras) return <Navigate to="/upgrade" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
