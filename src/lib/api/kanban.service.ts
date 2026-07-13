import {
  estadoToFase,
  type ClienteResumen,
  type CotizacionSnapshot,
  type OrdenTrabajoEstado,
  type WorkOrder,
} from "@/components/kanban/types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

function normalizeCliente(cliente?: Partial<ClienteResumen>): ClienteResumen {
  return {
    tipoDocumento: cliente?.tipoDocumento ?? "DNI",
    numeroDocumento: cliente?.numeroDocumento ?? "",
    nombre: cliente?.nombre ?? "Cliente sin nombre",
    telefono: cliente?.telefono,
    correo: cliente?.correo,
  };
}

function normalizeCotizacion(cotizacion?: Partial<CotizacionSnapshot>): CotizacionSnapshot {
  return {
    codigo: cotizacion?.codigo ?? "",
    origen: cotizacion?.origen ?? "WEB",
    tipoImpresion: cotizacion?.tipoImpresion ?? "OFFSET",
    categoriaProducto: cotizacion?.categoriaProducto ?? "",
    tipoProducto: cotizacion?.tipoProducto ?? "Producto sin nombre",
    tamano: cotizacion?.tamano ?? "",
    cantidad: Number(cotizacion?.cantidad ?? 0),
    unidadMedida: cotizacion?.unidadMedida ?? "unidades",
    papel: {
      nombre: cotizacion?.papel?.nombre ?? "Papel no especificado",
      gramaje: cotizacion?.papel?.gramaje,
      medida: cotizacion?.papel?.medida,
      tipoPapel: cotizacion?.papel?.tipoPapel,
    },
    colores: {
      numero: Number(cotizacion?.colores?.numero ?? 0),
      costoPlacas: Number(cotizacion?.colores?.costoPlacas ?? 0),
      tarifaImpresionMillar: Number(cotizacion?.colores?.tarifaImpresionMillar ?? 0),
    },
    acabados: cotizacion?.acabados ?? [],
    costos: {
      diseno: Number(cotizacion?.costos?.diseno ?? 0),
      placas: Number(cotizacion?.costos?.placas ?? 0),
      precioMaterialMillar: Number(cotizacion?.costos?.precioMaterialMillar ?? 0),
      costoMaterial: Number(cotizacion?.costos?.costoMaterial ?? 0),
      depreciacion: Number(cotizacion?.costos?.depreciacion ?? 0),
      impresion: Number(cotizacion?.costos?.impresion ?? 0),
      tinta: Number(cotizacion?.costos?.tinta ?? 0),
      acabados: Number(cotizacion?.costos?.acabados ?? 0),
      manoObra: Number(cotizacion?.costos?.manoObra ?? 0),
    },
    subtotal: Number(cotizacion?.subtotal ?? 0),
    porcentajeMargen: Number(cotizacion?.porcentajeMargen ?? 0),
    montoMargen: Number(cotizacion?.montoMargen ?? 0),
    baseImponible: Number(cotizacion?.baseImponible ?? 0),
    porcentajeIgv: Number(cotizacion?.porcentajeIgv ?? 0),
    montoIgv: Number(cotizacion?.montoIgv ?? 0),
    total: Number(cotizacion?.total ?? 0),
    observaciones: cotizacion?.observaciones,
  };
}

function normalizeWorkOrder(order: WorkOrder): WorkOrder {
  const raw = order as Partial<WorkOrder>;
  const estado = raw.estado ?? "PRE_PRENSA";
  const cotizacion = normalizeCotizacion(raw.cotizacion);
  const fase = raw.fase ?? estadoToFase(estado) ?? "pre-prensa";

  return {
    ...order,
    id: String(raw.id ?? ""),
    codigo: raw.codigo ?? "",
    estado,
    fase,
    cliente: normalizeCliente(raw.cliente),
    cotizacion,
    montoTotal: Number(raw.montoTotal ?? cotizacion.total ?? 0),
    totalPagado: Number(raw.totalPagado ?? 0),
    saldoPendiente: Number(raw.saldoPendiente ?? 0),
    fechaCreacion: raw.fechaCreacion ?? "",
    fechaEstimadaEntrega: raw.fechaEstimadaEntrega,
    fechaEntregaReal: raw.fechaEntregaReal,
    observaciones: raw.observaciones,
    numeroReprocesos: Number(raw.numeroReprocesos ?? 0),
    etiquetaEstado: raw.etiquetaEstado,
    etiquetaVariant: raw.etiquetaVariant,
    prioridad: raw.prioridad,
    vencida: Boolean(raw.vencida),
    historialEstados: raw.historialEstados ?? [],
    aprobacionesDiseno: raw.aprobacionesDiseno ?? [],
    controlesCalidad: raw.controlesCalidad ?? [],
    operacionesMaquina: raw.operacionesMaquina ?? [],
    entregas: raw.entregas ?? [],
    pagos: raw.pagos ?? [],
    maquinaActual: raw.maquinaActual,
    progresoDiseno: raw.progresoDiseno,
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || body.message || `Error HTTP ${response.status}`);
  }
  return response.json();
}

async function requestForm<T>(path: string, form: FormData): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || body.message || `Error HTTP ${response.status}`);
  }
  return response.json();
}

export const kanbanService = {
  listarOrdenes: async () => (await request<WorkOrder[]>("/kanban/ordenes")).map(normalizeWorkOrder),
  cambiarEstado: async (id: string, nuevoEstado: OrdenTrabajoEstado, observaciones?: string) =>
    normalizeWorkOrder(await request<WorkOrder>(`/kanban/ordenes/${id}/estado`, {
      method: "PATCH", body: JSON.stringify({ nuevoEstado, observaciones }),
    })),
  registrarEntrega: async (id: string, cantidadEntregada: number, observaciones?: string) =>
    normalizeWorkOrder(await request<WorkOrder>(`/kanban/ordenes/${id}/entregas`, {
      method: "POST", body: JSON.stringify({ cantidadEntregada, observaciones }),
    })),
  registrarAprobacion: async (id: string, aprobadoPor?: string, observaciones?: string) =>
    normalizeWorkOrder(await request<WorkOrder>(`/kanban/ordenes/${id}/aprobacion-diseno`, {
      method: "POST", body: JSON.stringify({ aprobadoPor, observaciones }),
    })),
  registrarControl: async (id: string, resultado: "APROBADO" | "OBSERVADO", cantidadVerificada?: number, observaciones?: string) =>
    normalizeWorkOrder(await request<WorkOrder>(`/kanban/ordenes/${id}/control-calidad`, {
      method: "POST", body: JSON.stringify({ resultado, cantidadVerificada, observaciones }),
    })),
  registrarObservacion: async (id: string, observaciones: string) =>
    normalizeWorkOrder(await request<WorkOrder>(`/kanban/ordenes/${id}/observaciones`, {
      method: "POST", body: JSON.stringify({ observaciones }),
    })),
  enviarFeedbackCliente: async (id: string, mensaje: string, adjunto?: File | null) => {
    const form = new FormData();
    form.append("mensaje", mensaje);
    if (adjunto) form.append("adjunto", adjunto);
    return normalizeWorkOrder(await requestForm<WorkOrder>(`/kanban/ordenes/${id}/feedback-cliente`, form));
  },
};
