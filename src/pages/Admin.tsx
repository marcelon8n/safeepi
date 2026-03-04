import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, HardHat, ScrollText, CreditCard } from "lucide-react";
import AdminEpisCatalog from "@/components/admin/AdminEpisCatalog";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminAuditLog from "@/components/admin/AdminAuditLog";
import AdminAssinatura from "@/components/admin/AdminAssinatura";
import { useRole } from "@/hooks/useRole";

const Admin = () => {
  const { isSuperAdmin } = useRole();

  return (
    <AppLayout title="Painel de Governança" description="Controle acessos, faturamento e diretrizes do sistema.">
      <Tabs defaultValue="usuarios" className="w-full">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="w-4 h-4" />
            Usuários do Sistema
          </TabsTrigger>
          <TabsTrigger value="epis" className="gap-2">
            <HardHat className="w-4 h-4" />
            Catálogo de EPIs
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="gap-2">
            <ScrollText className="w-4 h-4" />
            Auditoria
          </TabsTrigger>
          <TabsTrigger value="assinatura" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Assinatura
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios"><AdminUsers /></TabsContent>
        <TabsContent value="epis"><AdminEpisCatalog /></TabsContent>
        <TabsContent value="auditoria"><AdminAuditLog /></TabsContent>
        <TabsContent value="assinatura"><AdminAssinatura /></TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Admin;
