import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { KanbanBoard } from "@/components/kanban";
import { kanbanService } from "@/lib/api/kanban.service";
import { authService } from "@/lib/api/auth.service";
import type { WorkOrder } from "@/components/kanban/types";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    if (!authService.isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  component: DashboardPage,
});

export function DashboardPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  // ← estado para saber si está cargando

  useEffect(() => {
    // ← se ejecuta cuando el componente carga
    kanbanService.listarOrdenes()
      .then((data) => {
        setOrders(data as WorkOrder[]);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error cargando órdenes:", err);
        setLoading(false);
      });
  }, []);
  // ← el [] significa que solo se ejecuta una vez al cargar la página

  if (loading) return <div>Cargando órdenes...</div>;

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
      <KanbanBoard orders={orders} className="h-[calc(100vh-8rem)]" />
    </AppShell>
  );
}