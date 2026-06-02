import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { KanbanBoard, mockWorkOrders } from "@/components/kanban";
import { authService } from "@/lib/api/auth.service";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    if (!authService.isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Tablero de Producción — PREX ERP" },
      {
        name: "description",
        content: "Órdenes de trabajo en Pre-prensa, Prensa y Post-prensa.",
      },
    ],
  }),
  component: DashboardPage,
});

export function DashboardPage() {
  return (
    <AppShell
      title="Órdenes de trabajo"
      action={
        <button
          type="button"
          className="px-4 py-1.5 border border-ink/10 rounded text-[11px] font-semibold uppercase tracking-widest hover:bg-ink hover:text-paper transition-all"
        >
          + Nuevo pedido
        </button>
      }
    >
      <KanbanBoard orders={mockWorkOrders} className="h-[calc(100vh-8rem)]" />
    </AppShell>
  );
}
