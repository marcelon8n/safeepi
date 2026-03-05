import { useRole } from "@/hooks/useRole";
import { ReactNode } from "react";

interface RoleGateProps {
  children: ReactNode;
  /** @deprecated Use allowEdit or allowWrite instead */
  allowWrite?: boolean;
  /** Render if user is admin+ (admin, owner, super_admin) — full CRUD */
  allowEdit?: boolean;
  /** Render if user can write (editor+) — limited write */
  allowCanWrite?: boolean;
  /** Render if user is owner or super_admin */
  allowOwner?: boolean;
  /** Render if user is super_admin */
  allowSuperAdmin?: boolean;
  /** Render if user can manage billing (owner or super_admin) */
  allowBilling?: boolean;
  /** Render if user can delete records (admin+) */
  allowDelete?: boolean;
}

const RoleGate = ({ children, allowWrite, allowEdit, allowCanWrite, allowOwner, allowSuperAdmin, allowBilling, allowDelete }: RoleGateProps) => {
  const { canEditData, canWrite, isOwner, isSuperAdmin, canManageBilling, canDelete } = useRole();

  if (allowSuperAdmin && !isSuperAdmin) return null;
  if (allowOwner && !isOwner) return null;
  if (allowBilling && !canManageBilling) return null;
  if (allowDelete && !canDelete) return null;
  if (allowEdit && !canEditData) return null;
  if ((allowCanWrite || allowWrite) && !canWrite) return null;

  return <>{children}</>;
};

export default RoleGate;
