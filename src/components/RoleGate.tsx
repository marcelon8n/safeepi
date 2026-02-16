import { useRole } from "@/hooks/useRole";
import { ReactNode } from "react";

interface RoleGateProps {
  children: ReactNode;
  /** Only render if the user can write (admin or super_admin) */
  allowWrite?: boolean;
  /** Only render if user is super_admin */
  allowSuperAdmin?: boolean;
}

const RoleGate = ({ children, allowWrite, allowSuperAdmin }: RoleGateProps) => {
  const { canWrite, isSuperAdmin } = useRole();

  if (allowSuperAdmin && !isSuperAdmin) return null;
  if (allowWrite && !canWrite) return null;

  return <>{children}</>;
};

export default RoleGate;
