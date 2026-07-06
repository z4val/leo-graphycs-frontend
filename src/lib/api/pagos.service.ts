import type { Pago, WorkOrder } from "@/components/kanban/types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
export interface MedioPago { idMedioPago: number; nombre: string }
export interface CobrosResumen {
  montoFacturado: number; totalCobrado: number; saldoPendiente: number; ordenes: WorkOrder[];
}
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || body.message || `Error HTTP ${response.status}`);
  }
  return response.json();
}
export const pagosService = {
  medios: () => request<MedioPago[]>("/medios-pago"),
  resumen: () => request<CobrosResumen>("/cobros/resumen"),
  registrar: (id: string, idMedioPago: number, monto: number, observaciones?: string) =>
    request<Pago>(`/ordenes/${id}/pagos`, { method: "POST", body: JSON.stringify({ idMedioPago, monto, observaciones }) }),
};
