import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { authService } from "@/lib/api/auth.service";
import { useState } from "react";

const navItems = [
  { to: "/dashboard", label: "Tablero", code: "01" },
  { to: "/cotizaciones", label: "Cotizaciones", code: "02" },
  { to: "/inventario", label: "Inventario", code: "03" },
  { to: "/cobros", label: "Cobros", code: "04", roles: ["Contador", "Gerente", "Administrador"] },
  { to: "/usuarios", label: "Usuarios", code: "05" },
  { to: "/bi", label: "Tablero BI", code: "06" },
] as const;

interface AppShellProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export function AppShell({ title, action, children }: AppShellProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    authService.logout();
    navigate({ to: "/login" });
  };

  const initials = user?.nombreCompleto
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="min-h-screen flex bg-paper text-ink">
      <aside className="w-64 border-r border-ink/5 flex flex-col p-6 gap-8 bg-white/50 sticky top-0 h-screen">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="size-8 bg-ink rounded flex items-center justify-center text-paper font-display font-bold text-xs tracking-tighter">
            PX
          </div>
          <span className="font-display font-bold tracking-tight text-lg">LEO GRAPHYC ERP</span>
        </Link>

        <nav className="flex flex-col gap-1">
          {navItems.filter(item => !("roles" in item) || (item.roles as readonly string[]).includes(user?.rol ?? "")).map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors " +
                  (active
                    ? "bg-ink text-paper"
                    : "text-ink/60 hover:bg-ink/5 hover:text-ink")
                }
              >
                <span className="text-[10px] font-mono opacity-50">{item.code}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="p-4 rounded-xl bg-ink/5 border border-ink/5">
            <p className="text-[10px] uppercase tracking-widest text-ink/40 font-bold mb-2">
              Estado del sistema
            </p>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-emerald-press animate-pulse" />
              <span className="text-xs font-medium">Prensas en línea</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-white border border-ink/5 text-sm">
            <p className="text-[10px] text-ink/40 mb-1">Usuario actual</p>
            <p className="font-semibold text-sm">{user?.nombreCompleto}</p>
            <p className="text-[10px] text-ink/40">{user?.rol}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-[10px] font-mono uppercase tracking-widest text-ink/40 hover:text-ink transition-colors px-2 py-2 rounded hover:bg-ink/5"
          >
            ← Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-ink/5 flex items-center justify-between px-8 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <h1 className="font-display font-bold text-xl uppercase tracking-tight">{title}</h1>
          <div className="flex items-center gap-4">
            {action}
            <div 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="size-8 rounded-full bg-cyan-press/20 ring-1 ring-cyan-press/30 grid place-items-center cursor-pointer hover:ring-cyan-press transition-all relative"
            >
              <span className="text-[10px] font-bold text-ink">{initials}</span>
              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-ink/10 rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b border-ink/5">
                    <p className="text-sm font-semibold">{user?.nombreCompleto}</p>
                    <p className="text-[10px] text-ink/50">{user?.correo}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/5"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
