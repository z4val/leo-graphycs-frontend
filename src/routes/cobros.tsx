import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { authService } from "@/lib/api/auth.service";
import { pagosService, type CobrosResumen, type MedioPago } from "@/lib/api/pagos.service";
import { formatSoles } from "@/components/kanban/format";

const roles = ["Contador", "Gerente", "Administrador"];
export const Route = createFileRoute("/cobros")({
  beforeLoad: () => {
    if (!authService.isAuthenticated()) throw redirect({ to: "/login" });
    if (!roles.includes(authService.getCurrentUser()?.rol ?? "")) throw redirect({ to: "/dashboard" });
  },
  component: CobrosPage,
});

function CobrosPage() {
  const [data, setData] = useState<CobrosResumen | null>(null);
  const [medios, setMedios] = useState<MedioPago[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("todos");
  const [error, setError] = useState("");
  const load = useCallback(() => {
    setError("");
    Promise.all([pagosService.resumen(), pagosService.medios()])
      .then(([r,m]) => { setData(r); setMedios(m); })
      .catch(e => setError(e instanceof Error ? e.message : "No se pudo cargar cobros"));
  }, []);
  useEffect(load, [load]);
  const orders = useMemo(() => (data?.ordenes ?? []).filter(o =>
    o.cliente.nombre.toLowerCase().includes(query.toLowerCase()) &&
    (status === "todos" || (status === "saldadas" ? o.saldoPendiente <= 0 : o.saldoPendiente > 0))
  ), [data, query, status]);
  return <AppShell title="Cobros">
    {!data && !error ? <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-ink/5 animate-pulse rounded-xl" />)}</div>
    : error ? <div className="p-6 border border-destructive/20 rounded-lg">{error}<button className="ml-3 underline" onClick={load}>Reintentar</button></div>
    : <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat label="Facturado" value={data!.montoFacturado}/><Stat label="Cobrado" value={data!.totalCobrado}/><Stat label="Pendiente" value={data!.saldoPendiente}/>
      </div>
      <div className="flex gap-3"><input className="border rounded px-3 py-2" placeholder="Buscar cliente" value={query} onChange={e=>setQuery(e.target.value)}/><select className="border rounded px-3" value={status} onChange={e=>setStatus(e.target.value)}><option value="todos">Todos</option><option value="pendientes">Pendientes</option><option value="saldadas">Saldadas</option></select></div>
      <div className="space-y-3">{orders.map(o => <form key={o.id} className="grid md:grid-cols-[1fr_auto_auto_auto] gap-3 items-center border rounded-xl p-4" onSubmit={async e => {
        e.preventDefault(); const f=new FormData(e.currentTarget);
        try { await pagosService.registrar(o.id, Number(f.get("medio")), Number(f.get("monto"))); load(); e.currentTarget.reset(); } catch(x){setError(x instanceof Error?x.message:"No se pudo registrar");}
      }}><div><p className="font-semibold">{o.cliente.nombre}</p><p className="text-xs text-ink/50">{o.codigo} · Saldo {formatSoles(o.saldoPendiente)}</p></div>
      <select name="medio" required className="border rounded px-2 py-1.5 text-sm"><option value="">Medio</option>{medios.map(m=><option key={m.idMedioPago} value={m.idMedioPago}>{m.nombre}</option>)}</select>
      <input name="monto" required type="number" min=".01" step=".01" max={o.saldoPendiente} placeholder="Monto" className="w-28 border rounded px-2 py-1.5"/>
      <button disabled={o.saldoPendiente<=0} className="bg-ink text-paper rounded px-3 py-2 text-xs disabled:opacity-40">{o.saldoPendiente<=0?"Saldada":"Registrar"}</button></form>)}</div>
    </div>}
  </AppShell>;
}
function Stat({label,value}:{label:string,value:number}){return <div className="border rounded-xl p-4 bg-white"><p className="text-xs text-ink/50">{label}</p><p className="text-2xl font-bold">{formatSoles(value)}</p></div>}
