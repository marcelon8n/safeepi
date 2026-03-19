import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Colaboradores from "./pages/Colaboradores";
import Setores from "./pages/Setores";
import CatalogoEpis from "./pages/CatalogoEpis";
import RegistroEntregas from "./pages/RegistroEntregas";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Equipe from "./pages/Equipe";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import Upsell from "./pages/Upsell";
import Blocked from "./pages/Blocked";
import Obras from "./pages/Obras";
import ObraDetalhe from "./pages/ObraDetalhe";
import AlocacaoEquipe from "./pages/AlocacaoEquipe";
import GestaoDocumentos from "./pages/GestaoDocumentos";
import Relatorios from "./pages/Relatorios";
import FichaIndividualEpi from "./pages/FichaIndividualEpi";
import Requisitos from "./pages/Requisitos";
import MeuPerfil from "./pages/MeuPerfil";
import DadosEmpresa from "./pages/DadosEmpresa";
import Auditoria from "./pages/Auditoria";
import Convites from "./pages/Convites";
import DiarioObra from "./pages/DiarioObra";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/precos" element={<Pricing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/upgrade" element={<Upsell />} />
            <Route path="/blocked" element={<Blocked />} />
            {/* Gestão Operacional */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/entregas" element={<ProtectedRoute editOnly><RegistroEntregas /></ProtectedRoute>} />
            <Route path="/epis" element={<ProtectedRoute><CatalogoEpis /></ProtectedRoute>} />
            <Route path="/setores" element={<ProtectedRoute><Setores /></ProtectedRoute>} />
            <Route path="/ficha-epi" element={<ProtectedRoute><FichaIndividualEpi /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute adminOnly><Relatorios /></ProtectedRoute>} />
            {/* Engenharia e Obras */}
            <Route path="/obras" element={<ProtectedRoute ownerOnly><Obras /></ProtectedRoute>} />
            <Route path="/obras/:id" element={<ProtectedRoute ownerOnly><ObraDetalhe /></ProtectedRoute>} />
            <Route path="/alocacao-equipe" element={<ProtectedRoute ownerOnly><AlocacaoEquipe /></ProtectedRoute>} />
            <Route path="/diario-obra" element={<ProtectedRoute ownerOnly><DiarioObra /></ProtectedRoute>} />
            <Route path="/gestao-documentos" element={<ProtectedRoute ownerOnly><GestaoDocumentos /></ProtectedRoute>} />
            {/* Pessoas */}
            <Route path="/colaboradores" element={<ProtectedRoute><Colaboradores /></ProtectedRoute>} />
            <Route path="/requisitos" element={<ProtectedRoute><Requisitos /></ProtectedRoute>} />
            {/* Administração */}
            <Route path="/admin" element={<ProtectedRoute ownerOnly><Admin /></ProtectedRoute>} />
            <Route path="/meu-perfil" element={<ProtectedRoute><MeuPerfil /></ProtectedRoute>} />
            <Route path="/dados-empresa" element={<ProtectedRoute ownerOnly><DadosEmpresa /></ProtectedRoute>} />
            <Route path="/auditoria" element={<ProtectedRoute ownerOnly><Auditoria /></ProtectedRoute>} />
            <Route path="/convites" element={<ProtectedRoute ownerOnly><Convites /></ProtectedRoute>} />
            {/* Legacy */}
            <Route path="/equipe" element={<ProtectedRoute editOnly><Equipe /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
