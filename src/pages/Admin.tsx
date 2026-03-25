import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, DollarSign, ShieldAlert, BarChart3, CalendarDays } from "lucide-react";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminFinanceiro from "@/components/admin/AdminFinanceiro";
import AdminCompliance from "@/components/admin/AdminCompliance";
import AdminConsumoMensal from "@/components/admin/AdminConsumoMensal";
import AdminDurabilidade from "@/components/admin/AdminDurabilidade";

const Admin = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "visao-geral";

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", value);
    setSearchParams(newParams, { replace: true });
  };

  return (
    <AppLayout title="Painel Estratégico" description="Visão estratégica para gestão de riscos, custos e conformidade.">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
        </TabsList>

        <TabsContent value="visao-geral"><AdminOverview /></TabsContent>
        <TabsContent value="financeiro"><AdminFinanceiro /></TabsContent>
        <TabsContent value="compliance"><AdminCompliance /></TabsContent>
        <TabsContent value="consumo"><AdminConsumoMensal /></TabsContent>
        <TabsContent value="durabilidade"><AdminDurabilidade /></TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Admin;
