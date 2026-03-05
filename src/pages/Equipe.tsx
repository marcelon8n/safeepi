import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, UserPlus } from "lucide-react";
import { useRole } from "@/hooks/useRole";
import EquipeDocumentos from "@/components/equipe/EquipeDocumentos";
import EquipeAlocacoes from "@/components/equipe/EquipeAlocacoes";

const Equipe = () => {
  const { canWrite } = useRole();

  return (
    <AppLayout title="Gestão Operacional" description="Documentos, ASOs e alocações de colaboradores.">
      <Tabs defaultValue="documentos" className="w-full">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="documentos" className="gap-2">
            <FileText className="w-4 h-4" />
            Documentos & ASO
          </TabsTrigger>
          <TabsTrigger value="alocacoes" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Alocações
          </TabsTrigger>
        </TabsList>

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
