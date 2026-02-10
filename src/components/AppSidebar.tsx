import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, HardHat, ClipboardList } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/colaboradores", label: "Colaboradores", icon: Users },
  { to: "/epis", label: "Catálogo de EPIs", icon: HardHat },
  { to: "/entregas", label: "Registro de Entregas", icon: ClipboardList },
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <HardHat className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-bold text-sidebar-primary-foreground">SafeEPI</h1>
          <p className="text-xs text-sidebar-foreground/60">Gestão de EPIs</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
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
      </nav>

      <div className="px-4 py-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/40">© 2026 SafeEPI</p>
      </div>
    </aside>
  );
};

export default AppSidebar;
