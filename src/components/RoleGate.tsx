import { useRole } from "@/hooks/useRole";
import { ReactNode } from "react";

interface RoleGateProps {
  children: ReactNode;
  /** @deprecated Use allowEdit instead */
  allowWrite?: boolean;
  /** Render if user can edit data (editor, owner, super_admin) */
  allowEdit?: boolean;
  /** Render if user is owner or super_admin */
  allowOwner?: boolean;
  /** Render if user is super_admin */
  allowSuperAdmin?: boolean;
  /** Render if user can manage billing (owner or super_admin) */
  allowBilling?: boolean;
}

const RoleGate = ({ children, allowWrite, allowEdit, allowOwner, allowSuperAdmin, allowBilling }: RoleGateProps) => {
  const { canEditData, isOwner, isSuperAdmin, canManageBilling } = useRole();

  if (allowSuperAdmin && !isSuperAdmin) return null;
  if (allowOwner && !isOwner) return null;
  if (allowBilling && !canManageBilling) return null;
  if ((allowEdit || allowWrite) && !canEditData) return null;

  return <>{children}</>;
};

export default RoleGate;
