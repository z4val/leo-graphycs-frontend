import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { accentBar } from "@/components/accent-classes";
import { authService } from "@/lib/api/auth.service";

export const Route = createFileRoute("/cotizaciones")({
  beforeLoad: () => {
    if (!authService.isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Cotizaciones — PREX ERP" },
      { name: "description", content: "Gestión y registro de cotizaciones a clientes." },
    ],
  }),
  component: CotizacionesPage,
});

type QStatus = "borrador" | "enviada" | "aprobada" | "rechazada";

interface Quote {
  id: string;
  client: string;
  job: string;
  amount: string;
  status: QStatus;
  date: string;
}

const quotes: Quote[] = [
  { id: "COT-2401", client: "Hotel Gran Vía", job: "Menús plastificados x500", amount: "$2,450.00", status: "enviada", date: "12 May" },
  { id: "COT-2402", client: "Editorial Trillas", job: "Libro de texto v2", amount: "$84,200.00", status: "aprobada", date: "11 May" },
  { id: "COT-2403", client: "Pizzería Roma", job: "Volantes 1/4 carta x10,000", amount: "$890.00", status: "borrador", date: "10 May" },
  { id: "COT-2404", client: "Constructora Norte", job: "Carpetas institucionales", amount: "$12,400.00", status: "aprobada", date: "09 May" },
  { id: "COT-2405", client: "Café Roble", job: "Cajas plegadizas troqueladas", amount: "$5,640.00", status: "enviada", date: "08 May" },
  { id: "COT-2406", client: "Librería Central", job: "Catálogo otoño", amount: "$4,200.00", status: "borrador", date: "07 May" },
  { id: "COT-2407", client: "Estudio Nova", job: "Manual de marca", amount: "$18,900.00", status: "rechazada", date: "05 May" },
];

const statusStyle: Record<QStatus, { label: string; classes: string }> = {
  borrador: { label: "Borrador", classes: "bg-ink/10 text-ink/60" },
  enviada: { label: "Enviada", classes: "bg-cyan-press/15 text-ink/70" },
  aprobada: { label: "Aprobada", classes: "bg-emerald-press/20 text-ink/70" },
  rechazada: { label: "Rechazada", classes: "bg-destructive/15 text-destructive" },
};

export function CotizacionesPage() {
  return (
    <AppShell
      title="Cotizaciones"
      action={
        <button className="px-4 py-1.5 bg-ink text-paper rounded text-[11px] font-semibold uppercase tracking-widest hover:bg-ink/90 transition-all">
          + Nueva cotización
        </button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Stat label="Total del mes" value="142" accent="cyan-press" />
        <Stat label="Tasa de aprobación" value="64%" accent="emerald-press" />
        <Stat label="Pendientes" value="08" accent="yellow-press" />
        <Stat label="Valor cotizado" value="$1.2M" accent="magenta-press" />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* List */}
        <div className="col-span-7 bg-white border border-ink/5 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-ink/5">
            <h2 className="font-display font-bold text-sm uppercase tracking-widest">Historial</h2>
            <span className="text-[10px] font-mono text-ink/40">{quotes.length} registros</span>
          </div>
          <ul>
            {quotes.map((q, i) => (
              <li
                key={q.id}
                className={
                  "flex items-center justify-between px-5 py-4 border-b border-ink/5 last:border-0 hover:bg-ink/[0.02] cursor-pointer transition-colors " +
                  (i === 1 ? "bg-cyan-press/5" : "")
                }
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-[10px] font-mono text-ink/40 w-16">#{q.id}</span>
                  <div className="min-w-0">
                    <p className="font-display font-bold text-sm truncate">{q.client}</p>
                    <p className="text-xs text-ink/50 truncate">{q.job}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <span className="text-[10px] font-mono text-ink/40">{q.date}</span>
                  <span className="font-mono font-bold text-sm">{q.amount}</span>
                  <span className={`text-[10px] px-2 py-1 rounded uppercase font-bold tracking-tighter w-20 text-center ${statusStyle[q.status].classes}`}>
                    {statusStyle[q.status].label}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Detail panel */}
        <aside className="col-span-5 bg-ink text-paper rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] size-64 bg-cyan-press/15 blur-[100px] rounded-full" />
          <div className="absolute bottom-[-30%] left-[-20%] size-72 bg-magenta-press/10 blur-[100px] rounded-full" />

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-mono uppercase tracking-widest text-paper/40">
                #COT-2402 · Editorial Trillas
              </span>
              <span className="text-[10px] px-2 py-1 rounded uppercase font-bold tracking-tighter bg-emerald-press/20 text-emerald-press">
                Aprobada
              </span>
            </div>

            <h2 className="font-display text-2xl font-bold tracking-tight mb-1">Libro de texto v2</h2>
            <p className="text-paper/60 text-sm mb-6">
              Offset · 5,000 ejemplares · 240 pp interior + tapa dura
            </p>

            <dl className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <Spec label="Papel interior" value="Bond 90g" />
              <Spec label="Tapa" value="Cartón gris 2.5mm" />
              <Spec label="Tiraje" value="5,000 u." />
              <Spec label="Entrega" value="28 días" />
            </dl>

            <div className="border-t border-paper/10 pt-4 mb-6">
              <div className="flex justify-between text-xs text-paper/60 mb-1">
                <span>Subtotal</span>
                <span className="font-mono">$72,580.00</span>
              </div>
              <div className="flex justify-between text-xs text-paper/60 mb-3">
                <span>IVA 16%</span>
                <span className="font-mono">$11,612.80</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-mono uppercase tracking-widest text-paper/40">Total</span>
                <span className="font-display font-bold text-2xl">$84,192.80</span>
              </div>
            </div>

            <div className="mt-auto flex gap-3">
              <button className="flex-1 px-4 py-2 bg-paper text-ink rounded font-bold text-[11px] uppercase tracking-widest">
                Convertir a pedido
              </button>
              <button className="px-4 py-2 border border-paper/20 rounded font-bold text-[11px] uppercase tracking-widest hover:bg-paper/10 transition-colors">
                PDF
              </button>
            </div>
          </div>
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

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-mono uppercase tracking-widest text-paper/40 mb-0.5">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
