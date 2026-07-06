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
          `${order.cliente.nombre} ${order.codigo} ${order.cotizacion.tipoProducto}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
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
              placeholder="Buscar cliente, orden o producto"
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
  const pagosActivos = order.pagos.filter((pago) => !pago.anulado);
  const pagosAnulados = order.pagos.filter((pago) => pago.anulado);
  const estaSaldada = order.saldoPendiente <= 0;

  return (
    <details className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <summary className="grid cursor-pointer list-none items-center gap-3 p-4 transition hover:bg-ink/[0.02] md:grid-cols-[1fr_auto_auto_auto]">
        <div className="min-w-0">
          <p className="truncate font-semibold">{order.cliente.nombre}</p>
          <p className="text-xs text-ink/50">
            {order.codigo} · {order.cotizacion.tipoProducto}
          </p>
        </div>
        <Money label="Total" value={order.montoTotal} />
        <Money label="Pagado" value={order.totalPagado} />
        <div className="flex items-center justify-between gap-3 md:justify-end">
          <Money label="Saldo" value={order.saldoPendiente} danger={!estaSaldada} />
          <span
            className={`rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
              estaSaldada
                ? "border-emerald-press/30 bg-emerald-press/10 text-emerald-press"
                : "border-yellow-press/40 bg-yellow-press/20 text-ink/70"
            }`}
          >
            {estaSaldada ? "Pagada" : "Pendiente"}
          </span>
        </div>
      </summary>

      <div className="border-t border-ink/10 bg-ink/[0.015] p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-ink/45">
              Sub-transacciones / amortizaciones
            </p>
            {order.pagos.length === 0 ? (
              <p className="rounded-lg border border-ink/10 bg-white p-3 text-xs text-ink/45">
                Esta orden aun no registra abonos.
              </p>
            ) : (
              <ul className="space-y-2">
                {pagosActivos.map((pago) => (
                  <li
                    key={pago.idPago ?? `${pago.fecha}-${pago.monto}`}
                    className="grid gap-2 rounded-lg border border-ink/10 bg-white p-3 text-xs md:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <p className="font-semibold">
                        {pago.medioPago} · {formatSoles(pago.monto)}
                      </p>
                      <p className="text-ink/45">
                        {pago.fecha} · {pago.usuario}
                      </p>
                      {pago.numeroOperacion && (
                        <p className="font-mono text-[10px] text-ink/40">Op. {pago.numeroOperacion}</p>
                      )}
                      {pago.observaciones && <p className="mt-1 text-ink/60">{pago.observaciones}</p>}
                    </div>
                    {pago.comprobanteUrl && (
                      <a
                        href={pago.comprobanteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="self-start rounded border border-cyan-press/30 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-press"
                      >
                        Comprobante
                      </a>
                    )}
                  </li>
                ))}
                {pagosAnulados.map((pago) => (
                  <li
                    key={pago.idPago ?? `${pago.fecha}-${pago.monto}-anulado`}
                    className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive/80"
                  >
                    Pago anulado · {formatSoles(pago.monto)} · {pago.motivoAnulacion ?? "Sin motivo"}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-ink/45">
              {estaSaldada ? "Orden pagada" : "Registrar amortizacion"}
            </p>
            {estaSaldada ? (
              <div className="rounded-lg border border-emerald-press/25 bg-emerald-press/5 p-4 text-sm text-ink/70">
                La orden principal ya aparece como pagada porque su saldo pendiente es cero.
              </div>
            ) : (
              <>
                <PaymentForm
                  orderId={order.id}
                  medios={medios}
                  maxAmount={order.saldoPendiente}
                  submitLabel="Registrar abono"
                  onDone={onDone}
                  onError={onError}
                />
                <div className="rounded-lg border border-ink/10 bg-white p-3">
                  <p className="mb-2 text-xs text-ink/50">
                    Cerrar deuda completa por {formatSoles(order.saldoPendiente)}.
                  </p>
                  <PaymentForm
                    orderId={order.id}
                    medios={medios}
                    maxAmount={order.saldoPendiente}
                    fixedAmount={order.saldoPendiente}
                    submitLabel="Pagar saldo completo"
                    onDone={onDone}
                    onError={onError}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </details>
  );
}

function PaymentForm({
  orderId,
  medios,
  maxAmount,
  fixedAmount,
  submitLabel,
  onDone,
  onError,
}: {
  orderId: string;
  medios: MedioPago[];
  maxAmount: number;
  fixedAmount?: number;
  submitLabel: string;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  return (
    <form
      className="space-y-2 rounded-lg border border-ink/10 bg-white p-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const monto = fixedAmount ?? Number(form.get("monto"));
        const file = form.get("comprobante");
        if (!Number.isFinite(monto) || monto <= 0) {
          onError("El monto debe ser mayor a cero");
          return;
        }
        if (monto > maxAmount) {
          onError(`El abono no puede superar el saldo pendiente (${formatSoles(maxAmount)})`);
          return;
        }
        try {
          await pagosService.registrar(
            orderId,
            Number(form.get("medio")),
            monto,
            String(form.get("observaciones") ?? ""),
            String(form.get("numeroOperacion") ?? ""),
            file instanceof File && file.size > 0 ? file : null,
          );
          onDone();
          event.currentTarget.reset();
        } catch (error) {
          onError(error instanceof Error ? error.message : "No se pudo registrar el pago");
        }
      }}
    >
      <select name="medio" required className="w-full rounded border px-2 py-1.5 text-sm">
        <option value="">Medio de pago</option>
        {medios.map((medio) => (
          <option key={medio.idMedioPago} value={medio.idMedioPago}>
            {medio.nombre}
          </option>
        ))}
      </select>
      <input
        name="monto"
        required={fixedAmount == null}
        disabled={fixedAmount != null}
        type="number"
        min="0.01"
        step="0.01"
        max={maxAmount}
        value={fixedAmount ?? undefined}
        placeholder="Monto"
        className="w-full rounded border px-2 py-1.5 text-sm disabled:bg-ink/5"
        readOnly={fixedAmount != null}
      />
      <input name="numeroOperacion" placeholder="Operacion" className="w-full rounded border px-2 py-1.5 text-sm" />
      <input name="observaciones" placeholder="Observacion" className="w-full rounded border px-2 py-1.5 text-sm" />
      <input
        name="comprobante"
        type="file"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        className="w-full text-xs"
      />
      <button className="w-full rounded bg-ink px-3 py-2 text-xs font-semibold text-paper">
        {submitLabel}
      </button>
    </form>
  );
}

function Money({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="min-w-24">
      <p className="text-[10px] font-mono uppercase tracking-widest text-ink/40">{label}</p>
      <p className={`font-mono text-sm font-bold ${danger ? "text-destructive" : "text-ink/75"}`}>
        {formatSoles(value)}
      </p>
    </div>
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
