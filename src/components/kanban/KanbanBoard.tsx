import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { KANBAN_PHASES } from "./types";
import type { WorkOrder } from "./types";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanToolbar, type KanbanFilters } from "./KanbanToolbar";

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

  const filteredOrders = useMemo(
    () => orders.filter((order) => matchesFilters(order, filters)),
    [orders, filters],
  );

  const ordersByPhase = useMemo(() => {
    const map: Record<string, WorkOrder[]> = {};
    for (const phase of KANBAN_PHASES) {
      map[phase.id] = filteredOrders.filter((o) => o.fase === phase.id);
    }
    return map;
  }, [filteredOrders]);

  return (
    <div className={cn("flex flex-col min-h-0", className)}>
      <KanbanToolbar filters={filters} onChange={setFilters} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-0">
        {KANBAN_PHASES.map((phase) => (
          <KanbanColumn key={phase.id} config={phase} orders={ordersByPhase[phase.id] ?? []} onOrderUpdated={onOrderUpdated} />
        ))}
      </div>
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
  ].join(" ").toLowerCase();

  if (query && !searchable.includes(query)) return false;
  if (filters.phase !== "todas" && order.fase !== filters.phase) return false;
  if (filters.balance === "con-saldo" && order.saldoPendiente <= 0) return false;
  if (filters.balance === "saldadas" && order.saldoPendiente > 0) return false;
  if (filters.due === "vencidas" && !order.vencida) return false;
  if (filters.due === "vigentes" && order.vencida) return false;
  if (filters.priority !== "todas" && (order.prioridad ?? "media") !== filters.priority) return false;

  return true;
}
