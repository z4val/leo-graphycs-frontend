import { LayoutGrid, List, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface KanbanFilters {
  query: string;
  phase: string;
  balance: string;
  due: string;
  priority: string;
}

interface KanbanToolbarProps {
  filters: KanbanFilters;
  onChange: (filters: KanbanFilters) => void;
}

export function KanbanToolbar({ filters, onChange }: KanbanToolbarProps) {
  const update = (patch: Partial<KanbanFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="mb-4 space-y-4 shrink-0">
      <div className="flex flex-wrap items-center gap-2">
        <ViewToggle active="tablero" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/30" />
          <Input
            placeholder="Buscar orden, cliente o producto..."
            className="h-9 border-ink/10 bg-white pl-9 text-sm"
            value={filters.query}
            onChange={(event) => update({ query: event.target.value })}
          />
        </div>
        <FilterSelect
          value={filters.phase}
          onChange={(phase) => update({ phase })}
          options={[
            ["todas", "Todas las etapas"],
            ["pre-prensa", "Pre-prensa"],
            ["prensa", "Prensa"],
            ["post-prensa", "Post-prensa"],
          ]}
        />
        <FilterSelect
          value={filters.balance}
          onChange={(balance) => update({ balance })}
          options={[
            ["todos", "Todos los saldos"],
            ["con-saldo", "Con saldo"],
            ["saldadas", "Saldadas"],
          ]}
        />
        <FilterSelect
          value={filters.due}
          onChange={(due) => update({ due })}
          options={[
            ["todos", "Todo vencimiento"],
            ["vencidas", "Vencidas"],
            ["vigentes", "Vigentes"],
          ]}
        />
        <FilterSelect
          value={filters.priority}
          onChange={(priority) => update({ priority })}
          options={[
            ["todas", "Toda prioridad"],
            ["alta", "Alta"],
            ["media", "Media"],
            ["baja", "Baja"],
          ]}
        />
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 rounded-md border border-ink/10 bg-white px-3 text-xs font-medium text-ink/60 outline-none transition-colors hover:border-ink/20 hover:text-ink focus:ring-2 focus:ring-cyan-press/30"
    >
      {options.map(([optionValue, label]) => (
        <option key={optionValue} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  );
}

function ViewToggle({ active }: { active: "tablero" | "reporte" }) {
  return (
    <div className="inline-flex rounded-lg border border-ink/10 bg-white p-0.5">
      <button
        type="button"
        className={
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors " +
          (active === "tablero" ? "bg-cyan-press/20 text-ink" : "text-ink/45 hover:text-ink")
        }
      >
        <LayoutGrid className="size-3.5" />
        Tablero
      </button>
      <button
        type="button"
        className={
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors " +
          (active === "reporte" ? "bg-cyan-press/20 text-ink" : "text-ink/45 hover:text-ink")
        }
      >
        <List className="size-3.5" />
        Reporte
      </button>
    </div>
  );
}
