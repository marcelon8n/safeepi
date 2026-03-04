import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, HardHat, ClipboardList, LogOut, Menu, X, UserCog, Shield, Building2, UserPlus, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useEmpresaPlan } from "@/hooks/useEmpresaPlan";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const AppSidebar = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { isEditor, isOwner, isSuperAdmin } = useRole();
  const { permiteObras } = useEmpresaPlan();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [obrasOpen, setObrasOpen] = useState(
    ["/obras", "/alocacao-equipe", "/gestao-documentos"].some((p) => location.pathname.startsWith(p))
  );

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true },
    { to: "/colaboradores", label: "Colaboradores", icon: Users, show: true },
    { to: "/epis", label: "Catálogo de EPIs", icon: HardHat, show: true },
    { to: "/entregas", label: "Registro de Entregas", icon: ClipboardList, show: true },
    { to: "/equipe", label: "Equipe", icon: UserCog, show: isEditor },
    { to: "/admin", label: "Administração Geral", icon: Shield, show: isOwner },
  ];

  const obrasSubItems = [
    { to: "/obras", label: "Obras", icon: Building2 },
    { to: "/alocacao-equipe", label: "Alocação de Equipe", icon: UserPlus },
  ];

  const visibleItems = navItems.filter((item) => item.show);

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <HardHat className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-bold text-sidebar-primary-foreground">Safe Solutions</h1>
            <p className="text-xs text-sidebar-foreground/60">Gestão de EPIs</p>
          </div>
        </div>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="text-sidebar-foreground">
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}

        {/* Gestão de Obras - owner+ only */}
        {isOwner && (
          <Collapsible open={obrasOpen} onOpenChange={setObrasOpen}>
            <CollapsibleTrigger className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <HardHat className="w-5 h-5" />
              <span className="flex-1 text-left">Gestão de Obras</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${obrasOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 space-y-0.5 mt-0.5">
              {obrasSubItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary font-medium"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border space-y-3">
        {user && <p className="px-3 text-xs text-sidebar-foreground/50 truncate">{user.email}</p>}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-destructive"
          onClick={signOut}
        >
          <LogOut className="w-5 h-5" />
          Sair
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50" onClick={() => setMobileOpen(true)}>
          <Menu className="w-6 h-6" />
        </Button>
        {mobileOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
            <aside className="fixed left-0 top-0 z-50 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col">
              {sidebarContent}
            </aside>
          </>
        )}
      </>
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col">
      {sidebarContent}
    </aside>
  );
};

export default AppSidebar;
