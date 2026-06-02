import { ChevronDown, LayoutGrid, List, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function KanbanToolbar() {
  const filters = ["Estado", "Prioridad", "Cliente", "Responsable", "Producto", "Vencimiento"];

  return (
    <div className="space-y-4 mb-4 shrink-0">
      <div className="flex flex-wrap items-center gap-2">
        <ViewToggle active="tablero" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink/30" />
          <Input
            placeholder="Buscar orden, cliente o producto…"
            className="pl-9 h-9 text-sm bg-white border-ink/10"
            readOnly
          />
        </div>
        {filters.map((label) => (
          <button
            key={label}
            type="button"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-ink/10 bg-white text-ink/60 hover:border-ink/20 hover:text-ink transition-colors"
          >
            {label}
            <ChevronDown className="size-3 opacity-50" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ViewToggle({ active }: { active: "tablero" | "reporte" }) {
  return (
    <div className="inline-flex rounded-lg border border-ink/10 bg-white p-0.5">
      <button
        type="button"
        className={
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors " +
          (active === "tablero"
            ? "bg-cyan-press/20 text-ink"
            : "text-ink/45 hover:text-ink")
        }
      >
        <LayoutGrid className="size-3.5" />
        Tablero
      </button>
      <button
        type="button"
        className={
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors " +
          (active === "reporte"
            ? "bg-cyan-press/20 text-ink"
            : "text-ink/45 hover:text-ink")
        }
      >
        <List className="size-3.5" />
        Reporte
      </button>
    </div>
  );
}
