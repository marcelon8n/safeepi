import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, DollarSign, ShieldAlert, Users, Settings, BarChart3, CalendarDays } from "lucide-react";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminFinanceiro from "@/components/admin/AdminFinanceiro";
import AdminCompliance from "@/components/admin/AdminCompliance";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminConfiguracoes from "@/components/admin/AdminConfiguracoes";
import AdminConsumoMensal from "@/components/admin/AdminConsumoMensal";
import AdminDurabilidade from "@/components/admin/AdminDurabilidade";

const Admin = () => {
  return (
    <AppLayout title="Painel de Controle" description="Visão estratégica para gestão de riscos, custos e conformidade.">
      <Tabs defaultValue="visao-geral" className="w-full">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="visao-geral" className="gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Financeiro & Custos
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-2">
            <ShieldAlert className="w-4 h-4" />
            Compliance & Riscos
          </TabsTrigger>
          <TabsTrigger value="consumo" className="gap-2">
            <CalendarDays className="w-4 h-4" />
            Consumo Mensal
          </TabsTrigger>
          <TabsTrigger value="durabilidade" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Durabilidade
          </TabsTrigger>
          <TabsTrigger value="acessos" className="gap-2">
            <Users className="w-4 h-4" />
            Gestão de Acessos
          </TabsTrigger>
          <TabsTrigger value="configuracoes" className="gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral"><AdminOverview /></TabsContent>
        <TabsContent value="financeiro"><AdminFinanceiro /></TabsContent>
        <TabsContent value="compliance"><AdminCompliance /></TabsContent>
        <TabsContent value="consumo"><AdminConsumoMensal /></TabsContent>
        <TabsContent value="durabilidade"><AdminDurabilidade /></TabsContent>
        <TabsContent value="acessos"><AdminUsers /></TabsContent>
        <TabsContent value="configuracoes"><AdminConfiguracoes /></TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Admin;
