import AppLayout from "@/components/AppLayout";
import AdminAuditLog from "@/components/admin/AdminAuditLog";

const Auditoria = () => {
  return (
    <AppLayout title="Auditoria de Sistema" description="Registro somente leitura das ações realizadas no sistema.">
      <AdminAuditLog />
    </AppLayout>
  );
};

export default Auditoria;
