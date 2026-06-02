import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { accentBar, accentBg15, accentBorderColumn, dotBg } from "@/components/accent-classes";
import { authService } from "@/lib/api/auth.service";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    if (!authService.isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Tablero de Producción — PREX ERP" },
      { name: "description", content: "Pedidos en Pre-prensa, Prensa y Post-prensa en tiempo real." },
    ],
  }),
  component: DashboardPage,
});

type Status = "pre" | "prensa" | "post";

interface OrderCard {
  id: string;
  title: string;
  client: string;
  tag: string;
  status: Status;
  meta?: string;
  progress?: number;
  machine?: string;
  priority?: boolean;
}

const orders: OrderCard[] = [
  { id: "ORD-8821", title: "Manual de Marca - 50u", client: "Nova Studio", tag: "Offset", status: "pre", priority: true, progress: 75 },
  { id: "ORD-8825", title: "Serie Posters Mate", client: "Colectivo Arte", tag: "Gran Formato", status: "pre" },
  { id: "ORD-8827", title: "Catálogo Otoño", client: "Editorial Norte", tag: "Offset", status: "pre" },
  { id: "ORD-8819", title: "Tarjetas Soft Touch", client: "Fintech Corp", tag: "Digital", status: "prensa", machine: "HEIDELBERG C.1", meta: "1,250 / 5,000" },
  { id: "ORD-8820", title: "Folletos Tríptico", client: "Clínica Río", tag: "Offset", status: "prensa", machine: "KOMORI L-29", meta: "3,400 / 8,000" },
  { id: "ORD-8812", title: "Diario Tapa Dura", client: "Proyecto Personal", tag: "Encuadernación", status: "post" },
  { id: "ORD-8810", title: "Cajas Plegadizas", client: "Café Roble", tag: "Troquelado", status: "post" },
];

export function DashboardPage() {
  return (
    <AppShell
      title="Tablero de Producción"
      action={
        <button className="px-4 py-1.5 border border-ink/10 rounded text-[11px] font-semibold uppercase tracking-widest hover:bg-ink hover:text-paper transition-all">
          + Nuevo pedido
        </button>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Kpi label="Pedidos activos" value="14" accent="cyan-press" />
        <Kpi label="En máquina" value="02" accent="magenta-press" />
        <Kpi label="Entregas hoy" value="06" accent="yellow-press" />
        <Kpi label="Eficiencia OEE" value="98.4%" accent="emerald-press" mono />
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-3 gap-6">
        <Column title="Pre-prensa" accent="cyan-press" count={orders.filter((o) => o.status === "pre").length}>
          {orders.filter((o) => o.status === "pre").map((o) => (
            <PreCard key={o.id} order={o} />
          ))}
        </Column>

        <Column title="Prensa" accent="magenta-press" count={orders.filter((o) => o.status === "prensa").length}>
          {orders.filter((o) => o.status === "prensa").map((o) => (
            <PressCard key={o.id} order={o} />
          ))}
        </Column>

        <Column title="Post-prensa" accent="yellow-press" count={orders.filter((o) => o.status === "post").length}>
          {orders.filter((o) => o.status === "post").map((o) => (
            <PostCard key={o.id} order={o} />
          ))}
        </Column>
      </div>

      {/* Focal alert + quotes */}
      <div className="mt-12 grid grid-cols-12 gap-6">
        <div className="col-span-8 bg-ink text-paper p-8 rounded-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col h-full">
            <span className="text-[10px] font-mono uppercase tracking-widest text-paper/40 mb-3">
              Alerta de inventario
            </span>
            <h2 className="font-display text-3xl font-bold tracking-tight mb-2 text-balance">
              Couché Semi-mate 250g por debajo del 15%
            </h2>
            <p className="text-paper/60 text-sm max-w-md mb-8">
              Retraso estimado en 3 pedidos próximos si no se reabastece esta semana.
            </p>
            <div className="mt-auto flex gap-4">
              <button className="px-6 py-2 bg-paper text-ink rounded font-bold text-xs uppercase tracking-widest">
                Reabastecer
              </button>
              <button className="px-6 py-2 border border-paper/20 rounded font-bold text-xs uppercase tracking-widest hover:bg-paper/10 transition-colors">
                Ver inventario
              </button>
            </div>
          </div>
          <div className="absolute bottom-[-20%] right-[-5%] size-64 bg-cyan-press/20 blur-[100px] rounded-full" />
          <div className="absolute top-[-20%] right-[10%] size-64 bg-magenta-press/10 blur-[100px] rounded-full" />
        </div>

        <div className="col-span-4 bg-white border border-ink/5 p-6 rounded-2xl flex flex-col">
          <h2 className="font-display font-bold text-sm uppercase tracking-widest mb-6 border-b border-ink/5 pb-2">
            Cotizaciones pendientes
          </h2>
          <div className="flex flex-col gap-4">
            <QuoteRow name="Hotel Gran Vía" amount="$2,450.00" dot="yellow-press" />
            <QuoteRow name="Volantes Evento (10k)" amount="$890.00" dot="ink/20" />
            <QuoteRow name="Packaging Lab" amount="$12,100.00" dot="ink/20" />
          </div>
          <button className="mt-auto pt-4 text-xs font-bold text-center border-t border-ink/5 text-ink/40 hover:text-ink transition-colors">
            VER TODAS
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function Kpi({ label, value, accent, mono }: { label: string; value: string; accent: string; mono?: boolean }) {
  return (
    <div className="bg-white border border-ink/5 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
      <div className={`absolute top-0 left-0 h-0.5 w-12 ${accentBar[accent]}`} />
      <span className="text-[10px] font-mono uppercase tracking-widest text-ink/40">{label}</span>
      <span className={`text-2xl font-bold tracking-tight ${mono ? "font-mono" : "font-display"}`}>{value}</span>
    </div>
  );
}

function Column({
  title,
  accent,
  count,
  children,
}: {
  title: string;
  accent: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className={`flex items-center justify-between border-b-2 ${accentBorderColumn[accent]} pb-2`}>
        <h2 className="font-display font-bold text-sm uppercase tracking-widest">{title}</h2>
        <span className={`text-[10px] font-mono ${accentBg15[accent]} px-2 py-0.5 rounded text-ink/70`}>
          {String(count).padStart(2, "0")} pedidos
        </span>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function PreCard({ order }: { order: OrderCard }) {
  return (
    <div className="bg-white p-4 rounded-lg border border-ink/5 shadow-sm hover:border-cyan-press/40 transition-colors cursor-pointer">
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-mono text-ink/40">#{order.id}</span>
        {order.priority && (
          <span className="text-[10px] px-1.5 py-0.5 bg-ink/5 rounded uppercase font-bold tracking-tighter">
            Prioridad
          </span>
        )}
      </div>
      <h3 className="font-display font-bold text-sm mb-1">{order.title}</h3>
      <p className="text-xs text-ink/50">Cliente: {order.client}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] font-mono text-ink/40 uppercase">{order.tag}</span>
        {order.progress !== undefined && (
          <div className="h-1 w-20 bg-ink/5 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-press" style={{ width: `${order.progress}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

function PressCard({ order }: { order: OrderCard }) {
  return (
    <div className="bg-white p-4 rounded-lg border border-magenta-press/30 shadow-md relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 bg-magenta-press/5 -mr-8 -mt-8 rotate-45" />
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-mono text-ink/40">#{order.id}</span>
        <span className="flex items-center gap-1 text-[9px] font-bold text-magenta-press">
          <span className="size-1.5 bg-magenta-press rounded-full animate-pulse" />
          {order.machine}
        </span>
      </div>
      <h3 className="font-display font-bold text-sm mb-1">{order.title}</h3>
      <p className="text-xs text-ink/50">Cliente: {order.client}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-ink/30">En curso</span>
        <span className="text-xs font-mono font-bold italic">{order.meta}</span>
      </div>
    </div>
  );
}

function PostCard({ order }: { order: OrderCard }) {
  return (
    <div className="bg-white p-4 rounded-lg border border-ink/5 border-dashed">
      <div className="flex justify-between items-start mb-3 text-ink/40">
        <span className="text-[10px] font-mono">#{order.id}</span>
        <span className="text-[10px] font-bold uppercase">{order.tag}</span>
      </div>
      <h3 className="font-display font-bold text-sm mb-1 text-ink/70">{order.title}</h3>
      <p className="text-xs text-ink/40">Cliente: {order.client}</p>
    </div>
  );
}

function QuoteRow({ name, amount, dot }: { name: string; amount: string; dot: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-bold">{name}</p>
        <p className="text-[10px] text-ink/40">Estimado: {amount}</p>
      </div>
      <div className={`size-2 rounded-full ${dotBg[dot]}`} />
    </div>
  );
}
