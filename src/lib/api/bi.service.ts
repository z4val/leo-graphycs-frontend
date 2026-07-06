// Servicio del Módulo de Inteligencia de Negocios (BI).
// Consume el endpoint gerencial de resumen con datos REALES calculados por el
// backend a partir de las tablas transaccionales.
//
//   GET /api/bi/resumen?dias=30&origen=TODOS  ->  BiResumen
//
// Nota: los KPIs de cobranza (ingresos, saldos) y entregas no se incluyen aún
// porque no existen las tablas pago/entrega en el modelo. Se agregarán cuando
// esos módulos se implementen, sin romper este contrato.

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export type OrigenFiltro = "TODOS" | "PRESENCIAL" | "WEB" | "CHATWOOT";
export type RangoDias = 7 | 30 | 90;

export interface EmbudoItem {
  estado: "BORRADOR" | "ENVIADA" | "APROBADA" | "CONVERTIDA" | "RECHAZADA";
  cotizaciones: number;
  montoPotencial: number;
}

export interface TiempoEtapa {
  etapa: "PRE_PRENSA" | "PRENSA" | "POST_PRENSA";
  ordenes: number;
  horasPromedio: number;
}

export interface EfectividadCanal {
  origen: "PRESENCIAL" | "WEB" | "CHATWOOT";
  enviadas: number;
  ganadas: number;
  efectividadPct: number;
}

export interface RentabilidadOrden {
  codigo: string;
  precioVenta: number;
  costoEstimado: number;
  costoMaterialReal: number;
  margenBruto: number;
}

export interface AlertaStock {
  nombre: string;
  tipoInsumo: "PAPEL" | "TINTA" | "SOLUCION_FUENTE";
  unidadMedida: string;
  stockActual: number;
  stockMinimo: number;
  deficit: number;
}

export interface ValorInventario {
  nombre: string;
  tipoInsumo: "PAPEL" | "TINTA" | "SOLUCION_FUENTE";
  cantidadDisponible: number;
  valorInventario: number;
}

export interface BiResumen {
  cotizacionesTotales: number;
  tasaConversionPct: number;
  alertasStockTotal: number;
  tasaReprocesoPct: number;
  margenBrutoTotal: number;
  valorInventarioTotal: number;
  horasCotizacionPromedio: number | null;
  cotizacionesRespondidas: number;
  embudo: EmbudoItem[];
  tiemposProduccion: TiempoEtapa[];
  efectividadCanal: EfectividadCanal[];
  rentabilidad: RentabilidadOrden[];
  alertasStock: AlertaStock[];
  valorInventario: ValorInventario[];
}

const storage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
  },
};

export const biService = {
  /** Resumen del tablero para un rango de días y canal. Lanza error si el backend no responde. */
  async getResumen(dias: RangoDias = 30, origen: OrigenFiltro = "TODOS"): Promise<BiResumen> {
    const token = storage.getItem("token");
    const response = await fetch(`${API_BASE}/bi/resumen?dias=${dias}&origen=${origen}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Error HTTP ${response.status}`);
    }

    return response.json();
  },
};
