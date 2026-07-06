import type { WorkOrder, OrdenTrabajoEstado } from "@/components/kanban/types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

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

export const kanbanService = {
  listarOrdenes: () => request<WorkOrder[]>("/kanban/ordenes"),
  cambiarEstado: (id: string, nuevoEstado: OrdenTrabajoEstado, observaciones?: string) =>
    request<WorkOrder>(`/kanban/ordenes/${id}/estado`, {
      method: "PATCH", body: JSON.stringify({ nuevoEstado, observaciones }),
    }),
  registrarEntrega: (id: string, cantidadEntregada: number, observaciones?: string) =>
    request<WorkOrder>(`/kanban/ordenes/${id}/entregas`, {
      method: "POST", body: JSON.stringify({ cantidadEntregada, observaciones }),
    }),
  registrarAprobacion: (id: string, aprobadoPor?: string, observaciones?: string) =>
    request<WorkOrder>(`/kanban/ordenes/${id}/aprobacion-diseno`, {
      method: "POST", body: JSON.stringify({ aprobadoPor, observaciones }),
    }),
  registrarControl: (id: string, resultado: "APROBADO" | "OBSERVADO", cantidadVerificada?: number, observaciones?: string) =>
    request<WorkOrder>(`/kanban/ordenes/${id}/control-calidad`, {
      method: "POST", body: JSON.stringify({ resultado, cantidadVerificada, observaciones }),
    }),
};
