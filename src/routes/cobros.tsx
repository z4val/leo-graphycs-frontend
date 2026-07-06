import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { formatSoles } from "@/components/kanban/format";
import { authService } from "@/lib/api/auth.service";
import { pagosService, type CobrosResumen, type MedioPago } from "@/lib/api/pagos.service";

const roles = ["Contador", "Gerente", "Administrador"];

export const Route = createFileRoute("/cobros")({
  beforeLoad: () => {
    if (!authService.isAuthenticated()) throw redirect({ to: "/login" });
    if (!roles.includes(authService.getCurrentUser()?.rol ?? "")) throw redirect({ to: "/dashboard" });
  },
  component: CobrosPage,
});

function CobrosPage() {
  const [data, setData] = useState<CobrosResumen | null>(null);
  const [medios, setMedios] = useState<MedioPago[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("todos");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    Promise.all([pagosService.resumen(), pagosService.medios()])
      .then(([resumen, mediosPago]) => {
        setData(resumen);
        setMedios(mediosPago);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar cobros"));
  }, []);

  useEffect(load, [load]);

  const orders = useMemo(
    () =>
      (data?.ordenes ?? []).filter(
        (order) =>
          order.cliente.nombre.toLowerCase().includes(query.toLowerCase()) &&
          (status === "todos" ||
            (status === "saldadas" ? order.saldoPendiente <= 0 : order.saldoPendiente > 0)),
      ),
    [data, query, status],
  );

  return (
    <AppShell title="Cobros">
      {!data && !error ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-ink/5" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/20 p-6">
          {error}
          <button className="ml-3 underline" onClick={load}>
            Reintentar
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Facturado" value={data!.montoFacturado} />
            <Stat label="Cobrado" value={data!.totalCobrado} />
            <Stat label="Pendiente" value={data!.saldoPendiente} />
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              className="rounded border px-3 py-2"
              placeholder="Buscar cliente"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="rounded border px-3"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="pendientes">Pendientes</option>
              <option value="saldadas">Saldadas</option>
            </select>
          </div>

          <div className="space-y-3">
            {orders.map((order) => (
              <CobroRow key={order.id} order={order} medios={medios} onDone={load} onError={setError} />
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function CobroRow({
  order,
  medios,
  onDone,
  onError,
}: {
  order: CobrosResumen["ordenes"][number];
  medios: MedioPago[];
  onDone: () => void;
  onError: (error: string) => void;
}) {
  return (
    <form
      className="grid items-center gap-3 rounded-xl border bg-white p-4 xl:grid-cols-[1fr_auto_auto_auto_auto_auto_auto]"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const file = form.get("comprobante");
        try {
          await pagosService.registrar(
            order.id,
            Number(form.get("medio")),
            Number(form.get("monto")),
            String(form.get("observaciones") ?? ""),
            String(form.get("numeroOperacion") ?? ""),
            file instanceof File && file.size > 0 ? file : null,
          );
          onDone();
          event.currentTarget.reset();
        } catch (error) {
          onError(error instanceof Error ? error.message : "No se pudo registrar");
        }
      }}
    >
      <div>
        <p className="font-semibold">{order.cliente.nombre}</p>
        <p className="text-xs text-ink/50">
          {order.codigo} · Saldo {formatSoles(order.saldoPendiente)}
        </p>
      </div>
      <select name="medio" required className="rounded border px-2 py-1.5 text-sm">
        <option value="">Medio</option>
        {medios.map((medio) => (
          <option key={medio.idMedioPago} value={medio.idMedioPago}>
            {medio.nombre}
          </option>
        ))}
      </select>
      <input
        name="monto"
        required
        type="number"
        min="0.01"
        step="0.01"
        max={order.saldoPendiente}
        placeholder="Monto"
        className="w-28 rounded border px-2 py-1.5"
      />
      <input
        name="numeroOperacion"
        placeholder="Operación"
        className="w-32 rounded border px-2 py-1.5 text-sm"
      />
      <input
        name="observaciones"
        placeholder="Observación"
        className="w-36 rounded border px-2 py-1.5 text-sm"
      />
      <input
        name="comprobante"
        type="file"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        className="max-w-44 text-xs"
      />
      <button
        disabled={order.saldoPendiente <= 0}
        className="rounded bg-ink px-3 py-2 text-xs text-paper disabled:opacity-40"
      >
        {order.saldoPendiente <= 0 ? "Saldada" : "Registrar"}
      </button>
    </form>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs text-ink/50">{label}</p>
      <p className="text-2xl font-bold">{formatSoles(value)}</p>
    </div>
  );
}
