import { useAuth } from "@/hooks/useAuth";

type UserRole = "super_admin" | "admin" | "viewer";

export const useRole = () => {
  const { role, roleLoading } = useAuth();

  const canWrite = role === "super_admin" || role === "admin";
  const isSuperAdmin = role === "super_admin";
  const isViewer = role === "viewer";

  return { role, roleLoading, canWrite, isSuperAdmin, isViewer };
};
