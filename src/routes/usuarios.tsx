import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { accentBar, accentBg20, accentRing30 } from "@/components/accent-classes";

export const Route = createFileRoute("/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuarios — PREX ERP" },
      { name: "description", content: "Gestión de usuarios, roles y permisos del taller." },
    ],
  }),
  component: UsuariosPage,
});

type Role = "Administrador" | "Operador" | "Diseñador" | "Vendedor";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  lastSeen: string;
  initials: string;
}

const users: User[] = [
  { id: "1", name: "Juan Domínguez", email: "juan@prex.mx", role: "Administrador", active: true, lastSeen: "Ahora", initials: "JD" },
  { id: "2", name: "Mariana Rojas", email: "mariana@prex.mx", role: "Diseñador", active: true, lastSeen: "Hace 12 min", initials: "MR" },
  { id: "3", name: "Carlos Núñez", email: "carlos@prex.mx", role: "Operador", active: true, lastSeen: "Hace 1 h", initials: "CN" },
  { id: "4", name: "Lucía Pérez", email: "lucia@prex.mx", role: "Vendedor", active: true, lastSeen: "Hace 2 h", initials: "LP" },
  { id: "5", name: "Andrés Vega", email: "andres@prex.mx", role: "Operador", active: false, lastSeen: "Ayer", initials: "AV" },
  { id: "6", name: "Sofía Castro", email: "sofia@prex.mx", role: "Vendedor", active: true, lastSeen: "Hace 30 min", initials: "SC" },
];

const roleAccent: Record<Role, string> = {
  Administrador: "magenta-press",
  Operador: "cyan-press",
  Diseñador: "yellow-press",
  Vendedor: "emerald-press",
};

export function UsuariosPage() {
  return (
    <AppShell
      title="Gestión de Usuarios"
      action={
        <button className="px-4 py-1.5 bg-ink text-paper rounded text-[11px] font-semibold uppercase tracking-widest hover:bg-ink/90 transition-all">
          + Invitar usuario
        </button>
      }
    >
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Stat label="Total usuarios" value="12" accent="cyan-press" />
        <Stat label="Activos hoy" value="08" accent="emerald-press" />
        <Stat label="Administradores" value="02" accent="magenta-press" />
        <Stat label="Pendientes" value="01" accent="yellow-press" />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Users grid */}
        <div className="col-span-8 grid grid-cols-2 gap-4">
          {users.map((u) => (
            <div
              key={u.id}
              className="bg-white border border-ink/5 rounded-xl p-5 hover:border-ink/20 transition-colors group relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 h-0.5 w-16 ${accentBar[roleAccent[u.role]]}`} />
              <div className="flex items-start gap-4">
                <div className={`size-12 rounded-full ${accentBg20[roleAccent[u.role]]} ring-1 ${accentRing30[roleAccent[u.role]]} grid place-items-center shrink-0`}>
                  <span className="font-display font-bold text-sm">{u.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display font-bold text-sm truncate">{u.name}</h3>
                    <span className={`size-2 rounded-full shrink-0 ${u.active ? "bg-emerald-press" : "bg-ink/20"}`} />
                  </div>
                  <p className="text-xs text-ink/50 truncate">{u.email}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-tighter bg-ink/5 text-ink/70">
                      {u.role}
                    </span>
                    <span className="text-[10px] font-mono text-ink/40">{u.lastSeen}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Roles panel */}
        <aside className="col-span-4 bg-white border border-ink/5 rounded-2xl p-6 flex flex-col">
          <h2 className="font-display font-bold text-sm uppercase tracking-widest mb-6 border-b border-ink/5 pb-2">
            Roles y permisos
          </h2>

          <div className="space-y-4">
            {(["Administrador", "Operador", "Diseñador", "Vendedor"] as Role[]).map((role) => (
              <div key={role} className="flex items-start gap-3">
                <div className={`mt-1 size-3 rounded-sm ${accentBar[roleAccent[role]]}`} />
                <div className="flex-1">
                  <p className="text-sm font-bold">{role}</p>
                  <p className="text-xs text-ink/50">
                    {role === "Administrador" && "Acceso total: configuración, usuarios, facturación."}
                    {role === "Operador" && "Tablero de producción, registro de avances."}
                    {role === "Diseñador" && "Pre-prensa, archivos y validación de pruebas."}
                    {role === "Vendedor" && "Cotizaciones y seguimiento a clientes."}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-auto pt-6 text-xs font-bold text-ink/40 hover:text-ink transition-colors uppercase tracking-widest text-center border-t border-ink/5 mt-6">
            Configurar permisos
          </button>
        </aside>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-white border border-ink/5 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
      <div className={`absolute top-0 left-0 h-0.5 w-12 ${accentBar[accent]}`} />
      <span className="text-[10px] font-mono uppercase tracking-widest text-ink/40">{label}</span>
      <span className="font-display text-2xl font-bold tracking-tight">{value}</span>
    </div>
  );
}
