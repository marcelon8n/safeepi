import { useAuth } from "@/hooks/useAuth";

type UserRole = "super_admin" | "owner" | "editor" | "viewer";

export const useRole = () => {
  const { role, roleLoading } = useAuth();

  const isSuperAdmin = role === "super_admin";
  const isOwner = role === "owner" || isSuperAdmin;
  const isEditor = role === "editor" || isOwner;
  const isViewer = true; // everyone can read

  const canManageBilling = isOwner;
  const canEditData = isEditor;
  const canWrite = isEditor; // backwards compat

  return {
    role,
    roleLoading,
    isSuperAdmin,
    isOwner,
    isEditor,
    isViewer,
    canManageBilling,
    canEditData,
    canWrite,
  };
};
