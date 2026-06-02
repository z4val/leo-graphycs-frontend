import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  PackagePlus,
  Plus,
  RefreshCcw,
  Search,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { accentBar, accentBg15 } from "@/components/accent-classes";
import { authService } from "@/lib/api/auth.service";
import {
  inventoryService,
  type CreateInsumoRequest,
  type CreateOrdenCompraRequest,
  type CreateProveedorRequest,
  type EstadoOrdenCompra,
  type Insumo,
  type MovimientoInventario,
  type OrdenCompra,
  type Proveedor,
  type RegistrarSalidaRequest,
  type TipoInsumo,
  type UnidadMedidaInsumo,
  type Lote,
} from "@/lib/api/inventory.service";

export const Route = createFileRoute("/inventario")({
  beforeLoad: () => {
    if (!authService.isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Inventario - PREX ERP" },
      { name: "description", content: "Control de insumos, compras, lotes y kardex FIFO." },
    ],
  }),
  component: InventarioPage,
});

type Tab = "insumos" | "proveedores" | "compras" | "kardex";

const tipoLabels: Record<TipoInsumo, string> = {
  PAPEL: "Papel",
  TINTA: "Tinta",
  SOLUCION_FUENTE: "Solución de fuente",
};

const unidadLabels: Record<UnidadMedidaInsumo, string> = {
  MILLAR: "millares",
  KILO: "kg",
  LITRO: "L",
};

const tipoAccent: Record<TipoInsumo, string> = {
  PAPEL: "cyan-press",
  TINTA: "magenta-press",
  SOLUCION_FUENTE: "emerald-press",
};

const estadoClasses: Record<EstadoOrdenCompra, string> = {
  PENDIENTE: "bg-yellow-press/20 text-ink/70",
  RECIBIDA: "bg-emerald-press/20 text-ink/70",
  ANULADA: "bg-destructive/15 text-destructive",
};

const emptyInsumo: CreateInsumoRequest = {
  tipoInsumo: "PAPEL",
  nombre: "",
  unidadMedida: "MILLAR",
  gramaje: undefined,
  medida: "",
  tipoPapel: "",
  color: "",
  precioVentaMillar: undefined,
  stockMinimo: 0,
};

const emptyProveedor: CreateProveedorRequest = {
  ruc: "",
  razonSocial: "",
  nombreRepresentante: "",
  direccion: "",
  telefonoFijo: "",
  telefonoCelular: "",
  correo: "",
};

export function InventarioPage() {
  const [tab, setTab] = useState<Tab>("insumos");
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<"TODOS" | TipoInsumo>("TODOS");
  const [showInsumoForm, setShowInsumoForm] = useState(false);
  const [showProveedorForm, setShowProveedorForm] = useState(false);
  const [showCompraForm, setShowCompraForm] = useState(false);
  const [showSalidaForm, setShowSalidaForm] = useState(false);
  const [insumoForm, setInsumoForm] = useState<CreateInsumoRequest>(emptyInsumo);
  const [proveedorForm, setProveedorForm] = useState<CreateProveedorRequest>(emptyProveedor);
  const [salidaForm, setSalidaForm] = useState<RegistrarSalidaRequest>({
    idInsumo: 0,
    cantidad: 0,
    idOrdenTrabajo: undefined,
    observaciones: "",
  });
  const [compraForm, setCompraForm] = useState<CreateOrdenCompraRequest>({
    codigo: "",
    idProveedor: 0,
    observaciones: "",
    detalles: [{ idInsumo: 0, cantidad: 1, precioUnitario: 0 }],
  });

  useEffect(() => {
    void loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    setError("");
    try {
      const [insumoData, proveedorData, ordenData, movimientoData, loteData] = await Promise.all([
        inventoryService.getInsumos(),
        inventoryService.getProveedores(),
        inventoryService.getOrdenesCompra(),
        inventoryService.getMovimientos(),
        inventoryService.getLotes(),
      ]);
      setInsumos(insumoData);
      setProveedores(proveedorData);
      setOrdenes(ordenData);
      setMovimientos(movimientoData);
      setLotes(loteData);
      setSalidaForm((current) => ({
        ...current,
        idInsumo: current.idInsumo || insumoData[0]?.idInsumo || 0,
      }));
      setCompraForm((current) => ({
        ...current,
        idProveedor: current.idProveedor || proveedorData[0]?.idProveedor || 0,
        detalles: current.detalles.map((detalle) => ({
          ...detalle,
          idInsumo: detalle.idInsumo || insumoData[0]?.idInsumo || 0,
        })),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar inventario");
    } finally {
      setLoading(false);
    }
  };

  const filteredInsumos = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return insumos.filter((insumo) => {
      const matchesTipo = tipoFiltro === "TODOS" || insumo.tipoInsumo === tipoFiltro;
      const matchesQuery =
        !needle ||
        insumo.nombre.toLowerCase().includes(needle) ||
        insumo.tipoInsumo.toLowerCase().includes(needle) ||
        String(insumo.idInsumo).includes(needle);
      return matchesTipo && matchesQuery;
    });
  }, [insumos, query, tipoFiltro]);

  const lowStock = insumos.filter(
    (insumo) => Number(insumo.stockActual) < Number(insumo.stockMinimo),
  );
  const stockValue = lotes.reduce(
    (sum, lote) => sum + Number(lote.cantidadDisponible || 0) * Number(lote.costoUnitario || 0),
    0,
  );
  const pendingOrders = ordenes.filter((orden) => orden.estado === "PENDIENTE").length;

  const createInsumo = async (event: React.FormEvent) => {
    event.preventDefault();
    await save(async () => {
      await inventoryService.createInsumo(cleanInsumo(insumoForm));
      setInsumoForm(emptyInsumo);
      setShowInsumoForm(false);
    });
  };

  const createProveedor = async (event: React.FormEvent) => {
    event.preventDefault();
    await save(async () => {
      await inventoryService.createProveedor(proveedorForm);
      setProveedorForm(emptyProveedor);
      setShowProveedorForm(false);
    });
  };

  const createCompra = async (event: React.FormEvent) => {
    event.preventDefault();
    await save(async () => {
      await inventoryService.createOrdenCompra({
        ...compraForm,
        detalles: compraForm.detalles.filter((detalle) => detalle.idInsumo && detalle.cantidad > 0),
      });
      setShowCompraForm(false);
    });
  };

  const registrarSalida = async (event: React.FormEvent) => {
    event.preventDefault();
    await save(async () => {
      await inventoryService.registrarSalida({
        ...salidaForm,
        idOrdenTrabajo: salidaForm.idOrdenTrabajo || null,
      });
      setShowSalidaForm(false);
    });
  };

  const recibirCompra = async (id: number) => {
    await save(async () => {
      await inventoryService.recibirOrdenCompra(id);
    });
  };

  const save = async (action: () => Promise<void>) => {
    setSaving(true);
    setError("");
    try {
      await action();
      await loadInventory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title="Inventario"
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadInventory()}
            className="size-8 grid place-items-center border border-ink/10 rounded hover:bg-ink/5 transition-colors"
            title="Actualizar"
          >
            <RefreshCcw className="size-4" />
          </button>
          <button
            onClick={() => setShowInsumoForm(true)}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-ink text-paper rounded text-[11px] font-semibold uppercase tracking-widest hover:bg-ink/90 transition-all"
          >
            <Plus className="size-3.5" />
            Insumo
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-4 gap-4 mb-6">
        <SummaryCard
          label="Insumos activos"
          value={insumos.filter((i) => i.activo).length.toString()}
          accent="cyan-press"
        />
        <SummaryCard
          label="Alertas de stock"
          value={lowStock.length.toString().padStart(2, "0")}
          accent="magenta-press"
        />
        <SummaryCard
          label="Compras pendientes"
          value={pendingOrders.toString().padStart(2, "0")}
          accent="yellow-press"
        />
        <SummaryCard label="Valor FIFO" value={formatCurrency(stockValue)} accent="emerald-press" />
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4" />
          {error}
        </div>
      )}

      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <TabButton
            active={tab === "insumos"}
            onClick={() => setTab("insumos")}
            icon={<Boxes className="size-4" />}
            label="Insumos"
          />
          <TabButton
            active={tab === "proveedores"}
            onClick={() => setTab("proveedores")}
            icon={<Truck className="size-4" />}
            label="Proveedores"
          />
          <TabButton
            active={tab === "compras"}
            onClick={() => setTab("compras")}
            icon={<PackagePlus className="size-4" />}
            label="Compras"
          />
          <TabButton
            active={tab === "kardex"}
            onClick={() => setTab("kardex")}
            icon={<ClipboardList className="size-4" />}
            label="Kardex"
          />
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/35" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar insumo..."
            className="w-full rounded-md border border-ink/10 bg-white py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-press/40"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-ink/5 bg-white p-8 text-sm text-ink/50">
          Cargando inventario...
        </div>
      ) : (
        <>
          {tab === "insumos" && (
            <InsumosView
              insumos={filteredInsumos}
              tipoFiltro={tipoFiltro}
              setTipoFiltro={setTipoFiltro}
              onSalida={(idInsumo) => {
                setSalidaForm({
                  idInsumo,
                  cantidad: 0,
                  idOrdenTrabajo: undefined,
                  observaciones: "",
                });
                setShowSalidaForm(true);
              }}
            />
          )}
          {tab === "proveedores" && (
            <ProveedoresView
              proveedores={proveedores}
              onCreate={() => setShowProveedorForm(true)}
            />
          )}
          {tab === "compras" && (
            <ComprasView
              ordenes={ordenes}
              onCreate={() => setShowCompraForm(true)}
              onRecibir={(id) => void recibirCompra(id)}
              saving={saving}
            />
          )}
          {tab === "kardex" && <KardexView movimientos={movimientos} lotes={lotes} />}
        </>
      )}

      {showInsumoForm && (
        <Modal title="Nuevo insumo" onClose={() => setShowInsumoForm(false)}>
          <form onSubmit={createInsumo} className="space-y-3">
            <Field label="Nombre">
              <input
                required
                value={insumoForm.nombre}
                onChange={(e) => setInsumoForm({ ...insumoForm, nombre: e.target.value })}
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo">
                <select
                  value={insumoForm.tipoInsumo}
                  onChange={(e) =>
                    setInsumoForm({ ...insumoForm, tipoInsumo: e.target.value as TipoInsumo })
                  }
                  className={inputClass}
                >
                  <option value="PAPEL">Papel</option>
                  <option value="TINTA">Tinta</option>
                  <option value="SOLUCION_FUENTE">Solución de fuente</option>
                </select>
              </Field>
              <Field label="Unidad">
                <select
                  value={insumoForm.unidadMedida}
                  onChange={(e) =>
                    setInsumoForm({
                      ...insumoForm,
                      unidadMedida: e.target.value as UnidadMedidaInsumo,
                    })
                  }
                  className={inputClass}
                >
                  <option value="MILLAR">Millar</option>
                  <option value="KILO">Kilo</option>
                  <option value="LITRO">Litro</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Gramaje">
                <input
                  type="number"
                  value={insumoForm.gramaje ?? ""}
                  onChange={(e) =>
                    setInsumoForm({ ...insumoForm, gramaje: optionalNumber(e.target.value) })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Medida">
                <input
                  value={insumoForm.medida ?? ""}
                  onChange={(e) => setInsumoForm({ ...insumoForm, medida: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Color">
                <input
                  value={insumoForm.color ?? ""}
                  onChange={(e) => setInsumoForm({ ...insumoForm, color: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Tipo de papel">
              <input
                value={insumoForm.tipoPapel ?? ""}
                onChange={(e) => setInsumoForm({ ...insumoForm, tipoPapel: e.target.value })}
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Precio venta por millar">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={insumoForm.precioVentaMillar ?? ""}
                  onChange={(e) =>
                    setInsumoForm({
                      ...insumoForm,
                      precioVentaMillar: optionalNumber(e.target.value),
                    })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Stock mínimo">
                <input
                  required
                  type="number"
                  min="0"
                  step="0.001"
                  value={insumoForm.stockMinimo}
                  onChange={(e) =>
                    setInsumoForm({ ...insumoForm, stockMinimo: Number(e.target.value) })
                  }
                  className={inputClass}
                />
              </Field>
            </div>
            <FormActions saving={saving} onCancel={() => setShowInsumoForm(false)} />
          </form>
        </Modal>
      )}

      {showProveedorForm && (
        <Modal title="Nuevo proveedor" onClose={() => setShowProveedorForm(false)}>
          <form onSubmit={createProveedor} className="space-y-3">
            <Field label="RUC">
              <input
                required
                maxLength={11}
                value={proveedorForm.ruc}
                onChange={(e) => setProveedorForm({ ...proveedorForm, ruc: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Razón social">
              <input
                required
                value={proveedorForm.razonSocial}
                onChange={(e) =>
                  setProveedorForm({ ...proveedorForm, razonSocial: e.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Representante">
              <input
                value={proveedorForm.nombreRepresentante}
                onChange={(e) =>
                  setProveedorForm({ ...proveedorForm, nombreRepresentante: e.target.value })
                }
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Celular">
                <input
                  value={proveedorForm.telefonoCelular}
                  onChange={(e) =>
                    setProveedorForm({ ...proveedorForm, telefonoCelular: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Correo">
                <input
                  type="email"
                  value={proveedorForm.correo}
                  onChange={(e) => setProveedorForm({ ...proveedorForm, correo: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Dirección">
              <input
                value={proveedorForm.direccion}
                onChange={(e) => setProveedorForm({ ...proveedorForm, direccion: e.target.value })}
                className={inputClass}
              />
            </Field>
            <FormActions saving={saving} onCancel={() => setShowProveedorForm(false)} />
          </form>
        </Modal>
      )}

      {showSalidaForm && (
        <Modal title="Registrar salida FIFO" onClose={() => setShowSalidaForm(false)}>
          <form onSubmit={registrarSalida} className="space-y-3">
            <Field label="Insumo">
              <select
                value={salidaForm.idInsumo}
                onChange={(e) => setSalidaForm({ ...salidaForm, idInsumo: Number(e.target.value) })}
                className={inputClass}
              >
                {insumos.map((insumo) => (
                  <option key={insumo.idInsumo} value={insumo.idInsumo}>
                    {insumo.nombre}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cantidad">
                <input
                  required
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={salidaForm.cantidad || ""}
                  onChange={(e) =>
                    setSalidaForm({ ...salidaForm, cantidad: Number(e.target.value) })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Orden de trabajo">
                <input
                  type="number"
                  value={salidaForm.idOrdenTrabajo ?? ""}
                  onChange={(e) =>
                    setSalidaForm({ ...salidaForm, idOrdenTrabajo: optionalNumber(e.target.value) })
                  }
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Observaciones">
              <textarea
                value={salidaForm.observaciones}
                onChange={(e) => setSalidaForm({ ...salidaForm, observaciones: e.target.value })}
                className={`${inputClass} min-h-20`}
              />
            </Field>
            <FormActions
              saving={saving}
              onCancel={() => setShowSalidaForm(false)}
              submitLabel="Registrar salida"
            />
          </form>
        </Modal>
      )}

      {showCompraForm && (
        <Modal title="Nueva orden de compra" onClose={() => setShowCompraForm(false)}>
          <form onSubmit={createCompra} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Código">
                <input
                  value={compraForm.codigo}
                  onChange={(e) => setCompraForm({ ...compraForm, codigo: e.target.value })}
                  placeholder="OC-2026-001"
                  className={inputClass}
                />
              </Field>
              <Field label="Proveedor">
                <select
                  value={compraForm.idProveedor}
                  onChange={(e) =>
                    setCompraForm({ ...compraForm, idProveedor: Number(e.target.value) })
                  }
                  className={inputClass}
                >
                  {proveedores.map((proveedor) => (
                    <option key={proveedor.idProveedor} value={proveedor.idProveedor}>
                      {proveedor.razonSocial}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {compraForm.detalles.map((detalle, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 rounded-lg border border-ink/5 bg-ink/[0.02] p-2"
              >
                <select
                  value={detalle.idInsumo}
                  onChange={(e) =>
                    updateDetalle(
                      index,
                      { idInsumo: Number(e.target.value) },
                      compraForm,
                      setCompraForm,
                    )
                  }
                  className={`${inputClass} col-span-6`}
                >
                  {insumos.map((insumo) => (
                    <option key={insumo.idInsumo} value={insumo.idInsumo}>
                      {insumo.nombre}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={detalle.cantidad}
                  onChange={(e) =>
                    updateDetalle(
                      index,
                      { cantidad: Number(e.target.value) },
                      compraForm,
                      setCompraForm,
                    )
                  }
                  className={`${inputClass} col-span-3`}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={detalle.precioUnitario}
                  onChange={(e) =>
                    updateDetalle(
                      index,
                      { precioUnitario: Number(e.target.value) },
                      compraForm,
                      setCompraForm,
                    )
                  }
                  className={`${inputClass} col-span-3`}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setCompraForm({
                  ...compraForm,
                  detalles: [
                    ...compraForm.detalles,
                    { idInsumo: insumos[0]?.idInsumo || 0, cantidad: 1, precioUnitario: 0 },
                  ],
                })
              }
              className="text-[11px] font-bold uppercase tracking-widest text-cyan-press"
            >
              Añadir ítem
            </button>
            <Field label="Observaciones">
              <textarea
                value={compraForm.observaciones}
                onChange={(e) => setCompraForm({ ...compraForm, observaciones: e.target.value })}
                className={`${inputClass} min-h-20`}
              />
            </Field>
            <FormActions
              saving={saving}
              onCancel={() => setShowCompraForm(false)}
              submitLabel="Crear compra"
            />
          </form>
        </Modal>
      )}
    </AppShell>
  );
}

function InsumosView({
  insumos,
  tipoFiltro,
  setTipoFiltro,
  onSalida,
}: {
  insumos: Insumo[];
  tipoFiltro: "TODOS" | TipoInsumo;
  setTipoFiltro: (tipo: "TODOS" | TipoInsumo) => void;
  onSalida: (idInsumo: number) => void;
}) {
  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["TODOS", "PAPEL", "TINTA", "SOLUCION_FUENTE"] as const).map((tipo) => (
          <button
            key={tipo}
            onClick={() => setTipoFiltro(tipo)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tipoFiltro === tipo
                ? "bg-ink text-paper"
                : "border border-ink/5 bg-white text-ink/60 hover:text-ink"
            }`}
          >
            {tipo === "TODOS" ? "Todos" : tipoLabels[tipo]}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-ink/5 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/5 text-[10px] uppercase tracking-widest text-ink/40">
              <th className="px-4 py-3 text-left font-medium">Insumo</th>
              <th className="px-4 py-3 text-left font-medium">Tipo</th>
              <th className="px-4 py-3 text-right font-medium">Stock</th>
              <th className="px-4 py-3 text-right font-medium">Mínimo</th>
              <th className="px-4 py-3 text-right font-medium">Precio venta</th>
              <th className="px-4 py-3 text-left font-medium">Estado</th>
              <th className="px-4 py-3 text-right font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {insumos.map((insumo) => {
              const low = Number(insumo.stockActual) < Number(insumo.stockMinimo);
              return (
                <tr
                  key={insumo.idInsumo}
                  className="border-b border-ink/5 last:border-0 hover:bg-ink/[0.02]"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold">{insumo.nombre}</p>
                    <p className="text-xs text-ink/45">{describeInsumo(insumo)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${accentBg15[tipoAccent[insumo.tipoInsumo]]}`}
                    >
                      {tipoLabels[insumo.tipoInsumo]}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono ${low ? "font-bold text-destructive" : ""}`}
                  >
                    {formatNumber(insumo.stockActual)}{" "}
                    <span className="text-xs text-ink/40">{unidadLabels[insumo.unidadMedida]}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-ink/45">
                    {formatNumber(insumo.stockMinimo)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatCurrency(insumo.precioVentaMillar || 0)}
                  </td>
                  <td className="px-4 py-3">
                    {low ? <StatusDot label="Reposición" danger /> : <StatusDot label="Óptimo" />}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onSalida(insumo.idInsumo)}
                      className="rounded border border-ink/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-ink hover:text-paper"
                    >
                      Salida
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProveedoresView({
  proveedores,
  onCreate,
}: {
  proveedores: Proveedor[];
  onCreate: () => void;
}) {
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-8 grid grid-cols-2 gap-4">
        {proveedores.map((proveedor) => (
          <div
            key={proveedor.idProveedor}
            className="relative rounded-xl border border-ink/5 bg-white p-5"
          >
            <div className={`absolute left-0 top-0 h-0.5 w-16 ${accentBar["cyan-press"]}`} />
            <p className="font-display text-base font-bold">{proveedor.razonSocial}</p>
            <p className="font-mono text-xs text-ink/45">RUC {proveedor.ruc}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <Info
                label="Representante"
                value={proveedor.nombreRepresentante || "Sin registrar"}
              />
              <Info
                label="Celular"
                value={proveedor.telefonoCelular || proveedor.telefonoFijo || "Sin registrar"}
              />
              <Info label="Correo" value={proveedor.correo || "Sin registrar"} />
            </dl>
          </div>
        ))}
      </div>
      <aside className="col-span-4 rounded-2xl bg-ink p-6 text-paper">
        <p className="text-[10px] font-mono uppercase tracking-widest text-paper/45">
          Abastecimiento
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold">
          Proveedores de papel, tinta y solución
        </h2>
        <p className="mt-3 text-sm text-paper/60">
          Registra a quién se compra cada insumo antes de emitir órdenes de compra y generar lotes
          FIFO.
        </p>
        <button
          onClick={onCreate}
          className="mt-6 inline-flex items-center gap-2 rounded bg-paper px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-ink"
        >
          <Plus className="size-4" />
          Proveedor
        </button>
      </aside>
    </div>
  );
}

function ComprasView({
  ordenes,
  onCreate,
  onRecibir,
  saving,
}: {
  ordenes: OrdenCompra[];
  onCreate: () => void;
  onRecibir: (id: number) => void;
  saving: boolean;
}) {
  return (
    <div className="rounded-xl border border-ink/5 bg-white">
      <div className="flex items-center justify-between border-b border-ink/5 px-5 py-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest">
          Órdenes de compra
        </h2>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded bg-ink px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-paper"
        >
          <Plus className="size-3.5" />
          Nueva
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink/5 text-[10px] uppercase tracking-widest text-ink/40">
            <th className="px-4 py-3 text-left font-medium">Código</th>
            <th className="px-4 py-3 text-left font-medium">Proveedor</th>
            <th className="px-4 py-3 text-left font-medium">Emisión</th>
            <th className="px-4 py-3 text-right font-medium">Total</th>
            <th className="px-4 py-3 text-left font-medium">Estado</th>
            <th className="px-4 py-3 text-right font-medium">Acción</th>
          </tr>
        </thead>
        <tbody>
          {ordenes.map((orden) => (
            <tr key={orden.idOrdenCompra} className="border-b border-ink/5 last:border-0">
              <td className="px-4 py-3 font-mono text-xs">{orden.codigo}</td>
              <td className="px-4 py-3 font-semibold">
                {orden.proveedor?.razonSocial || "Sin proveedor"}
              </td>
              <td className="px-4 py-3 text-ink/55">{formatDate(orden.fechaEmision)}</td>
              <td className="px-4 py-3 text-right font-mono">{formatCurrency(orden.total)}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-tighter ${estadoClasses[orden.estado]}`}
                >
                  {orden.estado}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {orden.estado === "PENDIENTE" && (
                  <button
                    disabled={saving}
                    onClick={() => onRecibir(orden.idOrdenCompra)}
                    className="rounded border border-emerald-press px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-press disabled:opacity-50"
                  >
                    Recibir
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KardexView({
  movimientos,
  lotes,
}: {
  movimientos: MovimientoInventario[];
  lotes: Lote[];
}) {
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-8 overflow-hidden rounded-xl border border-ink/5 bg-white">
        <div className="border-b border-ink/5 px-5 py-3">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest">
            Kardex valorizado
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/5 text-[10px] uppercase tracking-widest text-ink/40">
              <th className="px-4 py-3 text-left font-medium">Fecha</th>
              <th className="px-4 py-3 text-left font-medium">Insumo</th>
              <th className="px-4 py-3 text-left font-medium">Tipo</th>
              <th className="px-4 py-3 text-right font-medium">Cantidad</th>
              <th className="px-4 py-3 text-right font-medium">Costo</th>
              <th className="px-4 py-3 text-right font-medium">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.slice(0, 12).map((movimiento) => (
              <tr key={movimiento.idMovimiento} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 text-xs text-ink/55">{formatDate(movimiento.fecha)}</td>
                <td className="px-4 py-3 font-semibold">{movimiento.insumo?.nombre || "Insumo"}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      movimiento.tipoMovimiento === "ENTRADA"
                        ? "text-emerald-press"
                        : "text-destructive"
                    }
                  >
                    {movimiento.tipoMovimiento}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatNumber(movimiento.cantidad)}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatCurrency(movimiento.costoTotal)}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatCurrency(movimiento.saldoValor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <aside className="col-span-4 rounded-xl border border-ink/5 bg-white p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest">
          Lotes FIFO disponibles
        </h2>
        <div className="mt-4 space-y-3">
          {lotes
            .filter((lote) => Number(lote.cantidadDisponible) > 0)
            .slice(0, 8)
            .map((lote) => (
              <div key={lote.idLote} className="rounded-lg border border-ink/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-semibold">
                    {lote.insumo?.nombre || "Insumo"}
                  </p>
                  <span className="font-mono text-xs">{formatNumber(lote.cantidadDisponible)}</span>
                </div>
                <p className="mt-1 text-xs text-ink/45">
                  {lote.numeroLote || `Lote ${lote.idLote}`} · {formatCurrency(lote.costoUnitario)}{" "}
                  c/u
                </p>
              </div>
            ))}
        </div>
      </aside>
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-ink/5 bg-white p-4">
      <div className={`absolute left-0 top-0 h-0.5 w-12 ${accentBar[accent]}`} />
      <p className="text-[10px] font-mono uppercase tracking-widest text-ink/40">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
        active ? "bg-ink text-paper" : "border border-ink/5 bg-white text-ink/60 hover:text-ink"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-ink/45 hover:bg-ink/5"
          >
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-mono uppercase tracking-widest text-ink/45">
        {label}
      </span>
      {children}
    </label>
  );
}

function FormActions({
  saving,
  onCancel,
  submitLabel = "Guardar",
}: {
  saving: boolean;
  onCancel: () => void;
  submitLabel?: string;
}) {
  return (
    <div className="flex gap-2 pt-2">
      <button
        type="submit"
        disabled={saving}
        className="flex-1 rounded bg-ink px-4 py-2 text-sm font-semibold text-paper disabled:opacity-50"
      >
        {saving ? "Guardando..." : submitLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 rounded border border-ink/10 px-4 py-2 text-sm font-semibold"
      >
        Cancelar
      </button>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-mono uppercase tracking-widest text-ink/35">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function StatusDot({ label, danger = false }: { label: string; danger?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${danger ? "text-destructive" : "text-emerald-press"}`}
    >
      <span className={`size-1.5 rounded-full ${danger ? "bg-destructive" : "bg-emerald-press"}`} />
      {label}
    </span>
  );
}

function updateDetalle(
  index: number,
  patch: Partial<CreateOrdenCompraRequest["detalles"][number]>,
  compraForm: CreateOrdenCompraRequest,
  setCompraForm: (form: CreateOrdenCompraRequest) => void,
) {
  setCompraForm({
    ...compraForm,
    detalles: compraForm.detalles.map((detalle, currentIndex) =>
      currentIndex === index ? { ...detalle, ...patch } : detalle,
    ),
  });
}

function cleanInsumo(form: CreateInsumoRequest): CreateInsumoRequest {
  return {
    ...form,
    gramaje: form.tipoInsumo === "PAPEL" ? form.gramaje || null : null,
    medida: form.tipoInsumo === "PAPEL" ? form.medida || null : null,
    tipoPapel: form.tipoInsumo === "PAPEL" ? form.tipoPapel || null : null,
    color: form.tipoInsumo === "TINTA" ? form.color || null : null,
    precioVentaMillar: form.precioVentaMillar || null,
  };
}

function describeInsumo(insumo: Insumo) {
  const parts = [
    insumo.gramaje ? `${insumo.gramaje} g` : null,
    insumo.medida,
    insumo.tipoPapel,
    insumo.color,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : unidadLabels[insumo.unidadMedida];
}

function optionalNumber(value: string) {
  return value === "" ? undefined : Number(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-PE", { maximumFractionDigits: 3 }).format(Number(value || 0));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
    Number(value || 0),
  );
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

const inputClass =
  "w-full rounded-md border border-ink/10 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-press/40";
