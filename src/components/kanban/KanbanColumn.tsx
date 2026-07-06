import { accentBg15 } from "@/components/accent-classes";

import { KanbanCard } from "./KanbanCard";
import type { KanbanPhaseConfig, WorkOrder } from "./types";

interface KanbanColumnProps {
  config: KanbanPhaseConfig;
  orders: WorkOrder[];
  onOrderUpdated?: (order: WorkOrder) => void;
  expanded?: boolean;
}

export function KanbanColumn({
  config,
  orders,
  onOrderUpdated,
  expanded = false,
}: KanbanColumnProps) {
  const Icon = config.icon;
  const countClass = accentBg15[config.accent];

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-ink/10 bg-ink/[0.02] shadow-sm">
      <header className={`flex items-center gap-2 border-b px-4 py-3 ${config.headerBorder} ${config.headerBg}`}>
        <Icon className="size-4 shrink-0 text-ink/70" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest">{config.title}</h2>
          <p className="truncate text-[10px] text-ink/45">{config.subtitle}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-bold text-ink/70 ${countClass}`}>
          {String(orders.length).padStart(2, "0")}
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        {orders.length === 0 ? (
          <p className="py-8 text-center font-mono text-xs uppercase tracking-widest text-ink/35">
            Sin ordenes
          </p>
        ) : (
          orders.map((order) => (
            <KanbanCard
              key={order.id}
              order={order}
              onOrderUpdated={onOrderUpdated}
              expanded={expanded}
            />
          ))
        )}
      </div>
    </section>
  );
}
