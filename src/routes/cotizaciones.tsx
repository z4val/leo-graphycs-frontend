import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { authService } from "@/lib/api/auth.service";
import { quoteService, type Cotizacion, type Cliente, type TipoProducto } from "@/lib/api/quote.service";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  IconPlus,
  IconSend,
  IconCircleCheck,
  IconCircleX,
  IconFileText,
  IconUserPlus,
  IconLoader,
  IconReload,
  IconCircleDot,
  IconUser,
  IconCalendar,
  IconCoin
} from "@tabler/icons-react";

export const Route = createFileRoute("/cotizaciones")({
  beforeLoad: () => {
    if (!authService.isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Cotizaciones — PREX ERP" },
      { name: "description", content: "Gestión y registro de cotizaciones a clientes." },
    ],
  }),
  component: CotizacionesPage,
});

const statusStyle: Record<Cotizacion["estado"], { label: string; classes: string }> = {
  BORRADOR: { label: "Borrador", classes: "bg-ink/10 text-ink/60" },
  ENVIADA: { label: "Enviada", classes: "bg-cyan-press/15 text-cyan-press" },
  APROBADA: { label: "Aprobada", classes: "bg-emerald-press/20 text-emerald-press" },
  RECHAZADA: { label: "Rechazada", classes: "bg-destructive/15 text-destructive" },
  CONVERTIDA: { label: "Convertida", classes: "bg-magenta-press/20 text-magenta-press font-semibold" },
};

export function CotizacionesPage() {
  const [quotes, setQuotes] = useState<Cotizacion[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [tiposProducto, setTiposProducto] = useState<TipoProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Cotizacion | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [quotesData, clientsData, tiposData] = await Promise.all([
        quoteService.getCotizaciones(),
        quoteService.getClientes(),
        quoteService.getTiposProducto(),
      ]);
      setQuotes(quotesData);
      setClients(clientsData);
      setTiposProducto(tiposData);

      // Si hay cotizaciones y ninguna seleccionada, seleccionar la primera
      if (quotesData.length > 0) {
        setSelectedQuote(quotesData[0]);
      } else {
        setSelectedQuote(null);
      }
    } catch (error) {
      toast.error("Error al cargar la información: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, nuevoEstado: string) => {
    try {
      const updated = await quoteService.updateCotizacionEstado(id, nuevoEstado);
      toast.success(`Cotización actualizada a ${nuevoEstado}`);
      
      // Actualizar listas
      setQuotes(prev => prev.map(q => q.idCotizacion === id ? updated : q));
      if (selectedQuote?.idCotizacion === id) {
        setSelectedQuote(updated);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado");
    }
  };

  const handleAprobarYConvertir = async (id: number) => {
    try {
      toast.info("Procesando aprobación y conversión a orden de trabajo...");
      const updated = await quoteService.aprobarCotizacion(id);
      toast.success("¡Cotización aprobada y convertida a Orden de Trabajo exitosamente!");
      
      // Actualizar listas
      setQuotes(prev => prev.map(q => q.idCotizacion === id ? updated : q));
      if (selectedQuote?.idCotizacion === id) {
        setSelectedQuote(updated);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al aprobar y convertir");
    }
  };

  // Cálculos de estadísticas dinámicas
  const totalMes = quotes.length;
  const aprobadas = quotes.filter(q => q.estado === "APROBADA" || q.estado === "CONVERTIDA").length;
  const tasaAprobacion = totalMes > 0 ? Math.round((aprobadas / totalMes) * 100) : 0;
  const pendientes = quotes.filter(q => q.estado === "BORRADOR" || q.estado === "ENVIADA").length;
  const valorCotizado = quotes.reduce((acc, q) => acc + q.montoTotal, 0);

  return (
    <AppShell
      title="Cotizaciones"
      action={
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="p-2 bg-ink/5 hover:bg-ink/10 text-ink rounded-lg transition-all"
            title="Recargar datos"
          >
            <IconReload size={16} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-1.5 bg-ink text-paper rounded-lg text-xs font-semibold uppercase tracking-widest hover:bg-ink/90 transition-all flex items-center gap-1.5 shadow-md"
          >
            <IconPlus size={14} /> Nueva cotización
          </button>
        </div>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Stat label="Total Registros" value={totalMes.toString()} accent="bg-cyan-press" />
        <Stat label="Tasa de aprobación" value={`${tasaAprobacion}%`} accent="bg-emerald-press" />
        <Stat label="Pendientes" value={pendientes.toString()} accent="bg-yellow-press" />
        <Stat label="Valor total cotizado" value={`S/ ${valorCotizado.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} accent="bg-magenta-press" />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <IconLoader size={36} className="animate-spin text-ink/30" />
          <p className="text-sm text-ink/50">Cargando cotizaciones...</p>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* List */}
          <div className="col-span-7 bg-white border border-ink/5 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-3 border-b border-ink/5 bg-ink/[0.01]">
              <h2 className="font-display font-bold text-sm uppercase tracking-widest text-ink/80">Historial</h2>
              <span className="text-[10px] font-mono text-ink/40 bg-ink/5 px-2 py-0.5 rounded-full">{quotes.length} registros</span>
            </div>
            
            {quotes.length === 0 ? (
              <div className="p-8 text-center text-ink/40 text-sm">
                No hay cotizaciones registradas en el sistema.
              </div>
            ) : (
              <ul className="divide-y divide-ink/5">
                {quotes.map((q) => (
                  <li
                    key={q.idCotizacion}
                    onClick={() => setSelectedQuote(q)}
                    className={
                      "flex items-center justify-between px-5 py-4 cursor-pointer transition-colors " +
                      (selectedQuote?.idCotizacion === q.idCotizacion
                        ? "bg-cyan-press/5 border-l-4 border-cyan-press pl-4"
                        : "hover:bg-ink/[0.01]")
                    }
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="text-[10px] font-mono text-ink/40 w-16 shrink-0">{q.codigo}</span>
                      <div className="min-w-0">
                        <p className="font-display font-bold text-sm truncate text-ink/80">{q.clienteNombre}</p>
                        <p className="text-xs text-ink/50 truncate font-semibold">{q.tipoTrabajo}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 shrink-0">
                      <span className="text-[10px] font-mono text-ink/40">
                        {q.fechaCompromiso ? new Date(q.fechaCompromiso).toLocaleDateString("es-PE", { day: "numeric", month: "short" }) : "N/A"}
                      </span>
                      <span className="font-mono font-bold text-sm text-ink/80">
                        S/ {q.montoTotal.toFixed(2)}
                      </span>
                      <span className={`text-[10px] px-2.5 py-1 rounded uppercase font-bold tracking-tighter w-24 text-center ${statusStyle[q.estado].classes}`}>
                        {statusStyle[q.estado].label}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Detail panel */}
          <aside className="col-span-5 bg-ink text-paper rounded-2xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[450px]">
            <div className="absolute top-[-20%] right-[-10%] size-64 bg-cyan-press/10 blur-[100px] rounded-full" />
            <div className="absolute bottom-[-30%] left-[-20%] size-72 bg-magenta-press/5 blur-[100px] rounded-full" />

            {selectedQuote ? (
              <div className="relative z-10 flex flex-col h-full justify-between flex-1">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-paper/40">
                      {selectedQuote.codigo} · {selectedQuote.clienteNombre}
                    </span>
                    <span className={`text-[10px] px-2.5 py-1 rounded uppercase font-bold tracking-tighter ${statusStyle[selectedQuote.estado].classes}`}>
                      {statusStyle[selectedQuote.estado].label}
                    </span>
                  </div>

                  <h2 className="font-display text-2xl font-bold tracking-tight mb-2 text-white">
                    {selectedQuote.tipoTrabajo}
                  </h2>
                  <p className="text-paper/70 text-sm mb-6 bg-paper/5 p-3 rounded-lg border border-paper/10 whitespace-pre-wrap">
                    {selectedQuote.descripcion || "Sin descripción detallada."}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <Spec label="Cantidad Referencial" value={`${selectedQuote.cantidad.toLocaleString()} u.`} icon={<IconCircleDot size={12} />} />
                    <Spec label="Fecha Compromiso" value={selectedQuote.fechaCompromiso ? new Date(selectedQuote.fechaCompromiso).toLocaleDateString() : "No definida"} icon={<IconCalendar size={12} />} />
                    <Spec label="Creado Por" value={selectedQuote.creadorNombre} icon={<IconUser size={12} />} />
                    <Spec label="Aprobado Por" value={selectedQuote.aprobadorNombre || "—"} icon={<IconUser size={12} />} />
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="border-t border-paper/10 pt-4 mb-6">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-paper/40 flex items-center gap-1">
                        <IconCoin size={12} /> Total Neto
                      </span>
                      <span className="font-display font-bold text-3xl text-white">
                        S/ {selectedQuote.montoTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {selectedQuote.observaciones && (
                      <p className="text-[11px] text-paper/50 mt-3 border-l-2 border-paper/20 pl-2 italic">
                        Nota: {selectedQuote.observaciones}
                      </p>
                    )}
                  </div>

                  {/* Botones de acción según el estado */}
                  <div className="flex gap-2">
                    {selectedQuote.estado === "BORRADOR" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(selectedQuote.idCotizacion, "ENVIADA")}
                          className="flex-1 py-2 bg-paper text-ink rounded-lg font-bold text-[11px] uppercase tracking-widest hover:bg-paper/90 transition-all flex items-center justify-center gap-1 shadow-sm"
                        >
                          <IconSend size={14} /> Enviar a cliente
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedQuote.idCotizacion, "RECHAZADA")}
                          className="py-2 px-3 border border-destructive/30 text-destructive hover:bg-destructive/10 rounded-lg font-bold text-[11px] uppercase tracking-widest transition-all"
                        >
                          Rechazar
                        </button>
                      </>
                    )}

                    {selectedQuote.estado === "ENVIADA" && (
                      <>
                        <button
                          onClick={() => handleAprobarYConvertir(selectedQuote.idCotizacion)}
                          className="flex-1 py-2 bg-emerald-press text-ink rounded-lg font-bold text-[11px] uppercase tracking-widest hover:bg-emerald-press/90 transition-all flex items-center justify-center gap-1 shadow-sm"
                        >
                          <IconCircleCheck size={14} /> Aprobar y Convertir
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedQuote.idCotizacion, "RECHAZADA")}
                          className="py-2 px-3 border border-paper/20 hover:bg-paper/10 text-paper rounded-lg font-bold text-[11px] uppercase tracking-widest transition-all"
                        >
                          Rechazar
                        </button>
                      </>
                    )}

                    {selectedQuote.estado === "RECHAZADA" && (
                      <button
                        onClick={() => handleUpdateStatus(selectedQuote.idCotizacion, "BORRADOR")}
                        className="w-full py-2 border border-paper/20 hover:bg-paper/10 text-paper rounded-lg font-bold text-[11px] uppercase tracking-widest transition-all"
                      >
                        Reabrir como Borrador
                      </button>
                    )}

                    {selectedQuote.estado === "APROBADA" && (
                      <button
                        onClick={() => handleAprobarYConvertir(selectedQuote.idCotizacion)}
                        className="w-full py-2 bg-emerald-press text-ink rounded-lg font-bold text-[11px] uppercase tracking-widest hover:bg-emerald-press/90 transition-all flex items-center justify-center gap-1"
                      >
                        <IconCircleCheck size={14} /> Convertir a Orden Trabajo
                      </button>
                    )}

                    {selectedQuote.estado === "CONVERTIDA" && (
                      <div className="w-full text-center py-2 bg-paper/5 border border-paper/10 rounded-lg text-xs text-paper/60 font-semibold flex items-center justify-center gap-1.5">
                        <IconCircleCheck size={14} className="text-emerald-press" /> Esta cotización ya es una Orden de Trabajo activa
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center relative z-10">
                <IconFileText size={48} className="text-paper/20 mb-3 animate-pulse" />
                <p className="text-paper/40 text-sm">Selecciona una cotización del historial para ver su desglose.</p>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Modal para Crear Cotización Manual */}
      {showCreateModal && (
        <CreateQuoteModal
          clients={clients}
          tiposProducto={tiposProducto}
          onClose={() => setShowCreateModal(false)}
          onCreated={async (newQuote) => {
            await loadData();
            setSelectedQuote(newQuote);
            setShowCreateModal(false);
          }}
        />
      )}
    </AppShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-white border border-ink/5 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden shadow-sm">
      <div className={`absolute top-0 left-0 h-0.5 w-12 ${accent}`} />
      <span className="text-[10px] font-mono uppercase tracking-widest text-ink/40">{label}</span>
      <span className="font-display text-2xl font-bold tracking-tight text-ink/85">{value}</span>
    </div>
  );
}

function Spec({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-paper/5 p-2.5 rounded-lg border border-paper/10">
      <dt className="text-[9px] font-mono uppercase tracking-widest text-paper/40 mb-1 flex items-center gap-1">
        {icon} {label}
      </dt>
      <dd className="font-medium text-white/90 text-xs truncate">{value}</dd>
    </div>
  );
}

// Modal de Creación
interface CreateQuoteModalProps {
  clients: Cliente[];
  tiposProducto: TipoProducto[];
  onClose: () => void;
  onCreated: (newQuote: Cotizacion) => void;
}

function CreateQuoteModal({ clients, tiposProducto, onClose, onCreated }: CreateQuoteModalProps) {
  const [idCliente, setIdCliente] = useState<string>("");
  const [tipoTrabajo, setTipoTrabajo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [fechaCompromiso, setFechaCompromiso] = useState("");
  const [montoTotal, setMontoTotal] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registro de nuevo cliente inline
  const [registerNewClient, setRegisterNewClient] = useState(false);
  const [newClientDocType, setNewClientDocType] = useState<"DNI" | "RUC">("DNI");
  const [newClientDocNum, setNewClientDocNum] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [isRegisteringClient, setIsRegisteringClient] = useState(false);

  const handleCreateClient = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newClientDocNum || !newClientName) {
      toast.error("Número de documento y Nombre Completo / Razón Social son obligatorios");
      return;
    }
    setIsRegisteringClient(true);
    try {
      const payload = {
        tipoDocumento: newClientDocType,
        numeroDocumento: newClientDocNum,
        nombreCompleto: newClientDocType === "DNI" ? newClientName : undefined,
        razonSocial: newClientDocType === "RUC" ? newClientName : undefined,
        direccion: newClientAddress || undefined,
        correo: newClientEmail || undefined,
        telefonoCelular: newClientPhone || undefined,
      };

      const created = await quoteService.createCliente(payload);
      toast.success("Cliente registrado con éxito");
      
      // Añadirlo a la lista local
      clients.push(created);
      setIdCliente(created.idCliente.toString());
      
      // Limpiar formulario de cliente
      setRegisterNewClient(false);
      setNewClientDocNum("");
      setNewClientName("");
      setNewClientAddress("");
      setNewClientEmail("");
      setNewClientPhone("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrar cliente");
    } finally {
      setIsRegisteringClient(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCliente) {
      toast.error("Debe seleccionar o registrar un cliente.");
      return;
    }
    const monto = parseFloat(montoTotal);
    if (isNaN(monto) || monto <= 0) {
      toast.error("El monto manual debe ser mayor a cero.");
      return;
    }
    const cant = parseFloat(cantidad);
    if (isNaN(cant) || cant <= 0) {
      toast.error("La cantidad debe ser mayor a cero.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        idCliente: parseInt(idCliente),
        tipoTrabajo,
        descripcion: descripcion || undefined,
        cantidad: cant,
        fechaCompromiso: fechaCompromiso || undefined,
        montoTotal: monto,
        observaciones: observaciones || undefined,
      };

      const newQuote = await quoteService.createCotizacion(payload);
      toast.success("Cotización manual creada como BORRADOR");
      onCreated(newQuote);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear la cotización");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-ink text-paper flex items-center justify-between">
          <h2 className="font-display font-bold text-sm uppercase tracking-widest">Registrar Cotización Manual</h2>
          <button onClick={onClose} className="text-paper/60 hover:text-paper text-xs">Cerrar</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* SECTOR CLIENTE */}
          <div className="border border-ink/5 p-4 rounded-xl bg-ink/[0.01]">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">Cliente</label>
              <button
                type="button"
                onClick={() => setRegisterNewClient(!registerNewClient)}
                className="text-[10px] text-cyan-press hover:underline font-bold flex items-center gap-1"
              >
                <IconUserPlus size={12} /> {registerNewClient ? "Seleccionar Existente" : "+ Registrar Nuevo Cliente"}
              </button>
            </div>

            {registerNewClient ? (
              <div className="space-y-3 pt-2 border-t border-ink/5">
                <div className="flex gap-2">
                  <select
                    value={newClientDocType}
                    onChange={(e) => setNewClientDocType(e.target.value as "DNI" | "RUC")}
                    className="w-24 px-3 py-1.5 border border-ink/10 rounded-lg text-xs"
                  >
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Número de documento"
                    maxLength={11}
                    value={newClientDocNum}
                    onChange={(e) => setNewClientDocNum(e.target.value.replace(/\D/g, ""))}
                    className="flex-1 px-3 py-1.5 border border-ink/10 rounded-lg text-xs"
                    required
                  />
                </div>
                <input
                  type="text"
                  placeholder={newClientDocType === "DNI" ? "Nombre Completo del Cliente" : "Razón Social de la Empresa"}
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-ink/10 rounded-lg text-xs"
                  required
                />
                <input
                  type="text"
                  placeholder="Dirección (Opcional)"
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                  className="w-full px-3 py-1.5 border border-ink/10 rounded-lg text-xs"
                />
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Email (Opcional)"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-ink/10 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Celular (Opcional)"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-ink/10 rounded-lg text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreateClient}
                  disabled={isRegisteringClient}
                  className="w-full py-1.5 bg-ink text-paper rounded-lg text-xs font-semibold hover:bg-ink/90 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isRegisteringClient ? <IconLoader size={14} className="animate-spin" /> : null}
                  Confirmar y Guardar Cliente
                </button>
              </div>
            ) : (
              <select
                value={idCliente}
                onChange={(e) => setIdCliente(e.target.value)}
                className="w-full px-3 py-2 border border-ink/10 rounded-lg text-xs"
                required
              >
                <option value="">-- Selecciona un cliente registrado --</option>
                {clients.map((c) => (
                  <option key={c.idCliente} value={c.idCliente}>
                    {c.nombreCompleto ? `${c.nombreCompleto} (${c.tipoDocumento}: ${c.numeroDocumento})` : `${c.razonSocial} (${c.tipoDocumento}: ${c.numeroDocumento})`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* DATOS DE LA COTIZACION */}
          <div className="space-y-3">
            <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-ink/75 mb-1.5">Tipo de Trabajo</label>
              <select
                value={tipoTrabajo}
                onChange={(e) => setTipoTrabajo(e.target.value)}
                className="w-full px-3 py-2 border border-ink/10 rounded-lg text-xs"
                required
              >
                <option value="">-- Selecciona el tipo de trabajo --</option>
                {Object.entries(
                  tiposProducto.reduce<Record<string, TipoProducto[]>>((acc, t) => {
                    (acc[t.categoria] ??= []).push(t);
                    return acc;
                  }, {})
                ).map(([cat, items]) => (
                  <optgroup key={cat} label={cat}>
                    {items.map(t => (
                      <option key={t.idTipoProducto} value={t.nombre}>{t.nombre}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/75 mb-1.5">Descripción de Detalles</label>
              <textarea
                placeholder="Indica las especificaciones libres (papel, tamaño, tintas, acabados)..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-ink/10 rounded-lg text-xs resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/75 mb-1.5">Cantidad Referencial</label>
                <input
                  type="number"
                  placeholder="Ej. 1000"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-full px-3 py-2 border border-ink/10 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/75 mb-1.5">Fecha Compromiso</label>
                <input
                  type="date"
                  value={fechaCompromiso}
                  onChange={(e) => setFechaCompromiso(e.target.value)}
                  className="w-full px-3 py-2 border border-ink/10 rounded-lg text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/75 mb-1.5">Monto Total Manual (S/)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ej. 350.00"
                min="0.01"
                value={montoTotal}
                onChange={(e) => setMontoTotal(e.target.value)}
                className="w-full px-3 py-2 border border-ink/10 rounded-lg text-xs font-mono font-bold text-ink"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/75 mb-1.5">Observaciones Adicionales</label>
              <textarea
                placeholder="Observaciones de entrega, forma de pago..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-ink/10 rounded-lg text-xs resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-ink/5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-ink text-paper rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-ink/90 transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
            >
              {isSubmitting ? <IconLoader size={14} className="animate-spin" /> : null}
              Registrar Cotización
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-ink/15 hover:bg-ink/5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
