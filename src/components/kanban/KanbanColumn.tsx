import type { KanbanPhaseConfig } from "./types";
import type { WorkOrder } from "./types";
import { KanbanCard } from "./KanbanCard";
import { accentBg15 } from "@/components/accent-classes";

interface KanbanColumnProps {
  config: KanbanPhaseConfig;
  orders: WorkOrder[];
}

export function KanbanColumn({ config, orders }: KanbanColumnProps) {
  const Icon = config.icon;
  const countClass = accentBg15[config.accent];

  return (
    <section className="flex flex-col min-h-0 h-full rounded-xl overflow-hidden border border-ink/10 bg-ink/[0.02] shadow-sm">
      <header
        className={`flex items-center gap-2 px-4 py-3 border-b ${config.headerBorder} ${config.headerBg}`}
      >
        <Icon className="size-4 text-ink/70 shrink-0" aria-hidden />
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-bold text-sm uppercase tracking-widest">{config.title}</h2>
          <p className="text-[10px] text-ink/45 truncate">{config.subtitle}</p>
        </div>
        <span
          className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full text-ink/70 ${countClass}`}
        >
          {String(orders.length).padStart(2, "0")}
        </span>
      </header>

      <div className="flex-1 min-h-0 p-3 flex flex-col gap-3 overflow-y-auto">
        {orders.length === 0 ? (
          <p className="text-center text-xs text-ink/35 py-8 font-mono uppercase tracking-widest">
            Sin órdenes
          </p>
        ) : (
          orders.map((order) => <KanbanCard key={order.id} order={order} />)
        )}
      </div>
    </section>
  );
}
