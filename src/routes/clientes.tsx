import { createFileRoute, redirect } from "@tanstack/react-router";
import { Edit3, FileText, Plus, Search, Trash2, UserRound, X } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { formatSoles } from "@/components/kanban/format";
import { authService } from "@/lib/api/auth.service";
import {
  quoteService,
  type Cliente,
  type ClienteDetalle,
  type CreateClienteRequest,
} from "@/lib/api/quote.service";

export const Route = createFileRoute("/clientes")({
  beforeLoad: () => {
    if (!authService.isAuthenticated()) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Clientes - LEO GRAPHYC ERP" },
      { name: "description", content: "Gestion comercial de clientes, cotizaciones y pedidos." },
    ],
  }),
  component: ClientesPage,
});

const emptyForm: CreateClienteRequest = {
  tipoDocumento: "DNI",
  numeroDocumento: "",
  razonSocial: "",
  nombreRepresentante: "",
  nombreCompleto: "",
  direccion: "",
  telefonoFijo: "",
  telefonoCelular: "",
  correo: "",
};

function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detalle, setDetalle] = useState<ClienteDetalle | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await quoteService.getClientes();
      setClientes(data);
      if (!selectedId && data.length > 0) setSelectedId(data[0].idCliente);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetalle(null);
      return;
    }
    setDetailLoading(true);
    quoteService
      .getClienteDetalle(selectedId)
      .then(setDetalle)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el detalle"))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return clientes.filter((cliente) => {
      const text = [
        displayName(cliente),
        cliente.numeroDocumento,
        cliente.correo,
        cliente.telefonoCelular,
      ].join(" ").toLowerCase();
      return !term || text.includes(term);
    });
  }, [clientes, query]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (cliente: Cliente) => {
    setEditing(cliente);
    setFormOpen(true);
  };

  const deleteCliente = async (cliente: Cliente) => {
    if (!window.confirm(`Eliminar cliente ${displayName(cliente)}?`)) return;
    try {
      await quoteService.deleteCliente(cliente.idCliente);
      if (selectedId === cliente.idCliente) {
        setSelectedId(null);
        setDetalle(null);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el cliente");
    }
  };

  return (
    <AppShell
      title="Clientes"
      action={
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded bg-ink px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-paper"
        >
          <Plus className="size-3.5" />
          Nuevo cliente
        </button>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="min-w-0 rounded-xl border border-ink/5 bg-white">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/5 px-5 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40">
                Cartera comercial
              </p>
              <h2 className="font-display text-lg font-bold">{clientes.length} clientes activos</h2>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/30" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar cliente..."
                className="h-9 w-full rounded border border-ink/10 bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-cyan-press/30"
              />
            </div>
          </header>

          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-lg bg-ink/5" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink/45">No se encontraron clientes.</p>
          ) : (
            <div className="divide-y divide-ink/5">
              {filtered.map((cliente) => (
                <button
                  key={cliente.idCliente}
                  onClick={() => setSelectedId(cliente.idCliente)}
                  className={`grid w-full gap-3 px-5 py-4 text-left transition-colors lg:grid-cols-[1.2fr_.8fr_.8fr_auto] ${
                    selectedId === cliente.idCliente ? "bg-cyan-press/5" : "hover:bg-ink/2"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{displayName(cliente)}</p>
                    <p className="text-xs text-ink/45">
                      {cliente.tipoDocumento} {cliente.numeroDocumento}
                    </p>
                  </div>
                  <p className="truncate text-sm text-ink/60">{cliente.correo || "Sin correo"}</p>
                  <p className="truncate text-sm text-ink/60">{cliente.telefonoCelular || "Sin celular"}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-press">
                    <UserRound className="size-3.5" />
                    Ver
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-xl border border-ink/5 bg-white p-5">
          {detailLoading ? (
            <div className="h-80 animate-pulse rounded-lg bg-ink/5" />
          ) : detalle ? (
            <ClienteDetail
              detalle={detalle}
              onEdit={() => openEdit(detalle.cliente)}
              onDelete={() => void deleteCliente(detalle.cliente)}
            />
          ) : (
            <div className="grid min-h-80 place-items-center text-center text-sm text-ink/45">
              Selecciona un cliente para ver su actividad.
            </div>
          )}
        </aside>
      </div>

      {formOpen && (
        <ClienteFormModal
          cliente={editing}
          onClose={() => setFormOpen(false)}
          onSaved={async (cliente) => {
            setFormOpen(false);
            setSelectedId(cliente.idCliente);
            await load();
          }}
        />
      )}
    </AppShell>
  );
}

function ClienteDetail({
  detalle,
  onEdit,
  onDelete,
}: {
  detalle: ClienteDetalle;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { cliente, cotizaciones, ordenes } = detalle;
  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40">
            {cliente.tipoDocumento} {cliente.numeroDocumento}
          </p>
          <h2 className="mt-1 truncate font-display text-xl font-bold">{displayName(cliente)}</h2>
          <p className="mt-1 text-sm text-ink/50">{cliente.correo || "Sin correo registrado"}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="grid size-8 place-items-center rounded border border-ink/10">
            <Edit3 className="size-4" />
          </button>
          <button onClick={onDelete} className="grid size-8 place-items-center rounded border border-destructive/20 text-destructive">
            <Trash2 className="size-4" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="Cotizaciones" value={String(cotizaciones.length)} />
        <MiniStat label="Ordenes" value={String(ordenes.length)} />
        <MiniStat label="Facturado" value={formatSoles(ordenes.reduce((sum, o) => sum + Number(o.montoTotal || 0), 0))} />
      </div>

      <Info label="Celular" value={cliente.telefonoCelular || "No registrado"} />
      <Info label="Direccion" value={cliente.direccion || "No registrada"} />
      {cliente.nombreRepresentante && <Info label="Representante" value={cliente.nombreRepresentante} />}

      <Activity title="Cotizaciones" empty="Sin cotizaciones">
        {cotizaciones.map((cotizacion) => (
          <ActivityRow
            key={cotizacion.idCotizacion}
            code={cotizacion.codigo}
            title={cotizacion.descripcion || "Cotizacion comercial"}
            meta={`${cotizacion.estado} · ${cotizacion.origen}`}
            amount={cotizacion.montoTotal}
          />
        ))}
      </Activity>

      <Activity title="Pedidos / OT" empty="Sin ordenes de trabajo">
        {ordenes.map((orden) => (
          <ActivityRow
            key={orden.idOrdenTrabajo}
            code={orden.codigo}
            title={orden.estado}
            meta={orden.fechaEstimadaEntrega ? `Entrega: ${formatDate(orden.fechaEstimadaEntrega)}` : "Sin fecha estimada"}
            amount={orden.montoTotal}
          />
        ))}
      </Activity>
    </div>
  );
}

function ClienteFormModal({
  cliente,
  onClose,
  onSaved,
}: {
  cliente: Cliente | null;
  onClose: () => void;
  onSaved: (cliente: Cliente) => Promise<void>;
}) {
  const [form, setForm] = useState<CreateClienteRequest>(cliente ? toForm(cliente) : emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (patch: Partial<CreateClienteRequest>) => setForm((current) => ({ ...current, ...patch }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const saved = cliente
        ? await quoteService.updateCliente(cliente.idCliente, form)
        : await quoteService.createCliente(form);
      await onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el cliente");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/30 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-ink/5 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40">
              {cliente ? "Editar cliente" : "Nuevo cliente"}
            </p>
            <h3 className="font-display text-lg font-bold">Datos comerciales</h3>
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded border border-ink/10">
            <X className="size-4" />
          </button>
        </header>

        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {error && <p className="sm:col-span-2 rounded bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
          <Field label="Tipo documento">
            <select
              value={form.tipoDocumento}
              onChange={(event) => update({ tipoDocumento: event.target.value as "DNI" | "RUC" })}
              className={inputClass}
            >
              <option value="DNI">DNI</option>
              <option value="RUC">RUC</option>
            </select>
          </Field>
          <Field label="Numero documento">
            <input value={form.numeroDocumento} onChange={(event) => update({ numeroDocumento: event.target.value })} className={inputClass} />
          </Field>
          {form.tipoDocumento === "DNI" ? (
            <Field label="Nombre completo">
              <input value={form.nombreCompleto ?? ""} onChange={(event) => update({ nombreCompleto: event.target.value })} className={inputClass} />
            </Field>
          ) : (
            <>
              <Field label="Razon social">
                <input value={form.razonSocial ?? ""} onChange={(event) => update({ razonSocial: event.target.value })} className={inputClass} />
              </Field>
              <Field label="Representante">
                <input value={form.nombreRepresentante ?? ""} onChange={(event) => update({ nombreRepresentante: event.target.value })} className={inputClass} />
              </Field>
            </>
          )}
          <Field label="Correo">
            <input type="email" value={form.correo ?? ""} onChange={(event) => update({ correo: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Celular">
            <input value={form.telefonoCelular ?? ""} onChange={(event) => update({ telefonoCelular: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Telefono fijo">
            <input value={form.telefonoFijo ?? ""} onChange={(event) => update({ telefonoFijo: event.target.value })} className={inputClass} />
          </Field>
          <Field label="Direccion">
            <input value={form.direccion ?? ""} onChange={(event) => update({ direccion: event.target.value })} className={inputClass} />
          </Field>
        </div>

        <footer className="flex justify-end gap-2 border-t border-ink/5 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded border border-ink/10 px-4 py-2 text-sm font-semibold">
            Cancelar
          </button>
          <button disabled={saving} className="rounded bg-ink px-4 py-2 text-sm font-semibold text-paper disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar cliente"}
          </button>
        </footer>
      </form>
    </div>
  );
}

const inputClass = "h-9 w-full rounded border border-ink/10 px-3 text-sm outline-none focus:ring-2 focus:ring-cyan-press/30";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">{label}</span>
      {children}
    </label>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/5 bg-ink/2 p-3">
      <p className="text-[10px] uppercase tracking-widest text-ink/40">{label}</p>
      <p className="mt-1 font-display text-lg font-bold">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40">{label}</p>
      <p className="mt-0.5 text-sm text-ink/70">{value}</p>
    </div>
  );
}

function Activity({ title, empty, children }: { title: string; empty: string; children: ReactNode[] }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-ink/50">{title}</h3>
      <div className="space-y-2">
        {children.length > 0 ? children : <p className="rounded border border-ink/5 bg-ink/2 p-3 text-xs text-ink/40">{empty}</p>}
      </div>
    </section>
  );
}

function ActivityRow({
  code,
  title,
  meta,
  amount,
}: {
  code: string;
  title: string;
  meta: string;
  amount: number;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-ink/5 px-3 py-2">
      <FileText className="mt-0.5 size-4 shrink-0 text-ink/35" />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] text-ink/40">{code}</p>
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="text-xs text-ink/45">{meta}</p>
      </div>
      <p className="font-mono text-xs font-semibold">{formatSoles(amount)}</p>
    </div>
  );
}

function displayName(cliente: Cliente) {
  return cliente.tipoDocumento === "RUC"
    ? cliente.razonSocial || cliente.nombreRepresentante || "Cliente sin razon social"
    : cliente.nombreCompleto || "Cliente sin nombre";
}

function toForm(cliente: Cliente): CreateClienteRequest {
  return {
    tipoDocumento: cliente.tipoDocumento,
    numeroDocumento: cliente.numeroDocumento,
    razonSocial: cliente.razonSocial ?? "",
    nombreRepresentante: cliente.nombreRepresentante ?? "",
    nombreCompleto: cliente.nombreCompleto ?? "",
    direccion: cliente.direccion ?? "",
    telefonoFijo: cliente.telefonoFijo ?? "",
    telefonoCelular: cliente.telefonoCelular ?? "",
    correo: cliente.correo ?? "",
  };
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-PE");
}
