const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type TipoInsumo = "PAPEL" | "TINTA" | "SOLUCION_FUENTE";
export type UnidadMedidaInsumo = "MILLAR" | "KILO" | "LITRO";
export type EstadoOrdenCompra = "PENDIENTE" | "RECIBIDA" | "ANULADA";
export type TipoMovimientoInventario = "ENTRADA" | "SALIDA";

export interface Insumo {
  idInsumo: number;
  tipoInsumo: TipoInsumo;
  nombre: string;
  unidadMedida: UnidadMedidaInsumo;
  gramaje?: number | null;
  medida?: string | null;
  tipoPapel?: string | null;
  color?: string | null;
  precioVentaMillar?: number | null;
  stockMinimo: number;
  stockActual: number;
  activo: boolean;
}

export interface Proveedor {
  idProveedor: number;
  ruc: string;
  razonSocial: string;
  nombreRepresentante?: string | null;
  direccion?: string | null;
  telefonoFijo?: string | null;
  telefonoCelular?: string | null;
  correo?: string | null;
  activo: boolean;
}

export interface DetalleOrdenCompra {
  idDetalleOrdenCompra?: number;
  insumo?: Insumo;
  idInsumo?: number;
  cantidad: number;
  precioUnitario: number;
  subtotal?: number;
}

export interface OrdenCompra {
  idOrdenCompra: number;
  codigo: string;
  proveedor: Proveedor;
  fechaEmision: string;
  fechaRecepcion?: string | null;
  estado: EstadoOrdenCompra;
  total: number;
  observaciones?: string | null;
  detalles?: DetalleOrdenCompra[];
}

export interface Lote {
  idLote: number;
  insumo: Insumo;
  ordenCompra?: OrdenCompra | null;
  numeroLote?: string | null;
  cantidadIngresada: number;
  cantidadDisponible: number;
  costoUnitario: number;
  fechaIngreso: string;
  activo: boolean;
}

export interface MovimientoInventario {
  idMovimiento: number;
  insumo: Insumo;
  lote?: Lote | null;
  tipoMovimiento: TipoMovimientoInventario;
  cantidad: number;
  costoUnitario: number;
  costoTotal: number;
  saldoCantidad: number;
  saldoValor: number;
  fecha: string;
  idOrdenTrabajo?: number | null;
  observaciones?: string | null;
}

export interface AdjuntoOrdenCompra {
  idAdjunto: number;
  nombreArchivo: string;
  contentType: string;
  tamanoBytes: number;
  storageKey: string;
  storageUrl?: string | null;
  fechaSubida: string;
}

export interface CreateInsumoRequest {
  tipoInsumo: TipoInsumo;
  nombre: string;
  unidadMedida: UnidadMedidaInsumo;
  gramaje?: number | null;
  medida?: string | null;
  tipoPapel?: string | null;
  color?: string | null;
  precioVentaMillar?: number | null;
  stockMinimo: number;
}

export interface CreateProveedorRequest {
  ruc: string;
  razonSocial: string;
  nombreRepresentante?: string;
  direccion?: string;
  telefonoFijo?: string;
  telefonoCelular?: string;
  correo?: string;
}

export interface CreateOrdenCompraRequest {
  codigo?: string;
  idProveedor: number;
  observaciones?: string;
  detalles: Array<{
    idInsumo: number;
    cantidad: number;
    precioUnitario: number;
  }>;
}

export interface RegistrarSalidaRequest {
  idInsumo: number;
  cantidad: number;
  idOrdenTrabajo?: number | null;
  observaciones?: string;
}

export interface KardexFilters {
  idInsumo?: number | null;
  idOrdenTrabajo?: number | null;
  fechaDesde?: string;
  fechaHasta?: string;
}

const storage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
  },
};

async function request<T>(paths: string[], method: HttpMethod = "GET", body?: unknown): Promise<T> {
  const token = storage.getItem("token");
  let lastError: Error | null = null;

  for (const path of paths) {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      if (response.status === 404 && paths.length > 1) {
        lastError = new Error(`No existe el endpoint ${path}`);
        continue;
      }

      if (!response.ok) {
        const error = await readError(response);
        throw new Error(error);
      }

      if (response.status === 204) return undefined as T;

      const data = await response.json();
      return unwrap<T>(data);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Error de red");
      if (paths.length === 1) break;
    }
  }

  throw lastError ?? new Error("No se pudo completar la solicitud");
}

async function readError(response: Response) {
  try {
    const data = await response.json();
    return data.error || data.message || `Error HTTP ${response.status}`;
  } catch {
    return `Error HTTP ${response.status}`;
  }
}

async function requestBlob(
  paths: string[],
  params?: Record<string, string | number | null | undefined>,
) {
  const token = storage.getItem("token");
  let lastError: Error | null = null;
  const query = toQuery(params);

  for (const path of paths) {
    try {
      const response = await fetch(`${API_BASE}${path}${query}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.status === 404 && paths.length > 1) {
        lastError = new Error(`No existe el endpoint ${path}`);
        continue;
      }

      if (!response.ok) {
        const error = await readError(response);
        throw new Error(error);
      }

      return response.blob();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Error de red");
      if (paths.length === 1) break;
    }
  }

  throw lastError ?? new Error("No se pudo completar la descarga");
}

async function requestMultipart<T>(paths: string[], formData: FormData): Promise<T> {
  const token = storage.getItem("token");
  let lastError: Error | null = null;

  for (const path of paths) {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (response.status === 404 && paths.length > 1) {
        lastError = new Error(`No existe el endpoint ${path}`);
        continue;
      }

      if (!response.ok) {
        const error = await readError(response);
        throw new Error(error);
      }

      return unwrap<T>(await response.json());
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Error de red");
      if (paths.length === 1) break;
    }
  }

  throw lastError ?? new Error("No se pudo completar la subida");
}

function unwrap<T>(data: unknown): T {
  if (data && typeof data === "object" && "data" in data) {
    return (data as { data: T }).data;
  }
  return data as T;
}

const paths = {
  insumos: ["/insumos", "/inventario/insumos"],
  proveedores: ["/proveedores", "/inventario/proveedores"],
  ordenesCompra: ["/ordenes-compra", "/orden-compra", "/inventario/ordenes-compra"],
  movimientos: ["/movimientos-inventario", "/inventario/movimientos", "/inventario/kardex"],
  lotes: ["/lotes", "/inventario/lotes"],
};

function toQuery(params?: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const inventoryService = {
  getInsumos: () => request<Insumo[]>(paths.insumos),
  createInsumo: (payload: CreateInsumoRequest) => request<Insumo>(paths.insumos, "POST", payload),
  updateInsumo: (id: number, payload: Partial<CreateInsumoRequest>) =>
    request<Insumo>(
      paths.insumos.map((path) => `${path}/${id}`),
      "PUT",
      payload,
    ),

  getProveedores: () => request<Proveedor[]>(paths.proveedores),
  createProveedor: (payload: CreateProveedorRequest) =>
    request<Proveedor>(paths.proveedores, "POST", payload),

  getOrdenesCompra: () => request<OrdenCompra[]>(paths.ordenesCompra),
  createOrdenCompra: (payload: CreateOrdenCompraRequest) =>
    request<OrdenCompra>(paths.ordenesCompra, "POST", payload),
  recibirOrdenCompra: (id: number) =>
    request<OrdenCompra>(
      paths.ordenesCompra.flatMap((path) => [`${path}/${id}/recibir`, `${path}/${id}/recepcionar`]),
      "POST",
    ),

  getMovimientos: (filters?: KardexFilters) =>
    request<MovimientoInventario[]>(paths.movimientos.map((path) => `${path}${toQuery(filters ? { ...filters } : undefined)}`)),
  exportKardexXlsx: async (filters?: KardexFilters) => {
    const blob = await requestBlob(
      paths.movimientos.map((path) => `${path}/export`),
      filters ? { ...filters } : undefined,
    );
    downloadBlob(blob, `kardex_${new Date().toISOString().slice(0, 10)}.xlsx`);
  },
  registrarSalida: (payload: RegistrarSalidaRequest) =>
    request<MovimientoInventario | MovimientoInventario[]>(
      paths.movimientos.flatMap((path) => [`${path}/salida`, `${path}/salidas`]),
      "POST",
      payload,
    ),
  revertirSalida: (idMovimiento: number, motivo?: string) =>
    request<MovimientoInventario>(
      paths.movimientos.map((path) => `${path}/${idMovimiento}/revertir`),
      "POST",
      { motivo },
    ),

  getLotes: () => request<Lote[]>(paths.lotes),

  uploadOrdenCompraAdjunto: (id: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return requestMultipart<AdjuntoOrdenCompra>(
      paths.ordenesCompra.map((path) => `${path}/${id}/adjuntos`),
      formData,
    );
  },
  getOrdenCompraAdjuntos: (id: number) =>
    request<AdjuntoOrdenCompra[]>(paths.ordenesCompra.map((path) => `${path}/${id}/adjuntos`)),
};
