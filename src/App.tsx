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
import CatalogoEpis from "./pages/CatalogoEpis";
import RegistroEntregas from "./pages/RegistroEntregas";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Equipe from "./pages/Equipe";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";

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
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/colaboradores" element={<ProtectedRoute><Colaboradores /></ProtectedRoute>} />
            <Route path="/epis" element={<ProtectedRoute><CatalogoEpis /></ProtectedRoute>} />
            <Route path="/entregas" element={<ProtectedRoute><RegistroEntregas /></ProtectedRoute>} />
            <Route path="/equipe" element={<ProtectedRoute writeOnly><Equipe /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
