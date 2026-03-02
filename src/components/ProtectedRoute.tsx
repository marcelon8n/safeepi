import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresaPlan } from "@/hooks/useEmpresaPlan";

interface ProtectedRouteProps {
  children: React.ReactNode;
  writeOnly?: boolean;
  requireObras?: boolean;
  requireSuperAdmin?: boolean;
}

const ProtectedRoute = ({ children, writeOnly, requireObras, requireSuperAdmin }: ProtectedRouteProps) => {
  const { session, loading, role, roleLoading } = useAuth();
  const { empresaId, isLoading: loadingPlan, isBlocked, permiteObras } = useEmpresaPlan();

  if (loading || loadingPlan || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!empresaId) {
    return <Navigate to="/onboarding" replace />;
  }

  if (isBlocked) {
    return <Navigate to="/blocked" replace />;
  }

  if (writeOnly && role === "viewer") {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireObras && !permiteObras) {
    return <Navigate to="/upgrade" replace />;
  }

  if (requireSuperAdmin && role !== "super_admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
