import { useState } from "react";
import { CheckCircle2, FileText } from "lucide-react";
import { formatCantidad, formatSoles } from "./format";
import { WorkOrderDetailModal } from "./WorkOrderDetailModal";
import type { WorkOrder } from "./types";

export function DeliveredOrdersReport({ orders, onOrderUpdated }: { orders: WorkOrder[]; onOrderUpdated?: (order: WorkOrder) => void }) {
  const [selected, setSelected] = useState<WorkOrder | null>(null);

  return (
    <section className="min-h-0 flex-1 overflow-auto rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest"><FileText className="size-4 text-cyan-press" /> Reporte de pedidos entregados</h2>
          <p className="mt-1 text-xs text-ink/50">Trazabilidad comercial, producción, calidad y entrega de órdenes concluidas.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <Metric label="Entregados" value={String(orders.length)} />
        </div>
      </div>
      {orders.length === 0 ? <p className="py-12 text-center text-sm text-ink/45">No hay pedidos entregados con los filtros actuales.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead className="border-y border-ink/10 bg-ink/[0.02] text-[10px] uppercase tracking-wider text-ink/45"><tr><th className="px-3 py-2">Pedido</th><th className="px-3 py-2">Cliente / producto</th><th className="px-3 py-2">Trazabilidad</th><th className="px-3 py-2">Entrega</th><th className="px-3 py-2">Cobro</th><th className="px-3 py-2" /></tr></thead>
            <tbody className="divide-y divide-ink/5">
              {orders.map((order) => {
                const qc = order.controlesCalidad.some((item) => item.resultado === "APROBADO");
                return <tr key={order.id} className="hover:bg-cyan-press/[0.03]"><td className="px-3 py-3 font-mono font-bold">{order.codigo}<span className="mt-1 block font-normal text-ink/45">{formatFechaHora(order.fechaCreacion)}</span></td><td className="px-3 py-3"><p className="font-semibold">{order.cliente.nombre}</p><p className="text-ink/50">{order.cotizacion.tipoProducto}</p></td><td className="px-3 py-3"><p>{order.aprobacionesDiseno.length > 0 ? "Diseño aprobado" : "Sin aprobación"}</p><p className={qc ? "text-emerald-press" : "text-destructive"}>{qc ? "Calidad aprobada" : "Calidad pendiente"}</p><p className="text-ink/50">{order.historialEstados.length} eventos · {order.entregas.length} entrega(s)</p></td><td className="px-3 py-3"><p>{formatCantidad(order.cotizacion.cantidad, order.cotizacion.unidadMedida.toLowerCase())}</p><p className="text-ink/50">{formatFechaHora(order.fechaEntregaReal)}</p></td><td className="px-3 py-3"><p>{formatSoles(order.totalPagado)} / {formatSoles(order.montoTotal)}</p><p className={order.saldoPendiente > 0 ? "text-destructive" : "text-emerald-press"}>{order.saldoPendiente > 0 ? `Saldo ${formatSoles(order.saldoPendiente)}` : "Saldado"}</p></td><td className="px-3 py-3"><button type="button" onClick={() => setSelected(order)} className="inline-flex items-center gap-1 rounded border border-cyan-press/30 px-2 py-1 font-semibold text-cyan-press hover:bg-cyan-press/10"><CheckCircle2 className="size-3" /> Ver trazabilidad</button></td></tr>;
              })}
            </tbody>
          </table>
        </div>
      )}
      <WorkOrderDetailModal order={selected} open={selected != null} onOpenChange={(open) => !open && setSelected(null)} onOrderUpdated={onOrderUpdated} readOnly />
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded border border-ink/10 px-3 py-2"><p className="text-[9px] uppercase tracking-wider text-ink/45">{label}</p><p className="font-mono font-bold text-ink/75">{value}</p></div>; }
function formatFechaHora(value?: string) { if (!value) return "—"; const date = new Date(value); if (Number.isNaN(date.getTime())) return value; const months = ["ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "set.", "oct.", "nov.", "dic."]; const hour = date.getHours(); return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${hour % 12 || 12}:${String(date.getMinutes()).padStart(2, "0")} ${hour < 12 ? "a. m." : "p. m."}`; }
