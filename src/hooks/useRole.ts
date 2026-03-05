import { useAuth } from "@/hooks/useAuth";

type UserRole = "super_admin" | "owner" | "admin" | "editor" | "viewer";

export const useRole = () => {
  const { role, roleLoading } = useAuth();

  const isSuperAdmin = role === "super_admin";
  const isOwner = role === "owner" || isSuperAdmin;
  const isAdmin = role === "admin" || isOwner; // SESMT — full CRUD
  const isEditor = role === "editor" || isAdmin; // Encarregado — limited write
  const isViewer = true; // everyone can read

  const canManageBilling = isOwner;

  // Full data management: create/edit/delete colaboradores, setores, EPI catalog rules
  const canEditData = isAdmin;

  // Limited write: register deliveries, collect signatures, update basic contact
  const canWrite = isEditor;

  // Can delete records (colaboradores, EPIs, etc.)
  const canDelete = isAdmin;

  // Can manage EPI catalog (CA, periodicidade)
  const canManageEpiCatalog = isAdmin;

  return {
    role,
    roleLoading,
    isSuperAdmin,
    isOwner,
    isAdmin,
    isEditor,
    isViewer,
    canManageBilling,
    canEditData,
    canWrite,
    canDelete,
    canManageEpiCatalog,
  };
};
