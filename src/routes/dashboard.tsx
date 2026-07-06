import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { KanbanBoard } from "@/components/kanban";
import { kanbanService } from "@/lib/api/kanban.service";
import { authService } from "@/lib/api/auth.service";
import type { WorkOrder } from "@/components/kanban/types";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => { if (!authService.isAuthenticated()) throw redirect({ to: "/login" }); },
  component: DashboardPage,
});

export function DashboardPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    setLoading(true); setError("");
    kanbanService.listarOrdenes()
      .then(data => setOrders(data.filter(o => o.fase != null)))
      .catch(e => setError(e instanceof Error ? e.message : "No se pudieron cargar las órdenes"))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  return (
    <AppShell title="Órdenes de trabajo">
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[1,2,3].map(i => <div key={i} className="h-96 rounded-xl bg-ink/5 animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/20 p-6">
          <p>{error}</p><button className="mt-3 underline" onClick={load}>Reintentar</button>
        </div>
      ) : (
        <KanbanBoard orders={orders}
          onOrderUpdated={updated => setOrders(current => {
            const next = current.map(o => o.id === updated.id ? updated : o);
            return updated.fase == null ? next.filter(o => o.id !== updated.id) : next;
          })}
          className="h-[calc(100vh-8rem)]" />
      )}
    </AppShell>
  );
}
