import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Layers } from "lucide-react";
import { SetoresSection } from "@/components/admin/AdminStructure";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { useRole } from "@/hooks/useRole";
import EquipeColaboradores from "@/components/equipe/EquipeColaboradores";

const Equipe = () => {
  const { empresaId } = useEmpresaId();
  const { canEditData } = useRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "colaboradores";

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", value);
    setSearchParams(newParams, { replace: true });
  };

  return (
    <AppLayout title="Gestão Operacional" description="Gerencie seus colaboradores e setores.">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="colaboradores" className="gap-2">
            <Users className="w-4 h-4" />
            Colaboradores
          </TabsTrigger>
          <TabsTrigger value="setores" className="gap-2">
            <Layers className="w-4 h-4" />
            Setores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colaboradores">
          <EquipeColaboradores canEdit={canEditData} />
        </TabsContent>
        <TabsContent value="setores">
          <SetoresSection empresaId={empresaId} canEdit={canEditData} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Equipe;
