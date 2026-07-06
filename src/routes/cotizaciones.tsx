import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Calculator,
  Calendar,
  CheckCircle2,
  CircleDot,
  Coins,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  User,
  UserPlus,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { authService } from "@/lib/api/auth.service";
import {
  quoteService,
  type CatalogoCotizacion,
  type Cliente,
  type CosteoRequest,
  type CosteoResponse,
  type Cotizacion,
  type TipoImpresion,
} from "@/lib/api/quote.service";

export const Route = createFileRoute("/cotizaciones")({
  beforeLoad: () => {
    if (!authService.isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Cotizaciones - LEO GRAPHYC ERP" },
      { name: "description", content: "Gestion y registro de cotizaciones a clientes." },
    ],
  }),
  component: CotizacionesPage,
});

const statusStyle: Record<Cotizacion["estado"], { label: string; classes: string }> = {
  BORRADOR: { label: "Borrador", classes: "bg-ink/10 text-ink/60" },
  ENVIADA: { label: "Enviada", classes: "bg-cyan-press/15 text-cyan-press" },
  APROBADA: { label: "Aprobada", classes: "bg-emerald-press/20 text-emerald-press" },
  RECHAZADA: { label: "Rechazada", classes: "bg-destructive/15 text-destructive" },
  CONVERTIDA: {
    label: "Convertida",
    classes: "bg-magenta-press/20 text-magenta-press font-semibold",
  },
};

const originStyle: Record<string, string> = {
  WEB: "bg-cyan-press/15 text-cyan-press",
  CHATWOOT: "bg-emerald-press/20 text-emerald-press",
  PRESENCIAL: "bg-yellow-press/20 text-ink",
};

const money = (value?: number | null) =>
  `S/ ${(value ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const clientLabel = (client: Cliente) =>
  client.nombreCompleto ||
  client.razonSocial ||
  `${client.tipoDocumento} ${client.numeroDocumento}`;

export function CotizacionesPage() {
  const [quotes, setQuotes] = useState<Cotizacion[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [catalogo, setCatalogo] = useState<CatalogoCotizacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Cotizacion | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [quotesData, clientsData, catalogoData] = await Promise.all([
        quoteService.getCotizaciones(),
        quoteService.getClientes(),
        quoteService.getCatalogoCotizacion(),
      ]);
      setQuotes(quotesData);
      setClients(clientsData);
      setCatalogo(catalogoData);
      setSelectedQuote(quotesData[0] ?? null);
    } catch (error) {
      toast.error(
        "Error al cargar la informacion: " +
          (error instanceof Error ? error.message : String(error)),
      );
    } finally {
      setLoading(false);
    }
  };

  const selectQuote = async (quote: Cotizacion) => {
    setSelectedQuote(quote);
    try {
      setSelectedQuote(await quoteService.getCotizacionDetalle(quote.idCotizacion));
    } catch {
      setSelectedQuote(quote);
    }
  };

  const handleUpdateStatus = async (id: number, nuevoEstado: string) => {
    try {
      const updated = await quoteService.updateCotizacionEstado(id, nuevoEstado);
      toast.success(`Cotizacion actualizada a ${nuevoEstado}`);
      setQuotes((prev) => prev.map((q) => (q.idCotizacion === id ? updated : q)));
      if (selectedQuote?.idCotizacion === id) setSelectedQuote(updated);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado");
    }
  };

  const handleAprobarYConvertir = async (id: number) => {
    try {
      toast.info("Procesando aprobacion y conversion a orden de trabajo...");
      const updated = await quoteService.aprobarCotizacion(id);
      toast.success("Cotizacion aprobada y convertida a Orden de Trabajo");
      setQuotes((prev) => prev.map((q) => (q.idCotizacion === id ? updated : q)));
      if (selectedQuote?.idCotizacion === id) setSelectedQuote(updated);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al aprobar y convertir");
    }
  };

  const totalMes = quotes.length;
  const aprobadas = quotes.filter(
    (q) => q.estado === "APROBADA" || q.estado === "CONVERTIDA",
  ).length;
  const tasaAprobacion = totalMes > 0 ? Math.round((aprobadas / totalMes) * 100) : 0;
  const pendientes = quotes.filter((q) => q.estado === "BORRADOR" || q.estado === "ENVIADA").length;
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
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!catalogo}
            className="px-4 py-1.5 bg-ink text-paper rounded-lg text-xs font-semibold uppercase tracking-widest hover:bg-ink/90 transition-all flex items-center gap-1.5 shadow-md disabled:opacity-40"
          >
            <Plus size={14} /> Nueva cotizacion
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Stat label="Total Registros" value={totalMes.toString()} accent="bg-cyan-press" />
        <Stat label="Tasa de aprobacion" value={`${tasaAprobacion}%`} accent="bg-emerald-press" />
        <Stat label="Pendientes" value={pendientes.toString()} accent="bg-yellow-press" />
        <Stat label="Valor total cotizado" value={money(valorCotizado)} accent="bg-magenta-press" />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={36} className="animate-spin text-ink/30" />
          <p className="text-sm text-ink/50">Cargando cotizaciones...</p>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-7 bg-white border border-ink/5 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-3 border-b border-ink/5 bg-ink/[0.01]">
              <h2 className="font-display font-bold text-sm uppercase tracking-widest text-ink/80">
                Historial
              </h2>
              <span className="text-[10px] font-mono text-ink/40 bg-ink/5 px-2 py-0.5 rounded-full">
                {quotes.length} registros
              </span>
            </div>

            {quotes.length === 0 ? (
              <div className="p-8 text-center text-ink/40 text-sm">
                No hay cotizaciones registradas.
              </div>
            ) : (
              <ul className="divide-y divide-ink/5">
                {quotes.map((q) => (
                  <li
                    key={q.idCotizacion}
                    onClick={() => selectQuote(q)}
                    className={
                      "flex items-center justify-between px-5 py-4 cursor-pointer transition-colors " +
                      (selectedQuote?.idCotizacion === q.idCotizacion
                        ? "bg-cyan-press/5 border-l-4 border-cyan-press pl-4"
                        : "hover:bg-ink/[0.01]")
                    }
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="text-[10px] font-mono text-ink/40 w-16 shrink-0">
                        {q.codigo}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-display font-bold text-sm truncate text-ink/80">
                            {q.clienteNombre}
                          </p>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${originStyle[q.origen ?? "WEB"] ?? originStyle.WEB}`}
                          >
                            {q.origen ?? "WEB"}
                          </span>
                        </div>
                        <p className="text-xs text-ink/50 truncate font-semibold">
                          {q.tipoTrabajo}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <span className="text-[10px] font-mono text-ink/40">
                        {q.fechaCompromiso
                          ? new Date(q.fechaCompromiso).toLocaleDateString("es-PE", {
                              day: "numeric",
                              month: "short",
                            })
                          : "N/A"}
                      </span>
                      <span className="font-mono font-bold text-sm text-ink/80">
                        {money(q.montoTotal)}
                      </span>
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded uppercase font-bold tracking-tighter w-24 text-center ${statusStyle[q.estado].classes}`}
                      >
                        {statusStyle[q.estado].label}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <QuoteDetail
            quote={selectedQuote}
            onSend={handleUpdateStatus}
            onApprove={handleAprobarYConvertir}
          />
        </div>
      )}

      {showCreateModal && catalogo && (
        <CreateQuoteModal
          clients={clients}
          catalogo={catalogo}
          onClientCreated={(client) => setClients((prev) => [...prev, client])}
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

function QuoteDetail({
  quote,
  onSend,
  onApprove,
}: {
  quote: Cotizacion | null;
  onSend: (id: number, estado: string) => void;
  onApprove: (id: number) => void;
}) {
  return (
    <aside className="col-span-5 bg-ink text-paper rounded-2xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[450px]">
      {quote ? (
        <div className="relative z-10 flex flex-col h-full justify-between flex-1">
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-mono uppercase tracking-widest text-paper/40">
                {quote.codigo} - {quote.clienteNombre}
              </span>
              <span
                className={`text-[10px] px-2.5 py-1 rounded uppercase font-bold tracking-tighter ${statusStyle[quote.estado].classes}`}
              >
                {statusStyle[quote.estado].label}
              </span>
            </div>

            <h2 className="font-display text-2xl font-bold tracking-tight mb-2 text-white">
              {quote.tipoTrabajo}
            </h2>
            <p className="text-paper/70 text-sm mb-6 bg-paper/5 p-3 rounded-lg border border-paper/10 whitespace-pre-wrap">
              {quote.descripcion || "Sin descripcion detallada."}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <Spec
                label="Cantidad"
                value={`${quote.cantidad.toLocaleString()} millar(es)`}
                icon={<CircleDot size={12} />}
              />
              <Spec
                label="Compromiso"
                value={
                  quote.fechaCompromiso
                    ? new Date(quote.fechaCompromiso).toLocaleDateString("es-PE")
                    : "No definida"
                }
                icon={<Calendar size={12} />}
              />
              <Spec label="Origen" value={quote.origen ?? "WEB"} icon={<Send size={12} />} />
              <Spec label="Creador" value={quote.creadorNombre} icon={<User size={12} />} />
            </div>

            {quote.desglose && (
              <div className="mb-6 border border-paper/10 rounded-lg overflow-hidden">
                <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-paper/40 bg-paper/5">
                  Desglose
                </div>
                <CostLine label="Diseno" value={quote.desglose.costoDiseno} />
                <CostLine label="Placas" value={quote.desglose.costoPlacas} />
                <CostLine label="Material" value={quote.desglose.costoMaterial} />
                <CostLine label="Impresion" value={quote.desglose.costoImpresion} />
                <CostLine label="Tinta" value={quote.desglose.costoTinta} />
                <CostLine label="Acabados" value={quote.desglose.costoAcabados} />
                <CostLine label="Mano de obra" value={quote.desglose.costoManoObra} />
              </div>
            )}
          </div>

          <div className="mt-auto">
            <div className="border-t border-paper/10 pt-4 mb-6">
              <div className="space-y-1 text-xs text-paper/55 mb-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{money(quote.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Margen</span>
                  <span>{money(quote.montoMargen)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IGV</span>
                  <span>{money(quote.montoIgv)}</span>
                </div>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-mono uppercase tracking-widest text-paper/40 flex items-center gap-1">
                  <Coins size={12} /> Total
                </span>
                <span className="font-display font-bold text-3xl text-white">
                  {money(quote.montoTotal)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {quote.estado === "BORRADOR" && (
                <>
                  <button
                    onClick={() => onSend(quote.idCotizacion, "ENVIADA")}
                    className="flex-1 py-2 bg-paper text-ink rounded-lg font-bold text-[11px] uppercase tracking-widest hover:bg-paper/90 transition-all flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Send size={14} /> Enviar
                  </button>
                  <button
                    onClick={() => onSend(quote.idCotizacion, "RECHAZADA")}
                    className="py-2 px-3 border border-destructive/30 text-destructive hover:bg-destructive/10 rounded-lg font-bold text-[11px] uppercase tracking-widest transition-all"
                  >
                    <XCircle size={14} />
                  </button>
                </>
              )}
              {quote.estado === "ENVIADA" && (
                <button
                  onClick={() => onApprove(quote.idCotizacion)}
                  className="flex-1 py-2 bg-emerald-press text-ink rounded-lg font-bold text-[11px] uppercase tracking-widest hover:bg-emerald-press/90 transition-all flex items-center justify-center gap-1 shadow-sm"
                >
                  <CheckCircle2 size={14} /> Aprobar y convertir
                </button>
              )}
              {quote.estado === "CONVERTIDA" && (
                <div className="w-full text-center py-2 bg-paper/5 border border-paper/10 rounded-lg text-xs text-paper/60 font-semibold">
                  Orden de trabajo activa
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center relative z-10">
          <FileText size={48} className="text-paper/20 mb-3 animate-pulse" />
          <p className="text-paper/40 text-sm">
            Selecciona una cotizacion del historial para ver su desglose.
          </p>
        </div>
      )}
    </aside>
  );
}

function CreateQuoteModal({
  clients,
  catalogo,
  onClientCreated,
  onClose,
  onCreated,
}: {
  clients: Cliente[];
  catalogo: CatalogoCotizacion;
  onClientCreated: (client: Cliente) => void;
  onClose: () => void;
  onCreated: (newQuote: Cotizacion) => void;
}) {
  const [idCliente, setIdCliente] = useState<number | null>(null);
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [idTipoProducto, setIdTipoProducto] = useState("");
  const [idInsumoPapel, setIdInsumoPapel] = useState("");
  const [idTarifaColor, setIdTarifaColor] = useState("");
  const [idAcabados, setIdAcabados] = useState<number[]>([]);
  const [tipoImpresion, setTipoImpresion] = useState<TipoImpresion>("OFFSET");
  const [descripcion, setDescripcion] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [costoDiseno, setCostoDiseno] = useState("0");
  const [fechaCompromiso, setFechaCompromiso] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [costeo, setCosteo] = useState<CosteoResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [registerNewClient, setRegisterNewClient] = useState(false);
  const [newClientDocType, setNewClientDocType] = useState<"DNI" | "RUC">("DNI");
  const [newClientDocNum, setNewClientDocNum] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [isRegisteringClient, setIsRegisteringClient] = useState(false);

  const selectedClient = useMemo(
    () => clients.find((client) => client.idCliente === idCliente) ?? null,
    [clients, idCliente],
  );

  const buildCosteoPayload = (): CosteoRequest => {
    const parsedCantidad = Number(cantidad);
    const parsedDiseno = Number(costoDiseno || 0);
    if (!idTipoProducto || !idInsumoPapel || !idTarifaColor)
      throw new Error("Selecciona tipo de producto, papel y tarifa de color.");
    if (!Number.isFinite(parsedCantidad) || parsedCantidad <= 0)
      throw new Error("La cantidad debe ser mayor a cero.");
    if (!Number.isFinite(parsedDiseno) || parsedDiseno < 0)
      throw new Error("El costo de diseño no puede ser negativo.");
    return {
      idTipoProducto: Number(idTipoProducto),
      idInsumoPapel: Number(idInsumoPapel),
      idTarifaColor: Number(idTarifaColor),
      idAcabados,
      cantidad: parsedCantidad,
      costoDiseno: parsedDiseno,
      tipoImpresion,
      descripcion: descripcion || undefined,
    };
  };

  const handleCreateClient = async () => {
    if (!newClientDocNum || !newClientName) {
      toast.error("Documento y nombre son obligatorios");
      return;
    }
    setIsRegisteringClient(true);
    try {
      const created = await quoteService.createCliente({
        tipoDocumento: newClientDocType,
        numeroDocumento: newClientDocNum,
        nombreCompleto: newClientDocType === "DNI" ? newClientName : undefined,
        razonSocial: newClientDocType === "RUC" ? newClientName : undefined,
        correo: newClientEmail || undefined,
        telefonoCelular: newClientPhone || undefined,
      });
      onClientCreated(created);
      setIdCliente(created.idCliente);
      setRegisterNewClient(false);
      toast.success("Cliente registrado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al registrar cliente");
    } finally {
      setIsRegisteringClient(false);
    }
  };

  const handleCalcular = async () => {
    try {
      setIsCalculating(true);
      const response = await quoteService.calcularCotizacion(buildCosteoPayload());
      setCosteo(response);
      toast.success("Cotizacion calculada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al calcular");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!idCliente) {
      toast.error("Selecciona o registra un cliente.");
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = buildCosteoPayload();
      const quote = await quoteService.createCotizacion({
        idCliente,
        ...payload,
        fechaCompromiso: fechaCompromiso || undefined,
        observaciones: observaciones || undefined,
      });
      toast.success("Cotizacion creada como borrador");
      onCreated(quote);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear cotizacion");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAcabado = (id: number) => {
    setCosteo(null);
    setIdAcabados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 bg-ink text-paper flex items-center justify-between">
          <h2 className="font-display font-bold text-sm uppercase tracking-widest">
            Nueva cotizacion calculada
          </h2>
          <button onClick={onClose} className="text-paper/60 hover:text-paper text-xs">
            Cerrar
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto grid grid-cols-12 gap-6 flex-1"
        >
          <div className="col-span-7 space-y-4">
            <section className="border border-ink/5 p-4 rounded-xl bg-ink/[0.01]">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/70">
                  Cliente
                </label>
                <button
                  type="button"
                  onClick={() => setRegisterNewClient((value) => !value)}
                  className="text-[10px] text-cyan-press hover:underline font-bold flex items-center gap-1"
                >
                  <UserPlus size={12} />{" "}
                  {registerNewClient ? "Buscar existente" : "Registrar nuevo"}
                </button>
              </div>

              {registerNewClient ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <select
                      value={newClientDocType}
                      onChange={(event) => setNewClientDocType(event.target.value as "DNI" | "RUC")}
                      className="w-24 px-3 py-2 border border-ink/10 rounded-lg text-xs"
                    >
                      <option value="DNI">DNI</option>
                      <option value="RUC">RUC</option>
                    </select>
                    <input
                      value={newClientDocNum}
                      onChange={(event) =>
                        setNewClientDocNum(event.target.value.replace(/\D/g, ""))
                      }
                      maxLength={11}
                      placeholder="Numero de documento"
                      className="flex-1 px-3 py-2 border border-ink/10 rounded-lg text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      value={newClientName}
                      onChange={(event) => setNewClientName(event.target.value)}
                      placeholder={newClientDocType === "DNI" ? "Nombre completo" : "Razon social"}
                      className="col-span-3 px-3 py-2 border border-ink/10 rounded-lg text-xs"
                    />
                    <input
                      value={newClientEmail}
                      onChange={(event) => setNewClientEmail(event.target.value)}
                      placeholder="Correo"
                      className="col-span-2 px-3 py-2 border border-ink/10 rounded-lg text-xs"
                    />
                    <input
                      value={newClientPhone}
                      onChange={(event) => setNewClientPhone(event.target.value)}
                      placeholder="Celular"
                      className="px-3 py-2 border border-ink/10 rounded-lg text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateClient}
                    disabled={isRegisteringClient}
                    className="w-full py-2 bg-ink text-paper rounded-lg text-xs font-semibold hover:bg-ink/90 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isRegisteringClient ? <Loader2 size={14} className="animate-spin" /> : null}
                    Guardar cliente
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setClientSearchOpen(true)}
                    className="w-full px-3 py-2 border border-ink/10 rounded-lg text-xs text-left flex items-center justify-between hover:bg-ink/[0.02]"
                  >
                    <span>
                      {selectedClient
                        ? `${clientLabel(selectedClient)} (${selectedClient.tipoDocumento}: ${selectedClient.numeroDocumento})`
                        : "Buscar cliente por nombre o documento"}
                    </span>
                    <Search size={14} className="text-ink/40" />
                  </button>
                  <ClientSearchDialog
                    open={clientSearchOpen}
                    onOpenChange={setClientSearchOpen}
                    clients={clients}
                    onSelect={(client) => setIdCliente(client.idCliente)}
                  />
                </>
              )}
            </section>

            <section className="grid grid-cols-2 gap-3">
              <Field label="Tipo de producto">
                <select
                  value={idTipoProducto}
                  onChange={(event) => {
                    setIdTipoProducto(event.target.value);
                    setCosteo(null);
                  }}
                  className="w-full px-3 py-2 border border-ink/10 rounded-lg text-xs"
                  required
                >
                  <option value="">Selecciona un producto</option>
                  {catalogo.tiposProducto.map((item) => (
                    <option key={item.idTipoProducto} value={item.idTipoProducto}>
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Papel">
                <select
                  value={idInsumoPapel}
                  onChange={(event) => {
                    setIdInsumoPapel(event.target.value);
                    setCosteo(null);
                  }}
                  className="w-full px-3 py-2 border border-ink/10 rounded-lg text-xs"
                  required
                >
                  <option value="">Selecciona papel</option>
                  {catalogo.papeles.map((item) => (
                    <option key={item.idInsumo} value={item.idInsumo}>
                      {item.nombre} {item.descripcion ? `- ${item.descripcion}` : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tarifa de color">
                <select
                  value={idTarifaColor}
                  onChange={(event) => {
                    setIdTarifaColor(event.target.value);
                    setCosteo(null);
                  }}
                  className="w-full px-3 py-2 border border-ink/10 rounded-lg text-xs"
                  required
                >
                  <option value="">Selecciona colores</option>
                  {catalogo.tarifasColor.map((item) => (
                    <option key={item.idTarifaColor} value={item.idTarifaColor}>
                      {item.numeroColores} color(es)
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tipo impresion">
                <select
                  value={tipoImpresion}
                  onChange={(event) => {
                    setTipoImpresion(event.target.value as TipoImpresion);
                    setCosteo(null);
                  }}
                  className="w-full px-3 py-2 border border-ink/10 rounded-lg text-xs"
                >
                  <option value="OFFSET">Offset</option>
                  <option value="DIGITAL">Digital</option>
                </select>
              </Field>
              <Field label="Cantidad">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={cantidad}
                  onChange={(event) => {
                    setCantidad(event.target.value);
                    setCosteo(null);
                  }}
                  className="w-full px-3 py-2 border border-ink/10 rounded-lg text-xs"
                  required
                />
              </Field>
              <Field label="Costo de diseño">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costoDiseno}
                  onChange={(event) => {
                    setCostoDiseno(event.target.value);
                    setCosteo(null);
                  }}
                  className="w-full px-3 py-2 border border-ink/10 rounded-lg text-xs"
                  required
                />
              </Field>
              <Field label="Fecha compromiso">
                <input
                  type="date"
                  value={fechaCompromiso}
                  onChange={(event) => setFechaCompromiso(event.target.value)}
                  className="w-full px-3 py-2 border border-ink/10 rounded-lg text-xs"
                />
              </Field>
              <Field label="Acabados">
                <div className="grid grid-cols-2 gap-2">
                  {catalogo.acabados.map((item) => (
                    <button
                      key={item.idAcabado}
                      type="button"
                      onClick={() => toggleAcabado(item.idAcabado)}
                      className={`px-3 py-2 rounded-lg border text-left text-[11px] ${idAcabados.includes(item.idAcabado) ? "border-cyan-press bg-cyan-press/10 text-cyan-press" : "border-ink/10 text-ink/70 hover:bg-ink/[0.02]"}`}
                    >
                      {item.nombre}
                    </button>
                  ))}
                </div>
              </Field>
            </section>

            <Field label="Descripcion">
              <textarea
                value={descripcion}
                onChange={(event) => {
                  setDescripcion(event.target.value);
                  setCosteo(null);
                }}
                rows={3}
                className="w-full px-3 py-2 border border-ink/10 rounded-lg text-xs resize-none"
                placeholder="Ej. Millar de tarjetas couche"
              />
            </Field>
            <Field label="Observaciones">
              <textarea
                value={observaciones}
                onChange={(event) => setObservaciones(event.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-ink/10 rounded-lg text-xs resize-none"
              />
            </Field>
          </div>

          <aside className="col-span-5 border border-ink/10 rounded-xl p-4 bg-ink/[0.01] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-sm uppercase tracking-widest text-ink/80">
                Calculo
              </h3>
              <button
                type="button"
                onClick={handleCalcular}
                disabled={isCalculating}
                className="px-3 py-2 bg-cyan-press text-ink rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-50"
              >
                {isCalculating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Calculator size={14} />
                )}
                Calcular
              </button>
            </div>

            {costeo ? (
              <div className="space-y-3 flex-1">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <PreviewLine label="Diseno" value={costeo.desglose.costoDiseno} />
                  <PreviewLine label="Placas" value={costeo.desglose.costoPlacas} />
                  <PreviewLine label="Material" value={costeo.desglose.costoMaterial} />
                  <PreviewLine label="Depreciacion" value={costeo.desglose.costoDepreciacion} />
                  <PreviewLine label="Impresion" value={costeo.desglose.costoImpresion} />
                  <PreviewLine label="Tinta" value={costeo.desglose.costoTinta} />
                  <PreviewLine label="Acabados" value={costeo.desglose.costoAcabados} />
                  <PreviewLine label="Mano obra" value={costeo.desglose.costoManoObra} />
                </div>
                <div className="border-t border-ink/10 pt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <strong>{money(costeo.subtotal)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Margen {costeo.porcentajeMargen}%</span>
                    <strong>{money(costeo.montoMargen)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>IGV {costeo.porcentajeIgv}%</span>
                    <strong>{money(costeo.montoIgv)}</strong>
                  </div>
                  <div className="flex justify-between text-xl font-display font-bold text-ink pt-2">
                    <span>Total</span>
                    <span>{money(costeo.total)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-sm text-ink/40 px-8">
                Completa los datos comerciales y calcula para revisar el desglose antes de guardar.
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-ink/5 mt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-ink text-paper rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-ink/90 transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Crear cotizacion
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-ink/15 hover:bg-ink/5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all"
              >
                Cancelar
              </button>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}

function ClientSearchDialog({
  open,
  onOpenChange,
  clients,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Cliente[];
  onSelect: (client: Cliente) => void;
}) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar por nombre, razon social o documento..." />
      <CommandList>
        <CommandEmpty>No se encontraron clientes.</CommandEmpty>
        <CommandGroup heading="Clientes">
          {clients.map((client) => (
            <CommandItem
              key={client.idCliente}
              value={`${clientLabel(client)} ${client.tipoDocumento} ${client.numeroDocumento}`}
              onSelect={() => {
                onSelect(client);
                onOpenChange(false);
              }}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{clientLabel(client)}</span>
                <span className="text-xs text-ink/50">
                  {client.tipoDocumento}: {client.numeroDocumento}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
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

function Spec({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="bg-paper/5 p-2.5 rounded-lg border border-paper/10">
      <dt className="text-[9px] font-mono uppercase tracking-widest text-paper/40 mb-1 flex items-center gap-1">
        {icon} {label}
      </dt>
      <dd className="font-medium text-white/90 text-xs truncate">{value}</dd>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wider text-ink/75">
      <span className="block mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function CostLine({ label, value }: { label: string; value?: number | null }) {
  return (
    <div className="flex justify-between px-3 py-1.5 text-xs text-paper/65 border-t border-paper/10">
      <span>{label}</span>
      <span className="font-mono">{money(value)}</span>
    </div>
  );
}

function PreviewLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-ink/5 rounded-lg p-2">
      <span className="block text-[9px] uppercase tracking-widest text-ink/40">{label}</span>
      <strong className="font-mono text-ink/80">{money(value)}</strong>
    </div>
  );
}
