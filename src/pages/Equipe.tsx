import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Layers, FileText, UserPlus } from "lucide-react";
import { SetoresSection } from "@/components/admin/AdminStructure";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { useRole } from "@/hooks/useRole";
import RoleGate from "@/components/RoleGate";
import EquipeColaboradores from "@/components/equipe/EquipeColaboradores";
import EquipeDocumentos from "@/components/equipe/EquipeDocumentos";
import EquipeAlocacoes from "@/components/equipe/EquipeAlocacoes";

const Equipe = () => {
  const { empresaId } = useEmpresaId();
  const { canEditData, canWrite } = useRole();

  return (
    <AppLayout title="Gestão Operacional" description="Gerencie seus colaboradores e conformidades documentais.">
      <Tabs defaultValue="colaboradores" className="w-full">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="colaboradores" className="gap-2">
            <Users className="w-4 h-4" />
            Colaboradores
          </TabsTrigger>
          <TabsTrigger value="setores" className="gap-2">
            <Layers className="w-4 h-4" />
            Setores
          </TabsTrigger>
          <TabsTrigger value="documentos" className="gap-2">
            <FileText className="w-4 h-4" />
            Documentos & ASO
          </TabsTrigger>
          <TabsTrigger value="alocacoes" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Alocações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colaboradores">
          <EquipeColaboradores canEdit={canEditData} />
        </TabsContent>
        <TabsContent value="setores">
          <SetoresSection empresaId={empresaId} canEdit={canEditData} />
        </TabsContent>
        <TabsContent value="documentos">
          <EquipeDocumentos canEdit={canWrite} />
        </TabsContent>
        <TabsContent value="alocacoes">
          <EquipeAlocacoes canEdit={canWrite} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Equipe;
