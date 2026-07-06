import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  AlertTriangle,
  Boxes,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Download,
  Paperclip,
  PackagePlus,
  Plus,
  RefreshCcw,
  Search,
  Truck,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { accentBar, accentBg15 } from "@/components/accent-classes";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { authService } from "@/lib/api/auth.service";
import {
  inventoryService,
  type AdjuntoOrdenCompra,
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
      { title: "Inventario - LEO GRAPHYC ERP" },
      { name: "description", content: "Control de insumos, compras, lotes y kardex FIFO." },
    ],
  }),
  component: InventarioPage,
});

type Tab = "insumos" | "proveedores" | "compras" | "kardex";

type InsumoFormErrors = Partial<
  Record<
    | "nombre"
    | "tipoInsumo"
    | "unidadMedida"
    | "gramaje"
    | "medida"
    | "tipoPapel"
    | "color"
    | "precioVentaMillar"
    | "stockMinimo",
    string
  >
>;

type ProveedorFormErrors = Partial<
  Record<
    | "ruc"
    | "razonSocial"
    | "nombreRepresentante"
    | "direccion"
    | "telefonoFijo"
    | "telefonoCelular"
    | "correo",
    string
  >
>;

type SalidaFormErrors = Partial<
  Record<"idInsumo" | "cantidad" | "idOrdenTrabajo" | "observaciones", string>
>;

type CompraFormErrors = Partial<
  Record<"codigo" | "idProveedor" | "detalles" | "observaciones", string>
>;

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

const unidadDisplayLabels: Record<UnidadMedidaInsumo, string> = {
  MILLAR: "Millar",
  KILO: "Kilo",
  LITRO: "Litro",
};

const defaultUnidadByTipo: Record<TipoInsumo, UnidadMedidaInsumo> = {
  PAPEL: "MILLAR",
  TINTA: "KILO",
  SOLUCION_FUENTE: "LITRO",
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
  const [compraARecibir, setCompraARecibir] = useState<OrdenCompra | null>(null);
  const [recepcionAdjunto, setRecepcionAdjunto] = useState<File | null>(null);
  const [proveedorSearchOpen, setProveedorSearchOpen] = useState(false);
  const [insumoCompraSearchIndex, setInsumoCompraSearchIndex] = useState<number | null>(null);
  const [insumoForm, setInsumoForm] = useState<CreateInsumoRequest>(emptyInsumo);
  const [insumoErrors, setInsumoErrors] = useState<InsumoFormErrors>({});
  const [proveedorForm, setProveedorForm] = useState<CreateProveedorRequest>(emptyProveedor);
  const [proveedorErrors, setProveedorErrors] = useState<ProveedorFormErrors>({});
  const [salidaForm, setSalidaForm] = useState<RegistrarSalidaRequest>({
    idInsumo: 0,
    cantidad: 0,
    idOrdenTrabajo: undefined,
    observaciones: "",
  });
  const [salidaErrors, setSalidaErrors] = useState<SalidaFormErrors>({});
  const [compraForm, setCompraForm] = useState<CreateOrdenCompraRequest>({
    codigo: "",
    idProveedor: 0,
    observaciones: "",
    detalles: [{ idInsumo: 0, cantidad: 1, precioUnitario: 0 }],
  });
  const [compraErrors, setCompraErrors] = useState<CompraFormErrors>({});

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
          precioUnitario:
            detalle.precioUnitario ||
            getCostoUnitarioSugeridoFromData(
              detalle.idInsumo || insumoData[0]?.idInsumo || 0,
              insumoData,
              loteData,
            ),
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

  const insumosConMovimiento = useMemo(
    () => new Set(movimientos.map((movimiento) => movimiento.insumo?.idInsumo).filter(Boolean)),
    [movimientos],
  );
  const lowStock = insumos.filter(
    (insumo) =>
      insumosConMovimiento.has(insumo.idInsumo) &&
      Number(insumo.stockMinimo) > 0 &&
      Number(insumo.stockActual) <= Number(insumo.stockMinimo),
  );
  const stockValue = lotes.reduce(
    (sum, lote) => sum + Number(lote.cantidadDisponible || 0) * Number(lote.costoUnitario || 0),
    0,
  );
  const pendingOrders = ordenes.filter((orden) => orden.estado === "PENDIENTE").length;
  const selectedProveedor = proveedores.find(
    (proveedor) => proveedor.idProveedor === compraForm.idProveedor,
  );
  const getCostoUnitarioSugerido = (idInsumo: number) => {
    return getCostoUnitarioSugeridoFromData(idInsumo, insumos, lotes);
  };

  const createInsumo = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleaned = cleanInsumo(insumoForm);
    const validationErrors = validateInsumoForm(cleaned, insumos);
    setInsumoErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setError("Corrige los campos marcados antes de guardar el insumo.");
      return;
    }

    await save(async () => {
      await inventoryService.createInsumo(cleaned);
      setInsumoForm(emptyInsumo);
      setInsumoErrors({});
      setShowInsumoForm(false);
    });
  };

  const createProveedor = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleaned = cleanProveedor(proveedorForm);
    const validationErrors = validateProveedorForm(cleaned, proveedores);
    setProveedorErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setError("Corrige los campos marcados antes de guardar el proveedor.");
      return;
    }

    await save(async () => {
      await inventoryService.createProveedor(cleaned);
      setProveedorForm(emptyProveedor);
      setProveedorErrors({});
      setShowProveedorForm(false);
    });
  };

  const createCompra = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleaned = cleanCompra(compraForm);
    const validationErrors = validateCompraForm(cleaned, insumos, proveedores);
    setCompraErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setError("Corrige los campos marcados antes de crear la orden de compra.");
      return;
    }

    await save(async () => {
      await inventoryService.createOrdenCompra(cleaned);
      setCompraErrors({});
      setShowCompraForm(false);
    });
  };

  const registrarSalida = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleaned = cleanSalida(salidaForm);
    const validationErrors = validateSalidaForm(cleaned, insumos);
    setSalidaErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setError("Corrige los campos marcados antes de registrar la salida.");
      return;
    }

    await save(async () => {
      await inventoryService.registrarSalida(cleaned);
      setSalidaErrors({});
      setShowSalidaForm(false);
    });
  };

  const recibirCompra = async (id: number, adjunto?: File | null) => {
    await save(async () => {
      await inventoryService.recibirOrdenCompra(id);
      if (adjunto) {
        await inventoryService.uploadOrdenCompraAdjunto(id, adjunto);
      }
      setCompraARecibir(null);
      setRecepcionAdjunto(null);
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

  const isPapelForm = insumoForm.tipoInsumo === "PAPEL";
  const isTintaForm = insumoForm.tipoInsumo === "TINTA";

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

      <div className="mb-5 rounded-xl border border-ink/5 bg-white px-4 py-3 text-xs text-ink/55">
        <strong className="text-ink/75">Flujo recomendado:</strong> registra insumos y proveedores,
        crea una compra pendiente, recibe la compra para generar lotes FIFO y registra salidas para
        consumir stock. El precio comercial solo aplica a papel; tinta y solucion se valorizan por
        compra y kardex.
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
              insumosConMovimiento={insumosConMovimiento}
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
              onRecibir={(orden) => {
                setCompraARecibir(orden);
                setRecepcionAdjunto(null);
              }}
              saving={saving}
            />
          )}
          {tab === "kardex" && (
            <KardexView movimientos={movimientos} lotes={lotes} insumos={insumos} />
          )}
        </>
      )}

      {showInsumoForm && (
        <Modal title="Nuevo insumo" onClose={() => setShowInsumoForm(false)}>
          <form onSubmit={createInsumo} className="space-y-3">
            <Field label="Nombre" error={insumoErrors.nombre}>
              <input
                required
                value={insumoForm.nombre}
                onChange={(e) => {
                  setInsumoForm({ ...insumoForm, nombre: sanitizeBusinessText(e.target.value) });
                  clearInsumoError("nombre", setInsumoErrors);
                }}
                className={fieldClass(insumoErrors.nombre)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo" error={insumoErrors.tipoInsumo}>
                <select
                  value={insumoForm.tipoInsumo}
                  onChange={(e) => {
                    const tipoInsumo = e.target.value as TipoInsumo;
                    setInsumoForm({
                      ...insumoForm,
                      tipoInsumo,
                      unidadMedida: defaultUnidadByTipo[tipoInsumo],
                      gramaje: tipoInsumo === "PAPEL" ? insumoForm.gramaje : undefined,
                      medida: tipoInsumo === "PAPEL" ? insumoForm.medida : "",
                      tipoPapel: tipoInsumo === "PAPEL" ? insumoForm.tipoPapel : "",
                      color: tipoInsumo === "TINTA" ? insumoForm.color : "",
                      precioVentaMillar:
                        tipoInsumo === "PAPEL" ? insumoForm.precioVentaMillar : undefined,
                    });
                    setInsumoErrors({});
                    setError("");
                  }}
                  className={fieldClass(insumoErrors.tipoInsumo)}
                >
                  <option value="PAPEL">Papel</option>
                  <option value="TINTA">Tinta</option>
                  <option value="SOLUCION_FUENTE">Solución de fuente</option>
                </select>
              </Field>
              <Field label="Unidad" error={insumoErrors.unidadMedida}>
                <input
                  readOnly
                  tabIndex={-1}
                  value={unidadDisplayLabels[insumoForm.unidadMedida]}
                  className={`${fieldClass(insumoErrors.unidadMedida)} cursor-not-allowed bg-ink/3 text-ink/60`}
                />
              </Field>
            </div>
            {isPapelForm && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Gramaje" error={insumoErrors.gramaje}>
                    <input
                      required
                      type="number"
                      min="1"
                      step="1"
                      value={insumoForm.gramaje ?? ""}
                      onKeyDown={(e) => preventInvalidNumberKey(e, { decimal: false })}
                      onChange={(e) => {
                        setInsumoForm({
                          ...insumoForm,
                          gramaje: optionalNumber(onlyDigits(e.target.value)),
                        });
                        clearInsumoError("gramaje", setInsumoErrors);
                      }}
                      className={fieldClass(insumoErrors.gramaje)}
                    />
                  </Field>
                  <Field label="Medida" error={insumoErrors.medida}>
                    <input
                      required
                      value={insumoForm.medida ?? ""}
                      placeholder="70x100, A4, Carta"
                      onChange={(e) => {
                        setInsumoForm({
                          ...insumoForm,
                          medida: sanitizeBusinessText(e.target.value),
                        });
                        clearInsumoError("medida", setInsumoErrors);
                      }}
                      className={fieldClass(insumoErrors.medida)}
                    />
                  </Field>
                </div>
                <Field label="Tipo de papel" error={insumoErrors.tipoPapel}>
                  <input
                    required
                    value={insumoForm.tipoPapel ?? ""}
                    placeholder="Bond, couche, opalina"
                    onChange={(e) => {
                      setInsumoForm({
                        ...insumoForm,
                        tipoPapel: sanitizePersonName(e.target.value),
                      });
                      clearInsumoError("tipoPapel", setInsumoErrors);
                    }}
                    className={fieldClass(insumoErrors.tipoPapel)}
                  />
                </Field>
              </>
            )}
            {isTintaForm && (
              <Field label="Color" error={insumoErrors.color}>
                <input
                  required
                  value={insumoForm.color ?? ""}
                  placeholder="Cyan, magenta, amarillo, negro"
                  onChange={(e) => {
                    setInsumoForm({ ...insumoForm, color: sanitizePersonName(e.target.value) });
                    clearInsumoError("color", setInsumoErrors);
                  }}
                  className={fieldClass(insumoErrors.color)}
                />
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              {isPapelForm && (
                <Field label="Precio comercial por millar" error={insumoErrors.precioVentaMillar}>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={insumoForm.precioVentaMillar ?? ""}
                    onKeyDown={(e) => preventInvalidNumberKey(e)}
                    onChange={(e) => {
                      setInsumoForm({
                        ...insumoForm,
                        precioVentaMillar: optionalNumber(sanitizeDecimalInput(e.target.value)),
                      });
                      clearInsumoError("precioVentaMillar", setInsumoErrors);
                    }}
                    className={fieldClass(insumoErrors.precioVentaMillar)}
                  />
                </Field>
              )}
              {!isPapelForm && (
                <div className="rounded-lg border border-ink/10 bg-ink/2 px-3 py-2 text-xs text-ink/55">
                  <span className="block font-bold uppercase tracking-wider text-ink/65">
                    Costo de compra
                  </span>
                  Se ingresa al crear una orden de compra. Al recibirla se genera el lote y el
                  kardex FIFO con ese costo unitario.
                </div>
              )}
              <Field label="Stock mínimo">
                <input
                  required
                  type="number"
                  min="0"
                  step="0.001"
                  value={insumoForm.stockMinimo}
                  onKeyDown={(e) => preventInvalidNumberKey(e)}
                  onChange={(e) => {
                    setInsumoForm({
                      ...insumoForm,
                      stockMinimo: Number(sanitizeDecimalInput(e.target.value)),
                    });
                    clearInsumoError("stockMinimo", setInsumoErrors);
                  }}
                  className={fieldClass(insumoErrors.stockMinimo)}
                />
                {insumoErrors.stockMinimo && (
                  <p className="mt-1 text-xs font-medium text-destructive">
                    {insumoErrors.stockMinimo}
                  </p>
                )}
              </Field>
            </div>
            <FormActions saving={saving} onCancel={() => setShowInsumoForm(false)} />
          </form>
        </Modal>
      )}

      {showProveedorForm && (
        <Modal title="Nuevo proveedor" onClose={() => setShowProveedorForm(false)}>
          <form onSubmit={createProveedor} className="space-y-3">
            <Field label="RUC" error={proveedorErrors.ruc}>
              <input
                required
                inputMode="numeric"
                maxLength={11}
                value={proveedorForm.ruc}
                onKeyDown={(e) => preventInvalidNumberKey(e, { decimal: false })}
                onChange={(e) => {
                  setProveedorForm({
                    ...proveedorForm,
                    ruc: onlyDigits(e.target.value).slice(0, 11),
                  });
                  clearProveedorError("ruc", setProveedorErrors);
                }}
                className={fieldClass(proveedorErrors.ruc)}
              />
            </Field>
            <Field label="Razón social">
              <input
                required
                value={proveedorForm.razonSocial}
                onChange={(e) => {
                  setProveedorForm({
                    ...proveedorForm,
                    razonSocial: sanitizeBusinessText(e.target.value),
                  });
                  clearProveedorError("razonSocial", setProveedorErrors);
                }}
                className={fieldClass(proveedorErrors.razonSocial)}
              />
              {proveedorErrors.razonSocial && (
                <p className="mt-1 text-xs font-medium text-destructive">
                  {proveedorErrors.razonSocial}
                </p>
              )}
            </Field>
            <Field label="Representante" error={proveedorErrors.nombreRepresentante}>
              <input
                value={proveedorForm.nombreRepresentante}
                onChange={(e) => {
                  setProveedorForm({
                    ...proveedorForm,
                    nombreRepresentante: sanitizePersonName(e.target.value),
                  });
                  clearProveedorError("nombreRepresentante", setProveedorErrors);
                }}
                className={fieldClass(proveedorErrors.nombreRepresentante)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Celular" error={proveedorErrors.telefonoCelular}>
                <input
                  inputMode="numeric"
                  maxLength={9}
                  value={proveedorForm.telefonoCelular}
                  onKeyDown={(e) => preventInvalidNumberKey(e, { decimal: false })}
                  onChange={(e) => {
                    setProveedorForm({
                      ...proveedorForm,
                      telefonoCelular: onlyDigits(e.target.value).slice(0, 9),
                    });
                    clearProveedorError("telefonoCelular", setProveedorErrors);
                  }}
                  className={fieldClass(proveedorErrors.telefonoCelular)}
                />
              </Field>
              <Field label="Correo" error={proveedorErrors.correo}>
                <input
                  type="email"
                  value={proveedorForm.correo}
                  onChange={(e) => {
                    setProveedorForm({ ...proveedorForm, correo: sanitizeEmail(e.target.value) });
                    clearProveedorError("correo", setProveedorErrors);
                  }}
                  className={fieldClass(proveedorErrors.correo)}
                />
              </Field>
            </div>
            <Field label="Dirección">
              <input
                value={proveedorForm.direccion}
                onChange={(e) => {
                  setProveedorForm({
                    ...proveedorForm,
                    direccion: sanitizeAddress(e.target.value),
                  });
                  clearProveedorError("direccion", setProveedorErrors);
                }}
                className={fieldClass(proveedorErrors.direccion)}
              />
              {proveedorErrors.direccion && (
                <p className="mt-1 text-xs font-medium text-destructive">
                  {proveedorErrors.direccion}
                </p>
              )}
            </Field>
            <FormActions saving={saving} onCancel={() => setShowProveedorForm(false)} />
          </form>
        </Modal>
      )}

      {showSalidaForm && (
        <Modal title="Registrar salida FIFO" onClose={() => setShowSalidaForm(false)}>
          <form onSubmit={registrarSalida} className="space-y-3">
            <Field label="Insumo" error={salidaErrors.idInsumo}>
              <select
                value={salidaForm.idInsumo}
                onChange={(e) => {
                  setSalidaForm({ ...salidaForm, idInsumo: Number(e.target.value) });
                  clearSalidaError("idInsumo", setSalidaErrors);
                }}
                className={fieldClass(salidaErrors.idInsumo)}
              >
                {insumos.map((insumo) => (
                  <option key={insumo.idInsumo} value={insumo.idInsumo}>
                    {insumo.nombre}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cantidad" error={salidaErrors.cantidad}>
                <input
                  required
                  type="number"
                  inputMode="decimal"
                  min="0.001"
                  step="0.001"
                  value={salidaForm.cantidad || ""}
                  onKeyDown={(e) => preventInvalidNumberKey(e)}
                  onChange={(e) => {
                    setSalidaForm({
                      ...salidaForm,
                      cantidad: Number(sanitizeDecimalInput(e.target.value)),
                    });
                    clearSalidaError("cantidad", setSalidaErrors);
                  }}
                  className={fieldClass(salidaErrors.cantidad)}
                />
              </Field>
              <Field label="Orden de trabajo" error={salidaErrors.idOrdenTrabajo}>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={salidaForm.idOrdenTrabajo ?? ""}
                  onKeyDown={(e) => preventInvalidNumberKey(e, { decimal: false })}
                  onChange={(e) => {
                    setSalidaForm({
                      ...salidaForm,
                      idOrdenTrabajo: optionalNumber(onlyDigits(e.target.value)),
                    });
                    clearSalidaError("idOrdenTrabajo", setSalidaErrors);
                  }}
                  className={fieldClass(salidaErrors.idOrdenTrabajo)}
                />
              </Field>
            </div>
            <Field label="Observaciones" error={salidaErrors.observaciones}>
              <textarea
                maxLength={250}
                value={salidaForm.observaciones}
                onChange={(e) => {
                  setSalidaForm({
                    ...salidaForm,
                    observaciones: sanitizeLongText(e.target.value).slice(0, 250),
                  });
                  clearSalidaError("observaciones", setSalidaErrors);
                }}
                className={`${fieldClass(salidaErrors.observaciones)} min-h-20`}
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
        <Modal
          title="Nueva orden de compra"
          onClose={() => setShowCompraForm(false)}
          className="max-w-5xl"
        >
          <form onSubmit={createCompra} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-ink/10 bg-ink/2 px-3 py-2 text-xs text-ink/55">
                <span className="block font-bold uppercase tracking-wider text-ink/65">
                  Codigo de compra
                </span>
                Se genera automaticamente al guardar la orden.
              </div>
              <Field label="Proveedor" error={compraErrors.idProveedor}>
                <button
                  type="button"
                  onClick={() => setProveedorSearchOpen(true)}
                  className={`${fieldClass(compraErrors.idProveedor)} text-left`}
                >
                  {selectedProveedor
                    ? `${selectedProveedor.razonSocial} - RUC ${selectedProveedor.ruc}`
                    : "Buscar proveedor por razon social o RUC"}
                </button>
              </Field>
            </div>{" "}
            {compraForm.detalles.map((detalle, index) => {
              const selectedInsumo = insumos.find((insumo) => insumo.idInsumo === detalle.idInsumo);

              return (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 rounded-lg border border-ink/5 bg-ink/2 p-2"
                >
                  <label className="col-span-4 text-[10px] font-bold uppercase tracking-wider text-ink/45">
                    Insumo
                    <button
                      type="button"
                      onClick={() => setInsumoCompraSearchIndex(index)}
                      className={`${fieldClass(compraErrors.detalles)} mt-1 text-left`}
                    >
                      <span className="block truncate">
                        {selectedInsumo ? selectedInsumo.nombre : "Buscar insumo"}
                      </span>
                      {selectedInsumo && (
                        <span className="mt-0.5 block truncate text-[11px] font-normal normal-case tracking-normal text-ink/45">
                          {describeInsumo(selectedInsumo)}
                        </span>
                      )}
                    </button>
                  </label>
                  <label className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-ink/45">
                    Cantidad
                    <input
                      type="number"
                      inputMode="decimal"
                      min="1"
                      step="1"
                      value={detalle.cantidad}
                      onKeyDown={(e) => preventInvalidNumberKey(e)}
                      onChange={(e) => {
                        updateDetalle(
                          index,
                          { cantidad: Number(sanitizeDecimalInput(e.target.value)) },
                          compraForm,
                          setCompraForm,
                        );
                        clearCompraError("detalles", setCompraErrors);
                      }}
                      className={`${fieldClass(compraErrors.detalles)} mt-1`}
                    />
                  </label>
                  <label className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-ink/45">
                    Costo unitario
                    <span className="ml-1 font-normal normal-case tracking-normal text-ink/35">
                      editable
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="1"
                      value={detalle.precioUnitario}
                      onKeyDown={(e) => preventInvalidNumberKey(e)}
                      onChange={(e) => {
                        updateDetalle(
                          index,
                          { precioUnitario: Number(sanitizeDecimalInput(e.target.value)) },
                          compraForm,
                          setCompraForm,
                        );
                        clearCompraError("detalles", setCompraErrors);
                      }}
                      className={`${fieldClass(compraErrors.detalles)} mt-1`}
                    />
                  </label>
                  <div className="col-span-3 text-[10px] font-bold uppercase tracking-wider text-ink/45">
                    Subtotal
                    <div className="mt-1 rounded-md border border-ink/10 bg-white px-3 py-2 text-right font-mono text-xs text-ink/70">
                      {formatCurrency(
                        Number(detalle.cantidad || 0) * Number(detalle.precioUnitario || 0),
                      )}
                    </div>
                  </div>
                  <div className="col-span-1 flex items-end justify-end pb-0.5">
                    {compraForm.detalles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setCompraForm({
                            ...compraForm,
                            detalles: compraForm.detalles.filter(
                              (_, currentIndex) => currentIndex !== index,
                            ),
                          });
                          clearCompraError("detalles", setCompraErrors);
                        }}
                        className="rounded border border-ink/10 px-2 py-2 text-[10px] font-bold text-ink/50 hover:bg-ink hover:text-paper"
                      >
                        X
                      </button>
                    )}
                  </div>
                </div>
              );
            })}{" "}
            {compraErrors.detalles && (
              <p className="text-xs font-medium text-destructive">{compraErrors.detalles}</p>
            )}
            <button
              type="button"
              onClick={() => {
                const insumoDisponible = insumos.find(
                  (insumo) =>
                    !compraForm.detalles.some((detalle) => detalle.idInsumo === insumo.idInsumo),
                );
                if (!insumoDisponible) return;
                setCompraForm({
                  ...compraForm,
                  detalles: [
                    ...compraForm.detalles,
                    {
                      idInsumo: insumoDisponible.idInsumo,
                      cantidad: 1,
                      precioUnitario: getCostoUnitarioSugerido(insumoDisponible.idInsumo),
                    },
                  ],
                });
                clearCompraError("detalles", setCompraErrors);
              }}
              disabled={compraForm.detalles.length >= insumos.length}
              className="text-[11px] font-bold uppercase tracking-widest text-cyan-press disabled:text-ink/25"
            >
              Anadir item
            </button>{" "}
            <Field label="Observaciones" error={compraErrors.observaciones}>
              <textarea
                maxLength={300}
                value={compraForm.observaciones}
                onChange={(e) => {
                  setCompraForm({
                    ...compraForm,
                    observaciones: sanitizeLongText(e.target.value).slice(0, 300),
                  });
                  clearCompraError("observaciones", setCompraErrors);
                }}
                className={`${fieldClass(compraErrors.observaciones)} min-h-20`}
              />
            </Field>
            <FormActions
              saving={saving}
              onCancel={() => setShowCompraForm(false)}
              submitLabel="Crear compra"
            />
          </form>
          <CommandDialog open={proveedorSearchOpen} onOpenChange={setProveedorSearchOpen}>
            <CommandInput placeholder="Buscar proveedor por razon social, RUC o correo..." />
            <CommandList>
              <CommandEmpty>No se encontraron proveedores.</CommandEmpty>
              <CommandGroup heading="Proveedores">
                {proveedores.map((proveedor) => (
                  <CommandItem
                    key={proveedor.idProveedor}
                    value={`${proveedor.razonSocial} ${proveedor.ruc} ${proveedor.correo ?? ""}`}
                    onSelect={() => {
                      setCompraForm({ ...compraForm, idProveedor: proveedor.idProveedor });
                      clearCompraError("idProveedor", setCompraErrors);
                      setProveedorSearchOpen(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{proveedor.razonSocial}</span>
                      <span className="text-xs text-ink/50">
                        RUC {proveedor.ruc} {proveedor.correo ? `- ${proveedor.correo}` : ""}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </CommandDialog>
          <CommandDialog
            open={insumoCompraSearchIndex !== null}
            onOpenChange={(open) => {
              if (!open) setInsumoCompraSearchIndex(null);
            }}
          >
            <CommandInput placeholder="Buscar insumo por nombre, tipo o detalle..." />
            <CommandList>
              <CommandEmpty>No se encontraron insumos.</CommandEmpty>
              <CommandGroup heading="Insumos disponibles">
                {insumoCompraSearchIndex !== null &&
                  insumos
                    .filter((insumo) => {
                      const selectedInsumos = new Set(
                        compraForm.detalles
                          .filter((_, index) => index !== insumoCompraSearchIndex)
                          .map((detalle) => detalle.idInsumo),
                      );
                      return !selectedInsumos.has(insumo.idInsumo);
                    })
                    .map((insumo) => (
                      <CommandItem
                        key={insumo.idInsumo}
                        value={`${insumo.nombre} ${insumo.tipoInsumo} ${describeInsumo(insumo)}`}
                        onSelect={() => {
                          updateDetalle(
                            insumoCompraSearchIndex,
                            {
                              idInsumo: insumo.idInsumo,
                              precioUnitario: getCostoUnitarioSugerido(insumo.idInsumo),
                            },
                            compraForm,
                            setCompraForm,
                          );
                          clearCompraError("detalles", setCompraErrors);
                          setInsumoCompraSearchIndex(null);
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{insumo.nombre}</span>
                          <span className="text-xs text-ink/50">
                            {tipoLabels[insumo.tipoInsumo]} - {describeInsumo(insumo)}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
              </CommandGroup>
            </CommandList>
          </CommandDialog>
        </Modal>
      )}

      {compraARecibir && (
        <Modal title="Confirmar recepcion de compra" onClose={() => setCompraARecibir(null)}>
          <div className="space-y-4 text-sm">
            <div className="rounded-lg border border-emerald-press/25 bg-emerald-press/10 p-3 text-ink/70">
              Al confirmar, la compra {compraARecibir.codigo} pasara a recibida y se generaran lotes
              FIFO con entradas en kardex.
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-ink/5 p-3">
              <Info
                label="Proveedor"
                value={compraARecibir.proveedor?.razonSocial || "Sin proveedor"}
              />
              <Info label="Total" value={formatCurrency(compraARecibir.total)} />
              <Info label="Items" value={`${compraARecibir.detalles?.length ?? 0}`} />
              <Info label="Emision" value={formatDate(compraARecibir.fechaEmision)} />
            </div>
            <Field label="Adjunto opcional">
              <div className="relative">
                <Paperclip className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/35" />
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(event) => setRecepcionAdjunto(event.target.files?.[0] ?? null)}
                  className={`${inputClass} pl-9`}
                />
              </div>
            </Field>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void recibirCompra(compraARecibir.idOrdenCompra, recepcionAdjunto)}
                className="flex-1 rounded bg-emerald-press px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
              >
                {saving ? "Recibiendo..." : "Confirmar recepcion"}
              </button>
              <button
                type="button"
                onClick={() => setCompraARecibir(null)}
                className="flex-1 rounded border border-ink/10 px-4 py-2 text-sm font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}

function InsumosView({
  insumos,
  insumosConMovimiento,
  tipoFiltro,
  setTipoFiltro,
  onSalida,
}: {
  insumos: Insumo[];
  insumosConMovimiento: Set<number>;
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
              <th className="px-4 py-3 text-right font-medium">Valor comercial</th>
              <th className="px-4 py-3 text-left font-medium">Estado</th>
              <th className="px-4 py-3 text-right font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {insumos.map((insumo) => {
              const hasMovement = insumosConMovimiento.has(insumo.idInsumo);
              const low =
                hasMovement &&
                Number(insumo.stockMinimo) > 0 &&
                Number(insumo.stockActual) <= Number(insumo.stockMinimo);
              return (
                <tr
                  key={insumo.idInsumo}
                  className="border-b border-ink/5 last:border-0 hover:bg-ink/2"
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
                    {insumo.tipoInsumo === "PAPEL" ? (
                      formatCurrency(insumo.precioVentaMillar || 0)
                    ) : (
                      <span className="text-xs font-sans text-ink/35">Por compra</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!hasMovement ? (
                      <StatusDot label="Pendiente compra" muted />
                    ) : low ? (
                      <StatusDot label="Reposicion" danger />
                    ) : (
                      <StatusDot label="Optimo" />
                    )}
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
  onRecibir: (orden: OrdenCompra) => void;
  saving: boolean;
}) {
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [adjuntosPorOrden, setAdjuntosPorOrden] = useState<Record<number, AdjuntoOrdenCompra[]>>(
    {},
  );
  const [loadingAdjuntos, setLoadingAdjuntos] = useState<Record<number, boolean>>({});
  const [adjuntosError, setAdjuntosError] = useState<Record<number, string>>({});
  const [previewAdjunto, setPreviewAdjunto] = useState<AdjuntoOrdenCompra | null>(null);

  const toggleOrden = async (orden: OrdenCompra) => {
    if (expandedOrderId === orden.idOrdenCompra) {
      setExpandedOrderId(null);
      return;
    }

    setExpandedOrderId(orden.idOrdenCompra);
    if (adjuntosPorOrden[orden.idOrdenCompra] || loadingAdjuntos[orden.idOrdenCompra]) {
      return;
    }

    setLoadingAdjuntos((current) => ({ ...current, [orden.idOrdenCompra]: true }));
    setAdjuntosError((current) => {
      const next = { ...current };
      delete next[orden.idOrdenCompra];
      return next;
    });

    try {
      const adjuntos = await inventoryService.getOrdenCompraAdjuntos(orden.idOrdenCompra);
      setAdjuntosPorOrden((current) => ({ ...current, [orden.idOrdenCompra]: adjuntos }));
    } catch (error) {
      setAdjuntosError((current) => ({
        ...current,
        [orden.idOrdenCompra]:
          error instanceof Error ? error.message : "No se pudieron cargar los adjuntos",
      }));
    } finally {
      setLoadingAdjuntos((current) => ({ ...current, [orden.idOrdenCompra]: false }));
    }
  };

  return (
    <div className="rounded-xl border border-ink/5 bg-white">
      <div className="flex items-center justify-between border-b border-ink/5 px-5 py-3">
        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-widest">
            Órdenes de compra
          </h2>
          <p className="mt-1 text-xs text-ink/45">
            La compra pendiente no mueve stock; al recibirla se crean lotes y entradas de kardex.
          </p>
        </div>
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
          {ordenes.map((orden) => {
            const expanded = expandedOrderId === orden.idOrdenCompra;
            return (
              <Fragment key={orden.idOrdenCompra}>
                <tr className="border-b border-ink/5 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => void toggleOrden(orden)}
                      className="mr-2 inline-grid size-6 place-items-center rounded border border-ink/10 align-middle text-ink/45 hover:bg-ink/5"
                      title={expanded ? "Ocultar items" : "Ver items"}
                    >
                      {expanded ? (
                        <ChevronDown className="size-3.5" />
                      ) : (
                        <ChevronRight className="size-3.5" />
                      )}
                    </button>
                    {orden.codigo}
                  </td>
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
                        onClick={() => onRecibir(orden)}
                        className="rounded border border-emerald-press px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-press disabled:opacity-50"
                      >
                        Recibir
                      </button>
                    )}
                  </td>
                </tr>
                {expanded && (
                  <tr className="border-b border-ink/5 bg-ink/2">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="grid gap-2">
                        {(orden.detalles ?? []).map((detalle) => (
                          <div
                            key={detalle.idDetalleOrdenCompra ?? detalle.idInsumo}
                            className="grid grid-cols-12 gap-3 rounded-lg border border-ink/5 bg-white px-3 py-2 text-xs"
                          >
                            <span className="col-span-5 font-semibold">
                              {detalle.insumo?.nombre || "Insumo"}
                            </span>
                            <span className="col-span-2 text-right font-mono">
                              {formatNumber(detalle.cantidad)}
                            </span>
                            <span className="col-span-2 text-right font-mono">
                              {formatCurrency(detalle.precioUnitario)}
                            </span>
                            <span className="col-span-3 text-right font-mono font-semibold">
                              {formatCurrency(
                                detalle.subtotal ??
                                  Number(detalle.cantidad || 0) *
                                    Number(detalle.precioUnitario || 0),
                              )}
                            </span>
                          </div>
                        ))}
                        {(!orden.detalles || orden.detalles.length === 0) && (
                          <p className="text-xs text-ink/45">Esta orden no tiene items cargados.</p>
                        )}
                        <OrdenCompraAdjuntos
                          adjuntos={adjuntosPorOrden[orden.idOrdenCompra] ?? []}
                          loading={Boolean(loadingAdjuntos[orden.idOrdenCompra])}
                          error={adjuntosError[orden.idOrdenCompra]}
                          onPreview={setPreviewAdjunto}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      {previewAdjunto && (
        <AdjuntoPreviewModal adjunto={previewAdjunto} onClose={() => setPreviewAdjunto(null)} />
      )}
    </div>
  );
}

function OrdenCompraAdjuntos({
  adjuntos,
  loading,
  error,
  onPreview,
}: {
  adjuntos: AdjuntoOrdenCompra[];
  loading: boolean;
  error?: string;
  onPreview: (adjunto: AdjuntoOrdenCompra) => void;
}) {
  return (
    <div className="mt-3 border-t border-ink/5 pt-3">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ink/45">
        <Paperclip className="size-3.5" />
        Adjuntos de recepcion
      </div>
      {loading && <p className="text-xs text-ink/40">Cargando adjuntos...</p>}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      {!loading && !error && adjuntos.length === 0 && (
        <p className="text-xs text-ink/40">Sin adjuntos registrados.</p>
      )}
      {adjuntos.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {adjuntos.map((adjunto) => {
            const image = isImageAdjunto(adjunto);
            const pdf = isPdfAdjunto(adjunto);
            const canPreview = Boolean(adjunto.storageUrl && (image || pdf));
            return (
              <button
                key={adjunto.idAdjunto}
                type="button"
                disabled={!canPreview}
                onClick={() => canPreview && onPreview(adjunto)}
                className="flex items-center gap-3 rounded-lg border border-ink/5 bg-white p-2 text-left disabled:cursor-default"
              >
                {image && adjunto.storageUrl ? (
                  <img
                    src={adjunto.storageUrl}
                    alt={adjunto.nombreArchivo}
                    className="size-14 rounded border border-ink/10 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="grid size-14 place-items-center rounded border border-ink/10 bg-ink/3 text-[10px] font-bold uppercase text-ink/45">
                    {pdf ? "PDF" : "DOC"}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-ink">
                    {adjunto.nombreArchivo}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-ink/45">
                    {adjunto.contentType} - {formatBytes(adjunto.tamanoBytes)}
                  </span>
                  {!adjunto.storageUrl && (
                    <span className="mt-0.5 block text-[11px] text-ink/35">
                      Sin URL publica para previsualizar.
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AdjuntoPreviewModal({
  adjunto,
  onClose,
}: {
  adjunto: AdjuntoOrdenCompra;
  onClose: () => void;
}) {
  const image = isImageAdjunto(adjunto);
  const pdf = isPdfAdjunto(adjunto);

  return (
    <Modal title={adjunto.nombreArchivo} onClose={onClose} className="max-w-5xl">
      <div className="max-h-[78vh] overflow-hidden rounded-lg border border-ink/10 bg-ink/3">
        {image && adjunto.storageUrl && (
          <img
            src={adjunto.storageUrl}
            alt={adjunto.nombreArchivo}
            className="max-h-[78vh] w-full object-contain"
          />
        )}
        {pdf && adjunto.storageUrl && (
          <iframe
            src={adjunto.storageUrl}
            title={adjunto.nombreArchivo}
            className="h-[78vh] w-full bg-white"
          />
        )}
      </div>
    </Modal>
  );
}

function KardexView({
  movimientos,
  lotes,
  insumos,
}: {
  movimientos: MovimientoInventario[];
  lotes: Lote[];
  insumos: Insumo[];
}) {
  const [idInsumo, setIdInsumo] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [exporting, setExporting] = useState(false);
  const filteredMovimientos = useMemo(() => {
    const desde = fechaDesde ? new Date(`${fechaDesde}T00:00:00`) : null;
    const hasta = fechaHasta ? new Date(`${fechaHasta}T23:59:59`) : null;
    return movimientos.filter((movimiento) => {
      const fecha = new Date(movimiento.fecha);
      const matchesInsumo = !idInsumo || movimiento.insumo?.idInsumo === Number(idInsumo);
      const matchesDesde = !desde || fecha >= desde;
      const matchesHasta = !hasta || fecha <= hasta;
      return matchesInsumo && matchesDesde && matchesHasta;
    });
  }, [fechaDesde, fechaHasta, idInsumo, movimientos]);

  const exportar = async () => {
    setExporting(true);
    try {
      await inventoryService.exportKardexXlsx({
        idInsumo: idInsumo ? Number(idInsumo) : null,
        fechaDesde,
        fechaHasta,
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-8 overflow-hidden rounded-xl border border-ink/5 bg-white">
        <div className="border-b border-ink/5 px-5 py-3">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest">
            Kardex valorizado
          </h2>
          <div className="mt-4 grid grid-cols-4 gap-3">
            <Field label="Insumo">
              <select
                value={idInsumo}
                onChange={(event) => setIdInsumo(event.target.value)}
                className={inputClass}
              >
                <option value="">Todos</option>
                {insumos.map((insumo) => (
                  <option key={insumo.idInsumo} value={insumo.idInsumo}>
                    {insumo.nombre}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Desde">
              <input
                type="date"
                value={fechaDesde}
                onChange={(event) => setFechaDesde(event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Hasta">
              <input
                type="date"
                value={fechaHasta}
                onChange={(event) => setFechaHasta(event.target.value)}
                className={inputClass}
              />
            </Field>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIdInsumo("");
                  setFechaDesde("");
                  setFechaHasta("");
                }}
                className="flex-1 rounded border border-ink/10 px-3 py-2 text-xs font-semibold text-ink/60 hover:bg-ink/5"
              >
                Limpiar
              </button>
              <button
                type="button"
                disabled={exporting}
                onClick={() => void exportar()}
                className="inline-flex items-center gap-1 rounded bg-ink px-3 py-2 text-xs font-semibold text-paper disabled:opacity-50"
              >
                <Download className="size-3.5" />
                XLSX
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-ink/45">
            Las entradas nacen al recibir compras; las salidas consumen primero el lote disponible
            más antiguo.
          </p>
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
            {filteredMovimientos.slice(0, 50).map((movimiento) => (
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
            {filteredMovimientos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-ink/40">
                  No hay movimientos para los filtros seleccionados.
                </td>
              </tr>
            )}
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
  className = "max-w-2xl",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className={`w-full rounded-xl bg-white p-6 shadow-xl ${className}`}>
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

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-mono uppercase tracking-widest text-ink/45">
        {label}
      </span>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-destructive">{error}</p>}
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

function StatusDot({
  label,
  danger = false,
  muted = false,
}: {
  label: string;
  danger?: boolean;
  muted?: boolean;
}) {
  const colorClass = muted ? "text-ink/35" : danger ? "text-destructive" : "text-emerald-press";
  const dotClass = muted ? "bg-ink/25" : danger ? "bg-destructive" : "bg-emerald-press";

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${colorClass}`}
    >
      <span className={`size-1.5 rounded-full ${dotClass}`} />
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

function getCostoUnitarioSugeridoFromData(idInsumo: number, insumos: Insumo[], lotes: Lote[]) {
  const lotesDelInsumo = lotes
    .filter((lote) => lote.insumo?.idInsumo === idInsumo && Number(lote.costoUnitario) > 0)
    .sort((a, b) => String(b.fechaIngreso || "").localeCompare(String(a.fechaIngreso || "")));
  if (lotesDelInsumo[0]) {
    return Number(lotesDelInsumo[0].costoUnitario);
  }

  const insumo = insumos.find((item) => item.idInsumo === idInsumo);
  if (insumo?.tipoInsumo === "PAPEL" && Number(insumo.precioVentaMillar) > 0) {
    return Number(insumo.precioVentaMillar);
  }

  return 0;
}

function cleanInsumo(form: CreateInsumoRequest): CreateInsumoRequest {
  return {
    ...form,
    nombre: form.nombre.trim(),
    gramaje: form.tipoInsumo === "PAPEL" ? form.gramaje || null : null,
    medida: form.tipoInsumo === "PAPEL" ? cleanOptionalText(form.medida) : null,
    tipoPapel: form.tipoInsumo === "PAPEL" ? cleanOptionalText(form.tipoPapel) : null,
    color: form.tipoInsumo === "TINTA" ? cleanOptionalText(form.color) : null,
    precioVentaMillar: form.tipoInsumo === "PAPEL" ? form.precioVentaMillar || null : null,
  };
}

function cleanProveedor(form: CreateProveedorRequest): CreateProveedorRequest {
  return {
    ruc: onlyDigits(form.ruc),
    razonSocial: form.razonSocial.trim().replace(/\s+/g, " "),
    nombreRepresentante: form.nombreRepresentante?.trim().replace(/\s+/g, " "),
    direccion: form.direccion?.trim().replace(/\s+/g, " "),
    telefonoFijo: onlyDigits(form.telefonoFijo ?? ""),
    telefonoCelular: onlyDigits(form.telefonoCelular ?? ""),
    correo: form.correo?.trim().toLowerCase(),
  };
}

function cleanSalida(form: RegistrarSalidaRequest): RegistrarSalidaRequest {
  return {
    ...form,
    idOrdenTrabajo: form.idOrdenTrabajo || null,
    observaciones: form.observaciones?.trim(),
  };
}

function cleanCompra(form: CreateOrdenCompraRequest): CreateOrdenCompraRequest {
  return {
    ...form,
    codigo: form.codigo?.trim().toUpperCase(),
    observaciones: form.observaciones?.trim(),
    detalles: form.detalles.map((detalle) => ({
      idInsumo: detalle.idInsumo,
      cantidad: Number(detalle.cantidad),
      precioUnitario: Number(detalle.precioUnitario),
    })),
  };
}

function validateInsumoForm(form: CreateInsumoRequest, existingInsumos: Insumo[]) {
  const errors: InsumoFormErrors = {};
  const normalizedName = normalizeText(form.nombre);

  if (!normalizedName) {
    errors.nombre = "Ingresa el nombre del insumo.";
  } else if (normalizedName.length < 3) {
    errors.nombre = "El nombre debe tener al menos 3 caracteres.";
  } else if (!hasLetter(normalizedName)) {
    errors.nombre = "El nombre debe incluir al menos una letra.";
  } else if (
    existingInsumos.some(
      (insumo) => insumo.activo && normalizeText(insumo.nombre) === normalizedName,
    )
  ) {
    errors.nombre = "Ya existe un insumo activo con este nombre.";
  }

  if (form.unidadMedida !== defaultUnidadByTipo[form.tipoInsumo]) {
    errors.unidadMedida = `Para ${tipoLabels[form.tipoInsumo]} la unidad debe ser ${defaultUnidadByTipo[form.tipoInsumo]}.`;
  }

  if (!isValidNumber(form.stockMinimo) || Number(form.stockMinimo) < 0) {
    errors.stockMinimo = "El stock minimo debe ser cero o mayor.";
  }

  if (form.tipoInsumo === "PAPEL") {
    if (!Number.isInteger(Number(form.gramaje)) || Number(form.gramaje) <= 0) {
      errors.gramaje = "El gramaje debe ser un entero mayor a cero.";
    }
    if (!normalizeText(form.medida)) {
      errors.medida = "Ingresa la medida del papel.";
    }
    if (!normalizeText(form.tipoPapel)) {
      errors.tipoPapel = "Ingresa el tipo de papel.";
    } else if (!isLettersAndSpaces(form.tipoPapel ? form.tipoPapel : "")) {
      errors.tipoPapel = "El tipo de papel solo debe contener letras.";
    }
    if (!isValidNumber(form.precioVentaMillar) || Number(form.precioVentaMillar) <= 0) {
      errors.precioVentaMillar = "El precio de venta por millar debe ser mayor a cero.";
    }
  }

  if (form.tipoInsumo === "TINTA" && !normalizeText(form.color)) {
    errors.color = "Ingresa el color de la tinta.";
  }

  return errors;
}

function validateProveedorForm(form: CreateProveedorRequest, existingProveedores: Proveedor[]) {
  const errors: ProveedorFormErrors = {};
  const razonSocial = normalizeText(form.razonSocial);
  const representante = normalizeText(form.nombreRepresentante);
  const direccion = normalizeText(form.direccion);

  if (!/^\d{11}$/.test(form.ruc)) {
    errors.ruc = "El RUC debe tener exactamente 11 digitos.";
  } else if (
    existingProveedores.some((proveedor) => proveedor.activo && proveedor.ruc === form.ruc)
  ) {
    errors.ruc = "Ya existe un proveedor activo con este RUC.";
  }

  if (!razonSocial) {
    errors.razonSocial = "Ingresa la razon social.";
  } else if (razonSocial.length < 3) {
    errors.razonSocial = "La razon social debe tener al menos 3 caracteres.";
  }

  if (representante && representante.length < 3) {
    errors.nombreRepresentante = "El representante debe tener al menos 3 caracteres.";
  }

  if (form.telefonoFijo && !/^\d{6,9}$/.test(form.telefonoFijo)) {
    errors.telefonoFijo = "El telefono fijo debe tener entre 6 y 9 digitos.";
  }

  if (form.telefonoCelular && !/^\d{9}$/.test(form.telefonoCelular)) {
    errors.telefonoCelular = "El celular debe tener 9 digitos.";
  }

  if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
    errors.correo = "Ingresa un correo valido.";
  }

  if (direccion && direccion.length < 5) {
    errors.direccion = "La direccion debe tener al menos 5 caracteres.";
  }

  return errors;
}

function validateSalidaForm(form: RegistrarSalidaRequest, existingInsumos: Insumo[]) {
  const errors: SalidaFormErrors = {};
  const selectedInsumo = existingInsumos.find((insumo) => insumo.idInsumo === form.idInsumo);

  if (!selectedInsumo) {
    errors.idInsumo = "Selecciona un insumo valido.";
  }

  if (!isValidNumber(form.cantidad) || Number(form.cantidad) <= 0) {
    errors.cantidad = "La cantidad debe ser mayor a cero.";
  } else if (selectedInsumo && Number(form.cantidad) > Number(selectedInsumo.stockActual)) {
    errors.cantidad = "La cantidad no puede superar el stock disponible.";
  }

  if (
    form.idOrdenTrabajo &&
    (!Number.isInteger(Number(form.idOrdenTrabajo)) || Number(form.idOrdenTrabajo) <= 0)
  ) {
    errors.idOrdenTrabajo = "La orden de trabajo debe ser un numero entero positivo.";
  }

  if ((form.observaciones?.length ?? 0) > 250) {
    errors.observaciones = "Las observaciones no deben superar 250 caracteres.";
  }

  return errors;
}

function validateCompraForm(
  form: CreateOrdenCompraRequest,
  existingInsumos: Insumo[],
  existingProveedores: Proveedor[],
) {
  const errors: CompraFormErrors = {};

  if (form.codigo && !/^[A-Z0-9-]{3,30}$/.test(form.codigo)) {
    errors.codigo = "Usa 3 a 30 caracteres: letras mayusculas, numeros o guion.";
  }

  if (!existingProveedores.some((proveedor) => proveedor.idProveedor === form.idProveedor)) {
    errors.idProveedor = "Selecciona un proveedor valido.";
  }

  if (form.detalles.length === 0) {
    errors.detalles = "Agrega al menos un item.";
  } else {
    const usedInsumos = new Set<number>();
    for (const detalle of form.detalles) {
      if (!existingInsumos.some((insumo) => insumo.idInsumo === detalle.idInsumo)) {
        errors.detalles = "Cada item debe tener un insumo valido.";
        break;
      }
      if (usedInsumos.has(detalle.idInsumo)) {
        errors.detalles = "No repitas el mismo insumo en una orden.";
        break;
      }
      if (!isValidNumber(detalle.cantidad) || Number(detalle.cantidad) <= 0) {
        errors.detalles = "La cantidad de cada item debe ser mayor a cero.";
        break;
      }
      if (!isValidNumber(detalle.precioUnitario) || Number(detalle.precioUnitario) <= 0) {
        errors.detalles = "El precio unitario de cada item debe ser mayor a cero.";
        break;
      }
      usedInsumos.add(detalle.idInsumo);
    }
  }

  if ((form.observaciones?.length ?? 0) > 300) {
    errors.observaciones = "Las observaciones no deben superar 300 caracteres.";
  }

  return errors;
}

function cleanOptionalText(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function normalizeText(value?: string | null) {
  return value?.trim().replace(/\s+/g, " ").toLowerCase() ?? "";
}

function isValidNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value);
}

function hasLetter(value: string) {
  return /\p{L}/u.test(value);
}

function isLettersAndSpaces(value: string) {
  return /^[\p{L}\s]+$/u.test(value.trim());
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function sanitizeDecimalInput(value: string) {
  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
  const [integerPart, ...decimalParts] = normalized.split(".");
  return decimalParts.length > 0 ? `${integerPart}.${decimalParts.join("")}` : integerPart;
}

function sanitizePersonName(value: string) {
  return value.replace(/[^\p{L}\s]/gu, "").replace(/\s{2,}/g, " ");
}

function sanitizeBusinessText(value: string) {
  return value.replace(/[^\p{L}\p{N}\s.&,#/-]/gu, "").replace(/\s{2,}/g, " ");
}

function sanitizeAddress(value: string) {
  return value.replace(/[^\p{L}\p{N}\s.&,#°º/-]/gu, "").replace(/\s{2,}/g, " ");
}

function sanitizeLongText(value: string) {
  return value.replace(/[^\p{L}\p{N}\s.,;:()#°º/-]/gu, "").replace(/\s{2,}/g, " ");
}

function sanitizeCode(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 30);
}

function sanitizeEmail(value: string) {
  return value.trim().replace(/[^A-Za-z0-9._%+-@]/g, "");
}

function preventInvalidNumberKey(
  event: React.KeyboardEvent<HTMLInputElement>,
  options: { decimal?: boolean } = {},
) {
  const allowsDecimal = options.decimal ?? true;
  const blockedKeys = ["e", "E", "+", "-", ","];

  if (!allowsDecimal) {
    blockedKeys.push(".");
  }

  if (blockedKeys.includes(event.key)) {
    event.preventDefault();
  }
}

function preventInvalidCodeKey(event: React.KeyboardEvent<HTMLInputElement>) {
  if (event.key.length === 1 && !/[a-zA-Z0-9-]/.test(event.key)) {
    event.preventDefault();
  }
}

function clearInsumoError(
  field: keyof InsumoFormErrors,
  setInsumoErrors: React.Dispatch<React.SetStateAction<InsumoFormErrors>>,
) {
  setInsumoErrors((current) => {
    if (!current[field]) return current;
    const next = { ...current };
    delete next[field];
    return next;
  });
}

function clearProveedorError(
  field: keyof ProveedorFormErrors,
  setProveedorErrors: React.Dispatch<React.SetStateAction<ProveedorFormErrors>>,
) {
  setProveedorErrors((current) => {
    if (!current[field]) return current;
    const next = { ...current };
    delete next[field];
    return next;
  });
}

function clearSalidaError(
  field: keyof SalidaFormErrors,
  setSalidaErrors: React.Dispatch<React.SetStateAction<SalidaFormErrors>>,
) {
  setSalidaErrors((current) => {
    if (!current[field]) return current;
    const next = { ...current };
    delete next[field];
    return next;
  });
}

function clearCompraError(
  field: keyof CompraFormErrors,
  setCompraErrors: React.Dispatch<React.SetStateAction<CompraFormErrors>>,
) {
  setCompraErrors((current) => {
    if (!current[field]) return current;
    const next = { ...current };
    delete next[field];
    return next;
  });
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

function isImageAdjunto(adjunto: AdjuntoOrdenCompra) {
  return adjunto.contentType?.startsWith("image/");
}

function isPdfAdjunto(adjunto: AdjuntoOrdenCompra) {
  return adjunto.contentType === "application/pdf";
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

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 KB";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function fieldClass(error?: string) {
  return `${inputClass} ${error ? "border-destructive focus:ring-destructive/30" : ""}`;
}

const inputClass =
  "w-full rounded-md border border-ink/10 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-press/40";
