const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface Cliente {
  idCliente: number;
  tipoDocumento: "RUC" | "DNI";
  numeroDocumento: string;
  razonSocial?: string | null;
  nombreRepresentante?: string | null;
  nombreCompleto?: string | null;
  direccion?: string | null;
  telefonoFijo?: string | null;
  telefonoCelular?: string | null;
  correo?: string | null;
  fechaRegistro?: string | null;
  activo: boolean;
}

export interface TipoProducto {
  idTipoProducto: number;
  nombre: string;
  categoria: string;
  descripcion?: string | null;
}

export type OrigenCotizacion = "PRESENCIAL" | "WEB" | "TELEGRAM" | "CHATWOOT";
export type TipoImpresion = "OFFSET" | "DIGITAL";

export interface PapelCotizacion {
  idInsumo: number;
  nombre: string;
  descripcion?: string | null;
  precioVentaMillar: number;
  stockActual: number;
}

export interface AcabadoCotizacion {
  idAcabado: number;
  nombre: string;
  precioVentaMillar: number;
}

export interface TarifaColorCotizacion {
  idTarifaColor: number;
  numeroColores: number;
  costoPlacas: number;
  tarifaImpresionMillar: number;
}

export interface CatalogoCotizacion {
  tiposProducto: TipoProducto[];
  papeles: PapelCotizacion[];
  acabados: AcabadoCotizacion[];
  tarifasColor: TarifaColorCotizacion[];
  parametros: Record<string, number>;
}

export interface CosteoOverrides {
  costoPlacas?: number;
  precioMaterialMillar?: number;
  tarifaDepreciacionMillar?: number;
  tarifaImpresionMillar?: number;
  tarifaTintaMillar?: number;
  tarifaManoObraMillar?: number;
  porcentajeMargen?: number;
  porcentajeIgv?: number;
  acabados?: Array<{ idAcabado: number; precioVentaMillar: number }>;
}

export interface CosteoRequest {
  idTipoProducto: number;
  idInsumoPapel: number;
  idTarifaColor: number;
  idAcabados: number[];
  cantidad: number;
  costoDiseno: number;
  tipoImpresion: TipoImpresion;
  descripcion?: string;
  ajustes?: CosteoOverrides;
}

export interface CosteoDesglose {
  costoDiseno: number;
  costoPlacas: number;
  costoMaterial: number;
  costoDepreciacion: number;
  costoImpresion: number;
  costoTinta: number;
  costoAcabados: number;
  costoManoObra: number;
}

export interface LineaCalculo {
  componente: string;
  tipo: "FIJO" | "POR_MILLAR" | "PORCENTAJE" | "RESUMEN";
  formula: string;
  peso: number | null;
  cantidad: number | null;
  monto: number;
  editable: boolean;
}

export interface TarifasAplicadas {
  costoDiseno: number;
  costoPlacas: number;
  precioMaterialMillar: number;
  tarifaDepreciacionMillar: number;
  tarifaImpresionMillar: number;
  tarifaTintaMillar: number;
  tarifaManoObraMillar: number;
  porcentajeMargen: number;
  porcentajeIgv: number;
}

export interface DetalleCalculo {
  lineas: LineaCalculo[];
  tarifas: TarifasAplicadas;
}

export interface CosteoResponse {
  idTipoProducto: number;
  tipoProductoNombre: string;
  idInsumoPapel: number;
  papelNombre: string;
  idTarifaColor: number;
  numeroColores: number;
  tipoImpresion: TipoImpresion;
  cantidad: number;
  subtotal: number;
  porcentajeMargen: number;
  montoMargen: number;
  baseImponible: number;
  porcentajeIgv: number;
  montoIgv: number;
  total: number;
  desglose: CosteoDesglose;
  detalleCalculo: DetalleCalculo;
  acabados: Array<{ idAcabado: number; nombre: string; precioVentaMillar: number }>;
}

export interface Cotizacion {
  idCotizacion: number;
  codigo: string;
  idCliente: number;
  clienteNombre: string;
  tipoTrabajo: string;
  descripcion?: string | null;
  cantidad: number;
  fechaCompromiso?: string | null;
  montoTotal: number;
  estado: "BORRADOR" | "ENVIADA" | "APROBADA" | "RECHAZADA" | "CONVERTIDA";
  idUsuarioCreador: number;
  creadorNombre: string;
  idUsuarioAprobador?: number | null;
  aprobadorNombre?: string | null;
  fechaCreacion: string;
  fechaAprobacion?: string | null;
  observaciones?: string | null;
  origen?: OrigenCotizacion;
  idTipoProducto?: number | null;
  tipoProductoNombre?: string | null;
  idInsumoPapel?: number | null;
  papelNombre?: string | null;
  idTarifaColor?: number | null;
  numeroColores?: number | null;
  tipoImpresion?: TipoImpresion | null;
  subtotal?: number | null;
  porcentajeMargen?: number | null;
  montoMargen?: number | null;
  baseImponible?: number | null;
  porcentajeIgv?: number | null;
  montoIgv?: number | null;
  desglose?: CosteoDesglose | null;
  detalleCalculo?: DetalleCalculo | null;
  acabados?: Array<{ idAcabado: number; nombre: string; precioAplicadoMillar: number }>;
}

export interface CreateClienteRequest {
  tipoDocumento: "RUC" | "DNI";
  numeroDocumento: string;
  razonSocial?: string;
  nombreRepresentante?: string;
  nombreCompleto?: string;
  direccion?: string;
  telefonoFijo?: string;
  telefonoCelular?: string;
  correo?: string;
}

export interface ClienteCotizacionResumen {
  idCotizacion: number;
  codigo: string;
  estado: string;
  origen: OrigenCotizacion;
  descripcion?: string | null;
  cantidad: number;
  montoTotal: number;
  fechaCreacion: string;
  fechaCompromiso?: string | null;
}

export interface ClienteOrdenResumen {
  idOrdenTrabajo: number;
  codigo: string;
  estado: string;
  montoTotal: number;
  fechaCreacion: string;
  fechaEstimadaEntrega?: string | null;
  fechaEntregaReal?: string | null;
  numeroReprocesos: number;
}

export interface ClienteDetalle {
  cliente: Cliente;
  cotizaciones: ClienteCotizacionResumen[];
  ordenes: ClienteOrdenResumen[];
}

export interface CreateCotizacionRequest {
  idCliente: number;
  idTipoProducto?: number;
  idInsumoPapel?: number;
  idTarifaColor?: number;
  idAcabados?: number[];
  costoDiseno?: number;
  tipoImpresion?: TipoImpresion;
  tipoTrabajo?: string;
  descripcion?: string;
  cantidad: number;
  fechaCompromiso?: string;
  montoTotal?: number;
  observaciones?: string;
  origen?: "PRESENCIAL" | "WEB";
  ajustes?: CosteoOverrides;
}

const storage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
  },
};

async function request<T>(path: string, method: HttpMethod = "GET", body?: unknown): Promise<T> {
  const token = storage.getItem("token");
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Error HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const quoteService = {
  getTiposProducto: () => request<TipoProducto[]>("/tipo-productos"),
  getClientes: () => request<Cliente[]>("/clientes"),
  getClienteDetalle: (id: number) => request<ClienteDetalle>(`/clientes/${id}`),
  createCliente: (payload: CreateClienteRequest) => request<Cliente>("/clientes", "POST", payload),
  updateCliente: (id: number, payload: CreateClienteRequest) =>
    request<Cliente>(`/clientes/${id}`, "PUT", payload),
  deleteCliente: (id: number) => request<void>(`/clientes/${id}`, "DELETE"),

  getCatalogoCotizacion: () => request<CatalogoCotizacion>("/catalogo/cotizacion"),
  calcularCotizacion: (payload: CosteoRequest) =>
    request<CosteoResponse>("/cotizaciones/calcular", "POST", payload),

  getCotizaciones: () => request<Cotizacion[]>("/cotizaciones"),
  getCotizacionDetalle: (id: number) => request<Cotizacion>(`/cotizaciones/${id}`),
  createCotizacion: (payload: CreateCotizacionRequest) =>
    request<Cotizacion>("/cotizaciones", "POST", payload),
  updateCotizacionEstado: (id: number, estado: string) =>
    request<Cotizacion>(`/cotizaciones/${id}/estado`, "PUT", { estado }),
  aprobarCotizacion: (id: number) => request<Cotizacion>(`/cotizaciones/${id}/aprobar`, "POST"),
};
