import AppLayout from "@/components/AppLayout";
import AdminUsers from "@/components/admin/AdminUsers";

const Convites = () => {
  return (
    <AppLayout title="Convites de Equipe" description="Gerencie os acessos e convites de usuários da empresa.">
      <AdminUsers />
    </AppLayout>
  );
};

export default Convites;
