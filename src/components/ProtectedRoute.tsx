import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresaId } from "@/hooks/useEmpresaId";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If true, only admin/super_admin can access. Viewers are redirected to /dashboard. */
  writeOnly?: boolean;
}

const ProtectedRoute = ({ children, writeOnly }: ProtectedRouteProps) => {
  const { session, loading, role, roleLoading } = useAuth();
  const { empresaId, isLoading: loadingEmpresa } = useEmpresaId();

  if (loading || loadingEmpresa || roleLoading) {
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

  if (writeOnly && role === "viewer") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
