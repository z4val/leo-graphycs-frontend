import { useState } from "react";
import { Calendar, ChevronRight, Clock, Layers, Palette, User } from "lucide-react";
import type { WorkOrder } from "./types";
import { sumEntregas } from "./types";
import { cn } from "@/lib/utils";
import {
  formatCantidad,
  formatSoles,
  labelColores,
  labelEstadoOrden,
} from "./format";
import { WorkOrderDetailModal } from "./WorkOrderDetailModal";

const etiquetaClasses: Record<WorkOrder["etiquetaVariant"], string> = {
  cyan: "bg-cyan-press/20 text-ink/80 border-cyan-press/30",
  magenta: "bg-magenta-press/20 text-ink/80 border-magenta-press/30",
  yellow: "bg-yellow-press/25 text-ink/80 border-yellow-press/40",
  emerald: "bg-emerald-press/20 text-ink/80 border-emerald-press/30",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  neutral: "bg-ink/5 text-ink/60 border-ink/10",
};

const prioridadClasses: Record<WorkOrder["prioridad"], string> = {
  baja: "bg-ink/5 text-ink/50 border-ink/10",
  media: "bg-yellow-press/25 text-ink/70 border-yellow-press/40",
  alta: "bg-destructive/10 text-destructive border-destructive/25",
};

interface KanbanCardProps {
  order: WorkOrder;
}

export function KanbanCard({ order }: KanbanCardProps) {
  const [open, setOpen] = useState(false);
  const { cotizacion: c } = order;
  const entregado = sumEntregas(order.entregas);
  const acabadosResumen =
    c.acabados.length > 0
      ? c.acabados.map((a) => a.nombre).join(" · ")
      : "Sin acabados";

  return (
    <>
      <article
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="bg-white rounded-lg border border-ink/10 shadow-sm hover:shadow-md hover:border-cyan-press/30 transition-all cursor-pointer p-3.5 flex flex-col gap-2 group"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] text-ink/45 uppercase tracking-widest">
              {order.codigo}
            </p>
            <p className="font-display font-bold text-sm leading-tight truncate mt-0.5">
              {c.tipoProducto}
            </p>
          </div>
          <ChevronRight className="size-4 text-ink/25 shrink-0 group-hover:text-cyan-press transition-colors" />
        </div>

        <p className="text-xs text-ink/70 truncate flex items-center gap-1">
          <User className="size-3 shrink-0 text-ink/35" />
          {order.cliente.nombre}
        </p>

        <p className="text-[10px] font-mono text-ink/50 leading-snug flex items-start gap-1">
          <Layers className="size-3 shrink-0 mt-0.5" />
          <span>
            {formatCantidad(c.cantidad, c.unidadMedida.toLowerCase())} · {c.papel.nombre} ·{" "}
            {labelColores(c.colores.numero)}
          </span>
        </p>

        <p className="text-[10px] text-ink/45 truncate flex items-center gap-1">
          <Palette className="size-3 shrink-0" />
          {acabadosResumen}
        </p>

        {order.maquinaActual && order.fase === "prensa" && (
          <p className="text-[10px] font-bold text-magenta-press flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-magenta-press animate-pulse" />
            {order.maquinaActual}
          </p>
        )}

        {order.progresoDiseno !== undefined && order.fase === "pre-prensa" && (
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 bg-ink/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-press rounded-full transition-all"
                style={{ width: `${order.progresoDiseno}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-ink/40">Diseño {order.progresoDiseno}%</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border",
              etiquetaClasses[order.etiquetaVariant],
            )}
          >
            {order.etiquetaEstado}
          </span>
          <span className="text-[10px] text-ink/40 font-mono">
            {labelEstadoOrden(order.estado)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px] text-ink/50">
          {order.fechaEstimadaEntrega && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3 shrink-0" />
              Entrega: {order.fechaEstimadaEntrega}
            </span>
          )}
          {order.vencida && (
            <span className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-bold uppercase">
              Vencida
            </span>
          )}
        </div>

        <div className="flex items-end justify-between gap-2 pt-1 border-t border-ink/5">
          <div className="min-w-0">
            <p className="text-[10px] font-mono text-ink/40">Total · Saldo</p>
            <p className="text-xs font-bold font-mono">
              {formatSoles(order.montoTotal)}
              {order.saldoPendiente > 0 && (
                <span className="text-ink/50 font-normal"> / {formatSoles(order.saldoPendiente)}</span>
              )}
            </p>
            {entregado > 0 && (
              <p className="text-[9px] text-emerald-press/90 font-mono mt-0.5">
                Entregado: {formatCantidad(entregado, c.unidadMedida.toLowerCase())}
              </p>
            )}
          </div>
          <span
            className={cn(
              "shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border capitalize",
              prioridadClasses[order.prioridad],
            )}
          >
            {order.prioridad}
          </span>
        </div>

        {order.numeroReprocesos > 0 && (
          <p className="text-[9px] font-mono uppercase tracking-widest text-destructive/80">
            Reproceso #{order.numeroReprocesos}
          </p>
        )}

        <p className="text-[9px] text-ink/35 flex items-center gap-1">
          <Calendar className="size-2.5" />
          {order.fechaCreacion} · Clic para detalle
        </p>
      </article>

      <WorkOrderDetailModal order={order} open={open} onOpenChange={setOpen} />
    </>
  );
}
