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

export interface CreateCotizacionRequest {
  idCliente: number;
  tipoTrabajo: string;
  descripcion?: string;
  cantidad: number;
  fechaCompromiso?: string;
  montoTotal: number;
  observaciones?: string;
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

  return response.json();
}

export const quoteService = {
  getTiposProducto: () => request<TipoProducto[]>("/tipo-productos"),
  getClientes: () => request<Cliente[]>("/clientes"),
  createCliente: (payload: CreateClienteRequest) => request<Cliente>("/clientes", "POST", payload),

  getCotizaciones: () => request<Cotizacion[]>("/cotizaciones"),
  createCotizacion: (payload: CreateCotizacionRequest) =>
    request<Cotizacion>("/cotizaciones", "POST", payload),
  updateCotizacionEstado: (id: number, estado: string) =>
    request<Cotizacion>(`/cotizaciones/${id}/estado`, "PUT", { estado }),
  aprobarCotizacion: (id: number) =>
    request<Cotizacion>(`/cotizaciones/${id}/aprobar`, "POST"),
};
