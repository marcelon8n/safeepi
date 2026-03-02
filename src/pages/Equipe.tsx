import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, HardHat, Building2, Users, ScrollText } from "lucide-react";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminEpisCatalog from "@/components/admin/AdminEpisCatalog";
import AdminStructure from "@/components/admin/AdminStructure";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminAuditLog from "@/components/admin/AdminAuditLog";

const Equipe = () => {
  return (
    <AppLayout title="Administração Geral" description="Painel de gestão centralizada da empresa">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="epis" className="gap-2">
            <HardHat className="w-4 h-4" />
            Catálogo de EPIs
          </TabsTrigger>
          <TabsTrigger value="estrutura" className="gap-2">
            <Building2 className="w-4 h-4" />
            Obras e Setores
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="gap-2">
            <ScrollText className="w-4 h-4" />
            Auditoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><AdminDashboard /></TabsContent>
        <TabsContent value="epis"><AdminEpisCatalog /></TabsContent>
        <TabsContent value="estrutura"><AdminStructure /></TabsContent>
        <TabsContent value="usuarios"><AdminUsers /></TabsContent>
        <TabsContent value="auditoria"><AdminAuditLog /></TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Equipe;
