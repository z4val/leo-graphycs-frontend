import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import { KanbanColumn } from "./KanbanColumn";
import { KanbanToolbar, type KanbanFilters } from "./KanbanToolbar";
import { KANBAN_PHASES, type WorkOrder } from "./types";
import { DeliveredOrdersReport } from "./DeliveredOrdersReport";

interface KanbanBoardProps {
  orders: WorkOrder[];
  onOrderUpdated?: (order: WorkOrder) => void;
  className?: string;
}

export function KanbanBoard({ orders, onOrderUpdated, className }: KanbanBoardProps) {
  const [filters, setFilters] = useState<KanbanFilters>({
    query: "",
    phase: "todas",
    balance: "todos",
    due: "todos",
    priority: "todas",
  });
  const [view, setView] = useState<"tablero" | "reporte">("tablero");

  const filteredOrders = useMemo(
    () => orders.filter((order) => matchesFilters(order, filters)),
    [orders, filters],
  );

  const ordersByPhase = useMemo(() => {
    const map: Record<string, WorkOrder[]> = {};
    for (const phase of KANBAN_PHASES) {
      map[phase.id] = filteredOrders.filter((order) => order.fase === phase.id);
    }
    return map;
  }, [filteredOrders]);

  const visiblePhases = useMemo(
    () => KANBAN_PHASES.filter((phase) => filters.phase === "todas" || phase.id === filters.phase),
    [filters.phase],
  );

  const expandedPhase = filters.phase !== "todas";

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <KanbanToolbar filters={filters} onChange={setFilters} view={view} onViewChange={setView} />

      {view === "reporte" ? (
        <DeliveredOrdersReport orders={filteredOrders.filter((order) => order.estado === "ENTREGADO")} onOrderUpdated={onOrderUpdated} />
      ) : (

      <div
        className={cn(
          "grid flex-1 grid-cols-1 gap-5 min-h-0",
          expandedPhase ? "lg:grid-cols-1" : "lg:grid-cols-3",
        )}
      >
        {visiblePhases.map((phase) => (
          <KanbanColumn
            key={phase.id}
            config={phase}
            orders={ordersByPhase[phase.id] ?? []}
            onOrderUpdated={onOrderUpdated}
            expanded={expandedPhase}
          />
        ))}
      </div>
      )}
    </div>
  );
}

function matchesFilters(order: WorkOrder, filters: KanbanFilters) {
  const query = filters.query.trim().toLowerCase();
  const searchable = [
    order.codigo,
    order.cliente.nombre,
    order.cliente.numeroDocumento,
    order.cotizacion.codigo,
    order.cotizacion.tipoProducto,
    order.cotizacion.categoriaProducto,
  ]
    .join(" ")
    .toLowerCase();

  if (query && !searchable.includes(query)) return false;
  if (filters.phase !== "todas" && order.fase !== filters.phase) return false;
  if (filters.balance === "con-saldo" && order.saldoPendiente <= 0) return false;
  if (filters.balance === "saldadas" && order.saldoPendiente > 0) return false;
  if (filters.due === "vencidas" && !order.vencida) return false;
  if (filters.due === "vigentes" && order.vencida) return false;
  if (filters.priority !== "todas" && (order.prioridad ?? "media") !== filters.priority) return false;

  return true;
}
