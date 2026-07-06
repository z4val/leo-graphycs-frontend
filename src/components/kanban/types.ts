import type { LucideIcon } from "lucide-react";
import { Clock, Printer, Scissors } from "lucide-react";

/** Estados persistidos en orden_trabajo.estado (SQL). */
export type OrdenTrabajoEstado =
  | "PRE_PRENSA"
  | "PRENSA"
  | "POST_PRENSA"
  | "ENTREGADO"
  | "ANULADO";

/** Columnas visibles del tablero Kanban (spec §6.1). */
export type KanbanPhase = "pre-prensa" | "prensa" | "post-prensa";

export type OrderPriority = "baja" | "media" | "alta";

export type EstadoEtiquetaVariant =
  | "cyan"
  | "magenta"
  | "yellow"
  | "emerald"
  | "destructive"
  | "neutral";

export interface ClienteResumen {
  tipoDocumento: "RUC" | "DNI";
  numeroDocumento: string;
  nombre: string;
  telefono?: string;
  correo?: string;
}

/** Snapshot de cotización al convertirse en orden (tabla cotizacion + relaciones). */
export interface CotizacionSnapshot {
  codigo: string;
  origen: "PRESENCIAL" | "WEB" | "TELEGRAM" | "CHATWOOT";
  tipoImpresion: "OFFSET" | "DIGITAL";
  categoriaProducto: string;
  tipoProducto: string;
  tamano: string;
  cantidad: number;
  unidadMedida: string;
  papel: {
    nombre: string;
    gramaje?: number;
    medida?: string;
    tipoPapel?: string;
  };
  colores: {
    numero: number;
    costoPlacas: number;
    tarifaImpresionMillar: number;
  };
  acabados: { nombre: string; precioMillar: number }[];
  costos: {
    diseno: number;
    placas: number;
    precioMaterialMillar: number;
    costoMaterial: number;
    depreciacion: number;
    impresion: number;
    tinta: number;
    acabados: number;
    manoObra: number;
  };
  subtotal: number;
  porcentajeMargen: number;
  montoMargen: number;
  baseImponible: number;
  porcentajeIgv: number;
  montoIgv: number;
  total: number;
  observaciones?: string;
}

export interface HistorialEstado {
  estadoAnterior: OrdenTrabajoEstado | null;
  estadoNuevo: OrdenTrabajoEstado;
  fecha: string;
  usuario: string;
  observaciones?: string;
}

export interface AprobacionDiseno {
  fecha: string;
  aprobadoPor?: string;
  usuarioRegistra: string;
  observaciones?: string;
}

export interface ControlCalidad {
  resultado: "APROBADO" | "OBSERVADO";
  cantidadVerificada?: number;
  observaciones?: string;
  fecha: string;
  usuario: string;
}

export interface OperacionMaquina {
  maquina: string;
  tipo: string;
  fechaInicio: string;
  fechaFin?: string;
  usuario?: string;
  observaciones?: string;
}

export interface Entrega {
  fecha: string;
  cantidadEntregada: number;
  usuario: string;
  observaciones?: string;
}

export interface Pago {
  fecha: string;
  monto: number;
  medioPago: string;
  usuario: string;
  observaciones?: string;
}

export interface WorkOrder {
  id: string;
  codigo: string;
  estado: OrdenTrabajoEstado;
  /** Columna del tablero; derivado de estado para las tres etapas operativas. */
  fase: KanbanPhase;
  cliente: ClienteResumen;
  cotizacion: CotizacionSnapshot;
  montoTotal: number;
  totalPagado: number;
  saldoPendiente: number;
  fechaCreacion: string;
  fechaEstimadaEntrega?: string;
  fechaEntregaReal?: string;
  observaciones?: string;
  numeroReprocesos: number;
  /** Etiqueta operativa en la card (diseño, placas, en máquina, QC, etc.). */
  etiquetaEstado: string;
  etiquetaVariant: EstadoEtiquetaVariant;
  prioridad: OrderPriority;
  vencida?: boolean;
  historialEstados: HistorialEstado[];
  aprobacionesDiseno: AprobacionDiseno[];
  controlesCalidad: ControlCalidad[];
  operacionesMaquina: OperacionMaquina[];
  entregas: Entrega[];
  pagos: Pago[];
  maquinaActual?: string;
  progresoDiseno?: number;
}

export interface KanbanPhaseConfig {
  id: KanbanPhase;
  title: string;
  subtitle: string;
  accent: "cyan-press" | "magenta-press" | "yellow-press";
  headerBg: string;
  headerBorder: string;
  icon: LucideIcon;
}

export const KANBAN_PHASES: KanbanPhaseConfig[] = [
  {
    id: "pre-prensa",
    title: "Pre-prensa",
    subtitle: "Diseño y placas",
    accent: "cyan-press",
    headerBg: "bg-cyan-press/25",
    headerBorder: "border-cyan-press/40",
    icon: Clock,
  },
  {
    id: "prensa",
    title: "Prensa",
    subtitle: "Impresión offset",
    accent: "magenta-press",
    headerBg: "bg-magenta-press/25",
    headerBorder: "border-magenta-press/40",
    icon: Printer,
  },
  {
    id: "post-prensa",
    title: "Post-prensa",
    subtitle: "Acabados y control",
    accent: "yellow-press",
    headerBg: "bg-yellow-press/30",
    headerBorder: "border-yellow-press/50",
    icon: Scissors,
  },
];

export function estadoToFase(estado: OrdenTrabajoEstado): KanbanPhase | null {
  switch (estado) {
    case "PRE_PRENSA":
      return "pre-prensa";
    case "PRENSA":
      return "prensa";
    case "POST_PRENSA":
      return "post-prensa";
    default:
      return null;
  }
}

export function sumEntregas(entregas: Entrega[]): number {
  return entregas.reduce((s, e) => s + e.cantidadEntregada, 0);
}

export function sumPagos(pagos: Pago[]): number {
  return pagos.reduce((s, p) => s + p.monto, 0);
}