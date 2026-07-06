import { useState, type KeyboardEvent } from "react";
import { Calendar, ChevronRight, Clock, Layers, Palette, User } from "lucide-react";

import { cn } from "@/lib/utils";

import { formatCantidad, formatSoles, labelColores, labelEstadoOrden } from "./format";
import type { EstadoEtiquetaVariant, OrderPriority, WorkOrder } from "./types";
import { sumEntregas } from "./types";
import { WorkOrderDetailModal } from "./WorkOrderDetailModal";

const etiquetaClasses: Record<EstadoEtiquetaVariant, string> = {
  cyan: "bg-cyan-press/20 text-ink/80 border-cyan-press/30",
  magenta: "bg-magenta-press/20 text-ink/80 border-magenta-press/30",
  yellow: "bg-yellow-press/25 text-ink/80 border-yellow-press/40",
  emerald: "bg-emerald-press/20 text-ink/80 border-emerald-press/30",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  neutral: "bg-ink/5 text-ink/60 border-ink/10",
};

const prioridadClasses: Record<OrderPriority, string> = {
  baja: "bg-ink/5 text-ink/50 border-ink/10",
  media: "bg-yellow-press/25 text-ink/70 border-yellow-press/40",
  alta: "bg-destructive/10 text-destructive border-destructive/25",
};

interface KanbanCardProps {
  order: WorkOrder;
  onOrderUpdated?: (order: WorkOrder) => void;
  expanded?: boolean;
}

export function KanbanCard({ order, onOrderUpdated, expanded = false }: KanbanCardProps) {
  const [open, setOpen] = useState(false);
  const { cotizacion: c } = order;
  const entregado = sumEntregas(order.entregas);
  const acabadosResumen =
    c.acabados.length > 0 ? c.acabados.map((a) => a.nombre).join(" · ") : "Sin acabados";

  const openDetail = () => setOpen(true);
  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openDetail();
    }
  };

  if (expanded) {
    return (
      <>
        <article
          role="button"
          tabIndex={0}
          onClick={openDetail}
          onKeyDown={handleKeyDown}
          className="group cursor-pointer rounded-lg border border-ink/10 bg-white p-4 shadow-sm transition-all hover:border-cyan-press/30 hover:shadow-md"
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">{order.codigo}</p>
                  <p className="mt-0.5 truncate font-display text-base font-bold leading-tight">{c.tipoProducto}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-ink/25 transition-colors group-hover:text-cyan-press" />
              </div>
              <p className="flex items-center gap-1 truncate text-sm font-semibold text-ink/75">
                <User className="size-3.5 shrink-0 text-ink/35" />
                {order.cliente.nombre}
              </p>
              <p className="text-xs text-ink/45">
                {order.cliente.tipoDocumento} {order.cliente.numeroDocumento}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge order={order} />
                <PriorityBadge priority={order.prioridad ?? "media"} />
              </div>
            </div>

            <div className="min-w-0 space-y-2 border-y border-ink/5 py-3 lg:border-x lg:border-y-0 lg:px-4 lg:py-0">
              <p className="flex items-start gap-1 font-mono text-xs text-ink/55">
                <Layers className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  {formatCantidad(c.cantidad, c.unidadMedida.toLowerCase())} · {c.papel.nombre} ·{" "}
                  {labelColores(c.colores.numero)}
                </span>
              </p>
              <p className="flex items-center gap-1 truncate text-xs text-ink/45">
                <Palette className="size-3.5 shrink-0" />
                {acabadosResumen}
              </p>
              {order.fechaEstimadaEntrega && (
                <p className="flex items-center gap-1 text-xs text-ink/50">
                  <Clock className="size-3.5 shrink-0" />
                  Entrega estimada: {order.fechaEstimadaEntrega}
                </p>
              )}
              {entregado > 0 && (
                <p className="font-mono text-xs text-emerald-press/90">
                  Entregado: {formatCantidad(entregado, c.unidadMedida.toLowerCase())}
                </p>
              )}
              {order.numeroReprocesos > 0 && (
                <p className="font-mono text-[10px] uppercase tracking-widest text-destructive/80">
                  Reproceso #{order.numeroReprocesos}
                </p>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              <MiniMetric label="Total" value={formatSoles(order.montoTotal)} />
              <MiniMetric label="Pagado" value={formatSoles(order.totalPagado)} />
              <MiniMetric label="Saldo" value={formatSoles(order.saldoPendiente)} danger={order.saldoPendiente > 0} />
              <p className="flex items-center gap-1 text-[10px] text-ink/35 sm:col-span-3 lg:col-span-1">
                <Calendar className="size-2.5" />
                {order.fechaCreacion} · Clic para detalle
              </p>
            </div>
          </div>
        </article>

        <WorkOrderDetailModal order={order} open={open} onOpenChange={setOpen} onOrderUpdated={onOrderUpdated} />
      </>
    );
  }

  return (
    <>
      <article
        role="button"
        tabIndex={0}
        onClick={openDetail}
        onKeyDown={handleKeyDown}
        className="group flex cursor-pointer flex-col gap-2 rounded-lg border border-ink/10 bg-white p-3.5 shadow-sm transition-all hover:border-cyan-press/30 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink/45">{order.codigo}</p>
            <p className="mt-0.5 truncate font-display text-sm font-bold leading-tight">{c.tipoProducto}</p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-ink/25 transition-colors group-hover:text-cyan-press" />
        </div>

        <p className="flex items-center gap-1 truncate text-xs text-ink/70">
          <User className="size-3 shrink-0 text-ink/35" />
          {order.cliente.nombre}
        </p>

        <p className="flex items-start gap-1 font-mono text-[10px] leading-snug text-ink/50">
          <Layers className="mt-0.5 size-3 shrink-0" />
          <span>
            {formatCantidad(c.cantidad, c.unidadMedida.toLowerCase())} · {c.papel.nombre} ·{" "}
            {labelColores(c.colores.numero)}
          </span>
        </p>

        <p className="flex items-center gap-1 truncate text-[10px] text-ink/45">
          <Palette className="size-3 shrink-0" />
          {acabadosResumen}
        </p>

        {order.maquinaActual && order.fase === "prensa" && (
          <p className="flex items-center gap-1 text-[10px] font-bold text-magenta-press">
            <span className="size-1.5 animate-pulse rounded-full bg-magenta-press" />
            {order.maquinaActual}
          </p>
        )}

        {order.progresoDiseno !== undefined && order.fase === "pre-prensa" && (
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink/5">
              <div className="h-full rounded-full bg-cyan-press transition-all" style={{ width: `${order.progresoDiseno}%` }} />
            </div>
            <span className="font-mono text-[10px] text-ink/40">Diseño {order.progresoDiseno}%</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge order={order} />
          <span className="font-mono text-[10px] text-ink/40">{labelEstadoOrden(order.estado)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px] text-ink/50">
          {order.fechaEstimadaEntrega && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3 shrink-0" />
              Entrega: {order.fechaEstimadaEntrega}
            </span>
          )}
          {order.vencida && (
            <span className="rounded bg-destructive/10 px-1.5 py-0.5 font-bold uppercase text-destructive">
              Vencida
            </span>
          )}
        </div>

        <div className="flex items-end justify-between gap-2 border-t border-ink/5 pt-1">
          <div className="min-w-0">
            <p className="font-mono text-[10px] text-ink/40">Total · Saldo</p>
            <p className="font-mono text-xs font-bold">
              {formatSoles(order.montoTotal)}
              {order.saldoPendiente > 0 && (
                <span className="font-normal text-ink/50"> / {formatSoles(order.saldoPendiente)}</span>
              )}
            </p>
            {entregado > 0 && (
              <p className="mt-0.5 font-mono text-[9px] text-emerald-press/90">
                Entregado: {formatCantidad(entregado, c.unidadMedida.toLowerCase())}
              </p>
            )}
          </div>
          <PriorityBadge priority={order.prioridad ?? "media"} />
        </div>

        {order.numeroReprocesos > 0 && (
          <p className="font-mono text-[9px] uppercase tracking-widest text-destructive/80">
            Reproceso #{order.numeroReprocesos}
          </p>
        )}

        <p className="flex items-center gap-1 text-[9px] text-ink/35">
          <Calendar className="size-2.5" />
          {order.fechaCreacion} · Clic para detalle
        </p>
      </article>

      <WorkOrderDetailModal order={order} open={open} onOpenChange={setOpen} onOrderUpdated={onOrderUpdated} />
    </>
  );
}

function StatusBadge({ order }: { order: WorkOrder }) {
  return (
    <span
      className={cn(
        "inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold",
        etiquetaClasses[order.etiquetaVariant ?? "neutral"],
      )}
    >
      {order.etiquetaEstado ?? labelEstadoOrden(order.estado)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: OrderPriority }) {
  return (
    <span className={cn("shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold capitalize", prioridadClasses[priority])}>
      {priority}
    </span>
  );
}

function MiniMetric({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded border border-ink/5 bg-ink/[0.015] px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink/40">{label}</p>
      <p className={cn("font-mono text-sm font-bold", danger ? "text-destructive" : "text-ink/75")}>{value}</p>
    </div>
  );
}
