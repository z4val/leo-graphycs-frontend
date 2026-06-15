const API_URL = "http://localhost:8080";

// Tipo que devuelve el backend
interface OrdenBackend {
  idOrdenTrabajo: number;
  codigo: string;
  estado: string;
  montoTotal: number;
  numeroReprocesos: number;
  fechaCreacion: string;
  fechaEstimadaEntrega?: string;
  fechaEntregaReal?: string;
  observaciones?: string;
  cotizacion?: {
    cliente?: {
      nombreCompleto?: string;
      tipoDocumento?: string;
      numeroDocumento?: string;
      correo?: string;
    };
  };
}

// Convierte la respuesta del backend al formato que espera el frontend
function toWorkOrder(orden: OrdenBackend) {
  const hoy = new Date().toISOString().split("T")[0];
  const vencida = orden.fechaEstimadaEntrega
    ? orden.fechaEstimadaEntrega < hoy && orden.estado !== "ENTREGADO"
    : false;

  const cliente = orden.cotizacion?.cliente;

  return {
    id: String(orden.idOrdenTrabajo),
    codigo: orden.codigo,
    estado: orden.estado,
    fase: estadoToFase(orden.estado),
    cliente: {
      tipoDocumento: cliente?.tipoDocumento ?? "DNI",
      numeroDocumento: cliente?.numeroDocumento ?? "",
      nombre: cliente?.nombreCompleto ?? "Sin cliente",
      correo: cliente?.correo,
    },
    cotizacion: {
        codigo: "",
        origen: "PRESENCIAL" as const,
        tipoImpresion: "OFFSET" as const,
        categoriaProducto: "",
        tipoProducto: "",
        tamano: "",
        cantidad: 0,
        unidadMedida: "MILLAR",
        papel: { nombre: "" },
        colores: { numero: 0, costoPlacas: 0, tarifaImpresionMillar: 0 },
        acabados: [],
        costos: {
            diseno: 0, placas: 0, precioMaterialMillar: 0,
            costoMaterial: 0, depreciacion: 0, impresion: 0,
            tinta: 0, acabados: 0, manoObra: 0
        },
        subtotal: 0,
        porcentajeMargen: 0,
        montoMargen: 0,
        baseImponible: 0,
        porcentajeIgv: 0,
        montoIgv: 0,
        total: Number(orden.montoTotal ?? 0),
    },
    montoTotal: orden.montoTotal,
    totalPagado: 0,
    saldoPendiente: orden.montoTotal,
    fechaCreacion: orden.fechaCreacion,
    fechaEstimadaEntrega: orden.fechaEstimadaEntrega,
    fechaEntregaReal: orden.fechaEntregaReal,
    observaciones: orden.observaciones,
    numeroReprocesos: orden.numeroReprocesos,
    etiquetaEstado: orden.estado.replace("_", " "),
    etiquetaVariant: "neutral",
    prioridad: "media",
    vencida,
    historialEstados: [],
    aprobacionesDiseno: [],
    controlesCalidad: [],
    operacionesMaquina: [],
    entregas: [],
    pagos: [],
  };
}

function estadoToFase(estado: string) {
  switch (estado) {
    case "PRE_PRENSA": return "pre-prensa";
    case "PRENSA": return "prensa";
    case "POST_PRENSA": return "post-prensa";
    default: return null;
  }
}

export const kanbanService = {
  // Obtener todas las órdenes
  async listarOrdenes() {
    const res = await fetch(`${API_URL}/api/kanban/ordenes`);
    const data: OrdenBackend[] = await res.json();
    return data
      .map(toWorkOrder)
      .filter((o) => o.fase !== null); // solo muestra las activas
  },

  // Cambiar estado de una orden
  async cambiarEstado(idOrden: number, nuevoEstado: string, idUsuario: number, observaciones?: string) {
    const res = await fetch(`${API_URL}/api/kanban/ordenes/${idOrden}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nuevoEstado, idUsuario, observaciones }),
    });
    return res.json();
  },
};