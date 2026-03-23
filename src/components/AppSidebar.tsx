import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ClipboardList, HardHat, Layers, Building2, UserPlus, BookOpen,
  Users, FileCheck, Building, ScrollText, Mail,
  User, LogOut, Menu, X, ChevronDown, FileText, LayoutDashboard,
  BarChart3, ShieldAlert, Heart
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useEmpresaPlan } from "@/hooks/useEmpresaPlan";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

interface NavGroup {
  label: string;
  items: NavItem[];
  show: boolean;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  show: boolean;
}

const AppSidebar = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { isEditor, isAdmin, isOwner, isSuperAdmin } = useRole();
  const { permiteObras } = useEmpresaPlan();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const isInGroup = (items: NavItem[]) => items.some((i) => isActive(i.to));

  const groups: NavGroup[] = [
    {
      label: "Operacional",
      show: true,
      items: [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true },
        { to: "/entregas", label: "Entregas de EPI", icon: ClipboardList, show: isEditor },
        { to: "/epis", label: "Catálogo de EPIs", icon: HardHat, show: true },
        { to: "/setores", label: "Setores", icon: Layers, show: true },
        { to: "/ficha-epi", label: "Ficha Individual", icon: FileText, show: true },
      ],
    },
    {
      label: "Compliance",
      show: true,
      items: [
        { to: "/colaboradores", label: "Colaboradores", icon: Users, show: true },
        { to: "/requisitos", label: "Requisitos / ASO", icon: FileCheck, show: true },
      ],
    },
    {
      label: "Gestão",
      show: isAdmin,
      items: [
        { to: "/relatorios", label: "Relatórios", icon: BarChart3, show: isAdmin },
        { to: "/admin", label: "Painel Estratégico", icon: ShieldAlert, show: isOwner },
        { to: "/meu-perfil", label: "Meu Perfil", icon: User, show: true },
        { to: "/dados-empresa", label: "Dados da Empresa", icon: Building, show: isOwner },
        { to: "/auditoria", label: "Auditoria", icon: ScrollText, show: isOwner },
        { to: "/convites", label: "Convites de Equipe", icon: Mail, show: isOwner },
      ],
    },
  ];

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

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {groups.filter((g) => g.show).map((group, gi) => {
          const visibleItems = group.items.filter((i) => i.show);
          if (visibleItems.length === 0) return null;
          const groupActive = isInGroup(visibleItems);

          return (
            <div key={group.label}>
              {gi > 0 && <Separator className="my-3 bg-sidebar-border" />}
              <Collapsible defaultOpen={groupActive || gi === 0}>
                <CollapsibleTrigger className="flex items-center gap-2 px-3 py-1.5 w-full text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 hover:text-sidebar-foreground/60 transition-colors">
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronDown className="w-3 h-3 transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-0.5 mt-1">
                  {visibleItems.map((item) => {
                    const active = isActive(item.to);
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          active
                            ? "bg-sidebar-accent text-sidebar-primary"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            </div>
          );
        })}
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
