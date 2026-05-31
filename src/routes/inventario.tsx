import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { accentBar, accentBg15 } from "@/components/accent-classes";

export const Route = createFileRoute("/inventario")({
  head: () => ({
    meta: [
      { title: "Inventario — PREX ERP" },
      { name: "description", content: "Control de papel, tintas, placas y consumibles." },
    ],
  }),
  component: InventarioPage,
});

interface Item {
  sku: string;
  name: string;
  category: "Papel" | "Tinta" | "Placas" | "Consumible";
  stock: number;
  unit: string;
  min: number;
  location: string;
}

const items: Item[] = [
  { sku: "PAP-001", name: "Couché Semi-mate 250g 70×100", category: "Papel", stock: 84, unit: "resmas", min: 200, location: "A-12" },
  { sku: "PAP-002", name: "Bond 90g 70×95", category: "Papel", stock: 1240, unit: "hojas", min: 500, location: "A-08" },
  { sku: "PAP-003", name: "Opalina 180g Carta", category: "Papel", stock: 320, unit: "hojas", min: 250, location: "A-14" },
  { sku: "TIN-CY", name: "Tinta Process Cyan 1kg", category: "Tinta", stock: 1.2, unit: "kg", min: 3, location: "T-02" },
  { sku: "TIN-MG", name: "Tinta Process Magenta 1kg", category: "Tinta", stock: 5.8, unit: "kg", min: 3, location: "T-02" },
  { sku: "TIN-YL", name: "Tinta Process Yellow 1kg", category: "Tinta", stock: 4.2, unit: "kg", min: 3, location: "T-02" },
  { sku: "PLA-001", name: "Placa CTP 70×100", category: "Placas", stock: 42, unit: "u.", min: 30, location: "P-01" },
  { sku: "CON-001", name: "Goma offset 4L", category: "Consumible", stock: 8, unit: "u.", min: 4, location: "C-05" },
];

const categoryAccent: Record<Item["category"], string> = {
  Papel: "cyan-press",
  Tinta: "magenta-press",
  Placas: "yellow-press",
  Consumible: "emerald-press",
};

export function InventarioPage() {
  return (
    <AppShell
      title="Inventario"
      action={
        <button className="px-4 py-1.5 border border-ink/10 rounded text-[11px] font-semibold uppercase tracking-widest hover:bg-ink hover:text-paper transition-all">
          + Añadir insumo
        </button>
      }
    >
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <SummaryCard label="SKUs activos" value="128" accent="cyan-press" />
        <SummaryCard label="Bajo mínimo" value="03" accent="magenta-press" />
        <SummaryCard label="Reabasteciendo" value="07" accent="yellow-press" />
        <SummaryCard label="Valor en stock" value="$284k" accent="emerald-press" />
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {["Todos", "Papel", "Tinta", "Placas", "Consumible"].map((c, i) => (
            <button
              key={c}
              className={
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors " +
                (i === 0 ? "bg-ink text-paper" : "bg-white border border-ink/5 text-ink/60 hover:text-ink")
              }
            >
              {c}
            </button>
          ))}
        </div>
        <input
          placeholder="Buscar SKU o nombre…"
          className="px-3 py-1.5 bg-white border border-ink/10 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-cyan-press/40 w-64"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-ink/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-mono uppercase tracking-widest text-ink/40 border-b border-ink/5">
              <th className="text-left font-medium px-4 py-3">SKU</th>
              <th className="text-left font-medium px-4 py-3">Insumo</th>
              <th className="text-left font-medium px-4 py-3">Categoría</th>
              <th className="text-right font-medium px-4 py-3">Stock</th>
              <th className="text-right font-medium px-4 py-3">Mínimo</th>
              <th className="text-left font-medium px-4 py-3">Ubicación</th>
              <th className="text-left font-medium px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const low = it.stock < it.min;
              return (
                <tr key={it.sku} className="border-b border-ink/5 last:border-0 hover:bg-ink/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-ink/60">{it.sku}</td>
                  <td className="px-4 py-3 font-medium">{it.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-tighter ${accentBg15[categoryAccent[it.category]]} text-ink/70`}>
                      {it.category}
                    </span>
                  </td>
                  <td className={"px-4 py-3 text-right font-mono " + (low ? "text-destructive font-bold" : "")}>
                    {it.stock} <span className="text-ink/40 text-xs">{it.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-ink/40">{it.min}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink/60">{it.location}</td>
                  <td className="px-4 py-3">
                    {low ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-destructive">
                        <span className="size-1.5 rounded-full bg-destructive animate-pulse" /> Crítico
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-press">
                        <span className="size-1.5 rounded-full bg-emerald-press" /> Óptimo
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-white border border-ink/5 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
      <div className={`absolute top-0 left-0 h-0.5 w-12 ${accentBar[accent]}`} />
      <span className="text-[10px] font-mono uppercase tracking-widest text-ink/40">{label}</span>
      <span className="font-display text-2xl font-bold tracking-tight">{value}</span>
    </div>
  );
}
