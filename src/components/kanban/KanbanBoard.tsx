import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { KANBAN_PHASES } from "./types";
import type { WorkOrder } from "./types";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanToolbar } from "./KanbanToolbar";

interface KanbanBoardProps {
  orders: WorkOrder[];
  onOrderUpdated?: (order: WorkOrder) => void;
  className?: string;
}

export function KanbanBoard({ orders, onOrderUpdated, className }: KanbanBoardProps) {
  const ordersByPhase = useMemo(() => {
    const map: Record<string, WorkOrder[]> = {};
    for (const phase of KANBAN_PHASES) {
      map[phase.id] = orders.filter((o) => o.fase === phase.id);
    }
    return map;
  }, [orders]);

  return (
    <div className={cn("flex flex-col min-h-0", className)}>
      <KanbanToolbar />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-0">
        {KANBAN_PHASES.map((phase) => (
          <KanbanColumn key={phase.id} config={phase} orders={ordersByPhase[phase.id] ?? []} onOrderUpdated={onOrderUpdated} />
        ))}
      </div>
    </div>
  );
}
