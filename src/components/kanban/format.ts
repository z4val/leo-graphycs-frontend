/** Formato de montos y etiquetas alineadas al modelo SQL. */

export function formatSoles(amount: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatCantidad(cantidad: number, unidad: string): string {
  const u = unidad.toLowerCase();
  const label = cantidad === 1 ? u.replace(/s$/, "") : u;
  return `${cantidad.toLocaleString("es-PE")} ${label}`;
}

const ESTADO_LABELS: Record<string, string> = {
  PRE_PRENSA: "Pre-prensa",
  PRENSA: "Prensa",
  POST_PRENSA: "Post-prensa",
  ENTREGADO: "Entregado",
  ANULADO: "Anulado",
};

export function labelEstadoOrden(estado: string): string {
  return ESTADO_LABELS[estado] ?? estado;
}

const ORIGEN_LABELS: Record<string, string> = {
  PRESENCIAL: "Presencial",
  WEB: "Web",
  TELEGRAM: "Telegram",
  CHATWOOT: "Telegram",
};

export function labelOrigen(origen: string): string {
  return ORIGEN_LABELS[origen] ?? origen;
}

export function labelColores(numero: number): string {
  if (numero === 4) return "Full color (4)";
  if (numero === 2) return "2 colores";
  return "1 color";
}
