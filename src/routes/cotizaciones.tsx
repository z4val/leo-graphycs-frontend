import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Calculator,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  type CosteoOverrides,
  type CosteoRequest,
  type CosteoResponse,
  type Cotizacion,
  type DetalleCalculo,
  type LineaCalculo,
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
  TELEGRAM: "bg-emerald-press/20 text-emerald-press",
  CHATWOOT: "bg-emerald-press/20 text-emerald-press",
  PRESENCIAL: "bg-yellow-press/20 text-ink",
};

const originLabel: Record<string, string> = {
  WEB: "WEB",
  PRESENCIAL: "PRESENCIAL",
  TELEGRAM: "TELEGRAM",
  CHATWOOT: "TELEGRAM",
};

const money = (value?: number | null) =>
  `S/ ${(value ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatMillarEquivalent = (cantidad: string, unidad: "UNIDADES" | "MILLARES") => {
  const value = Number(cantidad);
  if (!Number.isFinite(value) || value <= 0) return "ingresa una cantidad valida";
  const millares = unidad === "UNIDADES" ? value / 1000 : value;
  const unidades = millares * 1000;
  return `${millares.toLocaleString("es-PE", {
    maximumFractionDigits: 3,
  })} millar(es) / ${unidades.toLocaleString("es-PE", {
    maximumFractionDigits: 0,
  })} unidades`;
};

const toCosteoFromQuote = (quote: Cotizacion): CosteoResponse | null => {
  if (!quote.detalleCalculo && !quote.desglose) return null;

  return {
    idTipoProducto: quote.idTipoProducto ?? 0,
    tipoProductoNombre: quote.tipoProductoNombre ?? quote.tipoTrabajo,
    idInsumoPapel: quote.idInsumoPapel ?? 0,
    papelNombre: quote.papelNombre ?? "",
    idTarifaColor: quote.idTarifaColor ?? 0,
    numeroColores: quote.numeroColores ?? 0,
    tipoImpresion: quote.tipoImpresion ?? "OFFSET",
    cantidad: quote.cantidad,
    subtotal: quote.subtotal ?? 0,
    porcentajeMargen: quote.porcentajeMargen ?? 0,
    montoMargen: quote.montoMargen ?? 0,
    baseImponible: quote.baseImponible ?? 0,
    porcentajeIgv: quote.porcentajeIgv ?? 0,
    montoIgv: quote.montoIgv ?? 0,
    total: quote.montoTotal,
    desglose: quote.desglose ?? {
      costoDiseno: 0,
      costoPlacas: 0,
      costoMaterial: 0,
      costoDepreciacion: 0,
      costoImpresion: 0,
      costoTinta: 0,
      costoAcabados: 0,
      costoManoObra: 0,
    },
    detalleCalculo: quote.detalleCalculo ?? {
      lineas: [],
      tarifas: {
        costoDiseno: 0,
        costoPlacas: 0,
        precioMaterialMillar: 0,
        tarifaDepreciacionMillar: 0,
        tarifaImpresionMillar: 0,
        tarifaTintaMillar: 0,
        tarifaManoObraMillar: 0,
        porcentajeMargen: 0,
        porcentajeIgv: 0,
      },
    },
    acabados: (quote.acabados ?? []).map((item) => ({
      idAcabado: item.idAcabado,
      nombre: item.nombre,
      precioVentaMillar: item.precioAplicadoMillar,
    })),
  };
};

const clientLabel = (client: Cliente) =>
  client.nombreCompleto ||
  client.razonSocial ||
  `${client.tipoDocumento} ${client.numeroDocumento}`;

const sanitizeDecimalInput = (value: string) => {
  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
  const [integerPart, ...decimalParts] = normalized.split(".");
  return decimalParts.length > 0 ? `${integerPart}.${decimalParts.join("")}` : integerPart;
};

const convertCantidadInput = (
  cantidad: string,
  from: "UNIDADES" | "MILLARES",
  to: "UNIDADES" | "MILLARES",
) => {
  if (from === to) return cantidad;
  const value = Number(cantidad);
  if (!Number.isFinite(value) || value <= 0) return to === "UNIDADES" ? "" : "";
  if (from === "UNIDADES" && to === "MILLARES") {
    return sanitizeDecimalInput(String(value / 1000));
  }
  return String(Math.round(value * 1000));
};

const ratePerMillar = (total: number, cantidad: number) => (cantidad > 0 ? total / cantidad : 0);

const resolveDetalleCalculo = (costeo: CosteoResponse): DetalleCalculo => {
  if (costeo.detalleCalculo?.lineas?.length) {
    return costeo.detalleCalculo;
  }

  const d = costeo.desglose;
  const qty = Number(costeo.cantidad) || 0;
  const lineas: LineaCalculo[] = [
    {
      componente: "Diseño",
      tipo: "FIJO",
      formula: "valor ingresado al cotizar",
      peso: d.costoDiseno,
      cantidad: 1,
      monto: d.costoDiseno,
      editable: true,
    },
    {
      componente: "Placas",
      tipo: "FIJO",
      formula: "según n.º de colores (fijo por pedido)",
      peso: d.costoPlacas,
      cantidad: 1,
      monto: d.costoPlacas,
      editable: true,
    },
    {
      componente: "Material (papel)",
      tipo: "POR_MILLAR",
      formula: "precio por millar × cantidad",
      peso: ratePerMillar(d.costoMaterial, qty),
      cantidad: qty,
      monto: d.costoMaterial,
      editable: true,
    },
    {
      componente: "Depreciación máquina",
      tipo: "POR_MILLAR",
      formula: "tarifa depreciación × cantidad",
      peso: ratePerMillar(d.costoDepreciacion, qty),
      cantidad: qty,
      monto: d.costoDepreciacion,
      editable: true,
    },
    {
      componente: "Impresión",
      tipo: "POR_MILLAR",
      formula: "tarifa impresión × cantidad",
      peso: ratePerMillar(d.costoImpresion, qty),
      cantidad: qty,
      monto: d.costoImpresion,
      editable: true,
    },
    {
      componente: "Tinta",
      tipo: "POR_MILLAR",
      formula: "tarifa tinta × cantidad",
      peso: ratePerMillar(d.costoTinta, qty),
      cantidad: qty,
      monto: d.costoTinta,
      editable: true,
    },
  ];

  if ((costeo.acabados ?? []).length > 0) {
    for (const acabado of costeo.acabados) {
      lineas.push({
        componente: `Acabado – ${acabado.nombre}`,
        tipo: "POR_MILLAR",
        formula: "precio acabado × cantidad",
        peso: acabado.precioVentaMillar,
        cantidad: qty,
        monto: acabado.precioVentaMillar * qty,
        editable: true,
      });
    }
  } else {
    lineas.push({
      componente: "Acabados",
      tipo: "POR_MILLAR",
      formula: "Σ precio acabado × cantidad",
      peso: ratePerMillar(d.costoAcabados, qty),
      cantidad: qty,
      monto: d.costoAcabados,
      editable: true,
    });
  }

  lineas.push(
    {
      componente: "Mano de obra",
      tipo: "POR_MILLAR",
      formula: "tarifa mano de obra × cantidad",
      peso: ratePerMillar(d.costoManoObra, qty),
      cantidad: qty,
      monto: d.costoManoObra,
      editable: true,
    },
    {
      componente: "Subtotal",
      tipo: "RESUMEN",
      formula: "suma de todos los costos",
      peso: null,
      cantidad: null,
      monto: costeo.subtotal,
      editable: false,
    },
    {
      componente: "Margen comercial",
      tipo: "PORCENTAJE",
      formula: `subtotal × ${costeo.porcentajeMargen}%`,
      peso: costeo.porcentajeMargen,
      cantidad: costeo.subtotal,
      monto: costeo.montoMargen,
      editable: true,
    },
    {
      componente: "Base imponible",
      tipo: "RESUMEN",
      formula: "subtotal + margen",
      peso: null,
      cantidad: null,
      monto: costeo.baseImponible,
      editable: false,
    },
    {
      componente: "IGV",
      tipo: "PORCENTAJE",
      formula: `base imponible × ${costeo.porcentajeIgv}%`,
      peso: costeo.porcentajeIgv,
      cantidad: costeo.baseImponible,
      monto: costeo.montoIgv,
      editable: true,
    },
    {
      componente: "Total",
      tipo: "RESUMEN",
      formula: "base imponible + IGV",
      peso: null,
      cantidad: null,
      monto: costeo.total,
      editable: false,
    },
  );

  return {
    lineas,
    tarifas: {
      costoDiseno: d.costoDiseno,
      costoPlacas: d.costoPlacas,
      precioMaterialMillar: ratePerMillar(d.costoMaterial, qty),
      tarifaDepreciacionMillar: ratePerMillar(d.costoDepreciacion, qty),
      tarifaImpresionMillar: ratePerMillar(d.costoImpresion, qty),
      tarifaTintaMillar: ratePerMillar(d.costoTinta, qty),
      tarifaManoObraMillar: ratePerMillar(d.costoManoObra, qty),
      porcentajeMargen: costeo.porcentajeMargen,
      porcentajeIgv: costeo.porcentajeIgv,
    },
  };
};

export function CotizacionesPage() {
  const [quotes, setQuotes] = useState<Cotizacion[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [catalogo, setCatalogo] = useState<CatalogoCotizacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Cotizacion | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingCreateData, setLoadingCreateData] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const historyPageSize = 8;

  useEffect(() => {
    loadData();
  }, []);

  const totalHistoryPages = Math.max(1, Math.ceil(quotes.length / historyPageSize));
  const paginatedQuotes = quotes.slice(
    (historyPage - 1) * historyPageSize,
    historyPage * historyPageSize,
  );

  useEffect(() => {
    setHistoryPage((page) => Math.min(page, totalHistoryPages));
  }, [totalHistoryPages]);

  const loadData = async () => {
    setLoading(true);
    try {
      const quotesData = await quoteService.getCotizaciones();
      setQuotes(quotesData);
      setSelectedQuote(quotesData[0] ?? null);
      // El listado es liviano; solo la cotización seleccionada requiere el desglose completo.
      if (quotesData[0]) {
        try {
          setSelectedQuote(await quoteService.getCotizacionDetalle(quotesData[0].idCotizacion));
        } catch {
          // Conserva el resumen si el detalle puntual no estuviera disponible.
        }
      }
    } catch (error) {
      toast.error(
        "Error al cargar la informacion: " +
          (error instanceof Error ? error.message : String(error)),
      );
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = async () => {
    setLoadingCreateData(true);
    try {
      const [clientsData, catalogoData] = await Promise.all([
        clients.length ? Promise.resolve(clients) : quoteService.getClientes(),
        catalogo ? Promise.resolve(catalogo) : quoteService.getCatalogoCotizacion(),
      ]);
      setClients(clientsData);
      setCatalogo(catalogoData);
      setShowCreateModal(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar los datos para cotizar");
    } finally {
      setLoadingCreateData(false);
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
      toast.success(
        nuevoEstado === "ENVIADA"
          ? "Cotizacion enviada al correo del cliente"
          : `Cotizacion actualizada a ${nuevoEstado}`,
      );
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
            onClick={openCreateModal}
            disabled={loadingCreateData}
            className="px-4 py-1.5 bg-ink text-paper rounded-lg text-xs font-semibold uppercase tracking-widest hover:bg-ink/90 transition-all flex items-center gap-1.5 shadow-md disabled:opacity-40"
          >
            <Plus size={14} /> {loadingCreateData ? "Cargando..." : "Nueva cotizacion"}
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
            <div className="flex items-center justify-between px-5 py-3 border-b border-ink/5 bg-ink/1">
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
              <>
                <ul className="divide-y divide-ink/5">
                  {paginatedQuotes.map((q) => (
                    <li
                      key={q.idCotizacion}
                      onClick={() => selectQuote(q)}
                      className={
                        "flex items-center justify-between px-5 py-4 cursor-pointer transition-colors " +
                        (selectedQuote?.idCotizacion === q.idCotizacion
                          ? "bg-cyan-press/5 border-l-4 border-cyan-press pl-4"
                          : "hover:bg-ink/1")
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
                              {originLabel[q.origen ?? "WEB"] ?? q.origen ?? "WEB"}
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
                <HistoryPagination
                  page={historyPage}
                  pageSize={historyPageSize}
                  total={quotes.length}
                  totalPages={totalHistoryPages}
                  onPageChange={setHistoryPage}
                />
              </>
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

function HistoryPagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/5 bg-ink/[0.015] px-5 py-3">
      <p className="text-[10px] font-mono uppercase tracking-widest text-ink/40">
        Mostrando {from}-{to} de {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="inline-flex items-center gap-1 rounded border border-ink/10 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink/60 transition hover:border-cyan-press/30 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={14} /> Anterior
        </button>
        <span className="rounded bg-ink/5 px-2.5 py-1.5 text-xs font-mono text-ink/55">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="inline-flex items-center gap-1 rounded border border-ink/10 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink/60 transition hover:border-cyan-press/30 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente <ChevronRight size={14} />
        </button>
      </div>
    </div>
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
  const [showDetalleModal, setShowDetalleModal] = useState(false);

  useEffect(() => {
    setShowDetalleModal(false);
  }, [quote?.idCotizacion]);

  const detalleCosteo = quote ? toCosteoFromQuote(quote) : null;

  return (
    <aside className="col-span-5 bg-ink text-paper rounded-2xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between min-h-112.5">
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
                value={`${quote.cantidad.toLocaleString()} millar(es) / ${(
                  Number(quote.cantidad || 0) * 1000
                ).toLocaleString("es-PE")} unidades`}
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
              <Spec
                label="Origen"
                value={originLabel[quote.origen ?? "WEB"] ?? quote.origen ?? "WEB"}
                icon={<Send size={12} />}
              />
              <Spec label="Creador" value={quote.creadorNombre} icon={<User size={12} />} />
            </div>

            {detalleCosteo && (
              <button
                type="button"
                onClick={() => setShowDetalleModal(true)}
                className="mb-6 w-full rounded-lg border border-paper/10 bg-paper/5 px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-paper/75 hover:bg-paper/10"
              >
                Abrir detalle de calculo
              </button>
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
                    title="Envia la cotizacion al correo del cliente y marca el estado como enviada."
                    className="flex-1 py-2 bg-paper text-ink rounded-lg font-bold text-[11px] uppercase tracking-widest hover:bg-paper/90 transition-all flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Send size={14} /> Enviar correo
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
          {detalleCosteo && showDetalleModal && (
            <QuoteCalculationModal
              quote={quote}
              costeo={detalleCosteo}
              onClose={() => setShowDetalleModal(false)}
            />
          )}
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

function QuoteCalculationModal({
  quote,
  costeo,
  onClose,
}: {
  quote: Cotizacion;
  costeo: CosteoResponse;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-5xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-ink/40">
              {quote.codigo} - {quote.clienteNombre}
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-ink">Detalle de calculo</h2>
            <p className="mt-1 text-xs text-ink/50">
              Snapshot comercial guardado al momento de crear la cotizacion.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-ink/45 hover:bg-ink/5"
          >
            Cerrar
          </button>
        </div>

        <div className="mb-4 grid grid-cols-4 gap-3 text-xs">
          <DetailSpec label="Producto" value={costeo.tipoProductoNombre} />
          <DetailSpec
            label="Cantidad"
            value={`${costeo.cantidad.toLocaleString("es-PE")} millar(es)`}
          />
          <DetailSpec label="Papel" value={costeo.papelNombre || "No registrado"} />
          <DetailSpec
            label="Color"
            value={`${costeo.numeroColores} color(es), ${costeo.tipoImpresion.toLowerCase()}`}
          />
        </div>

        <div className="max-h-[62vh] overflow-y-auto">
          <CalculationDetailPanel
            detalle={resolveDetalleCalculo(costeo)}
            desglose={costeo.desglose}
            variant="light"
          />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3 border-t border-ink/10 pt-4 text-sm">
          <TotalLine label="Subtotal" value={costeo.subtotal} />
          <TotalLine label={`Margen ${costeo.porcentajeMargen}%`} value={costeo.montoMargen} />
          <TotalLine label={`IGV ${costeo.porcentajeIgv}%`} value={costeo.montoIgv} />
          <TotalLine label="Total" value={costeo.total} strong />
        </div>
      </div>
    </div>
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
  const [origenCotizacion, setOrigenCotizacion] = useState<"WEB" | "PRESENCIAL">("WEB");
  const [idTipoProducto, setIdTipoProducto] = useState("");
  const [idInsumoPapel, setIdInsumoPapel] = useState("");
  const [idTarifaColor, setIdTarifaColor] = useState("");
  const [idAcabados, setIdAcabados] = useState<number[]>([]);
  const [tipoImpresion, setTipoImpresion] = useState<TipoImpresion>("OFFSET");
  const [descripcion, setDescripcion] = useState("");
  const [cantidad, setCantidad] = useState("1000");
  const [unidadCantidad, setUnidadCantidad] = useState<"UNIDADES" | "MILLARES">("UNIDADES");
  const [costoDiseno, setCostoDiseno] = useState("0");
  const [fechaCompromiso, setFechaCompromiso] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [costeo, setCosteo] = useState<CosteoResponse | null>(null);
  const [ajustes, setAjustes] = useState<CosteoOverrides | null>(null);
  const [showCalculoDetalle, setShowCalculoDetalle] = useState(false);
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

  useEffect(() => {
    if (!catalogo || !idInsumoPapel || !idTarifaColor) {
      setAjustes(null);
      return;
    }
    const papel = catalogo.papeles.find((item) => item.idInsumo === Number(idInsumoPapel));
    const tarifa = catalogo.tarifasColor.find(
      (item) => item.idTarifaColor === Number(idTarifaColor),
    );
    if (!papel || !tarifa) {
      setAjustes(null);
      return;
    }
    setAjustes({
      costoPlacas: tarifa.costoPlacas,
      precioMaterialMillar: papel.precioVentaMillar,
      tarifaDepreciacionMillar: catalogo.parametros.depreciacion_millar ?? 0,
      tarifaImpresionMillar: tarifa.tarifaImpresionMillar,
      tarifaTintaMillar: catalogo.parametros.tinta_millar ?? 0,
      tarifaManoObraMillar: catalogo.parametros.mano_obra_millar ?? 0,
      porcentajeMargen: catalogo.parametros.porcentaje_margen ?? 30,
      porcentajeIgv: catalogo.parametros.porcentaje_igv ?? 18,
      acabados: idAcabados.map((idAcabado) => ({
        idAcabado,
        precioVentaMillar:
          catalogo.acabados.find((item) => item.idAcabado === idAcabado)?.precioVentaMillar ?? 0,
      })),
    });
  }, [catalogo, idInsumoPapel, idTarifaColor, idAcabados]);

  useEffect(() => {
    if (!costeo) setShowCalculoDetalle(false);
  }, [costeo]);

  const buildAjustesPayload = (): CosteoOverrides | undefined => {
    if (!ajustes) return undefined;
    return {
      ...ajustes,
      acabados: idAcabados.map((idAcabado) => ({
        idAcabado,
        precioVentaMillar:
          ajustes.acabados?.find((item) => item.idAcabado === idAcabado)?.precioVentaMillar ??
          catalogo.acabados.find((item) => item.idAcabado === idAcabado)?.precioVentaMillar ??
          0,
      })),
    };
  };

  const buildCosteoPayload = (): CosteoRequest => {
    const parsedCantidad = Number(cantidad);
    const cantidadEnMillares =
      unidadCantidad === "UNIDADES" ? parsedCantidad / 1000 : parsedCantidad;
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
      cantidad: cantidadEnMillares,
      costoDiseno: parsedDiseno,
      tipoImpresion,
      descripcion: descripcion || undefined,
      ajustes: buildAjustesPayload(),
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
        origen: origenCotizacion,
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

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 grid grid-cols-12 gap-6">
              <div className="col-span-7 space-y-4">
                <section className="border border-ink/5 p-4 rounded-xl bg-ink/1">
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
                          onChange={(event) =>
                            setNewClientDocType(event.target.value as "DNI" | "RUC")
                          }
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
                          placeholder={
                            newClientDocType === "DNI" ? "Nombre completo" : "Razon social"
                          }
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
                        {isRegisteringClient ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : null}
                        Guardar cliente
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setClientSearchOpen(true)}
                        className="w-full px-3 py-2 border border-ink/10 rounded-lg text-xs text-left flex items-center justify-between hover:bg-ink/2"
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

                <section className="border border-ink/5 p-4 rounded-xl bg-ink/1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-3">
                    Tipo de contacto
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "WEB", label: "Web" },
                      { value: "PRESENCIAL", label: "Presencial" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setOrigenCotizacion(option.value as "WEB" | "PRESENCIAL")}
                        className={`rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                          origenCotizacion === option.value
                            ? "border-cyan-press bg-cyan-press/10 text-ink"
                            : "border-ink/10 text-ink/55 hover:bg-ink/2"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
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
                  <Field label="Cantidad cotizada">
                    <div className="grid grid-cols-5 gap-2">
                      <input
                        type="text"
                        inputMode={unidadCantidad === "UNIDADES" ? "numeric" : "decimal"}
                        value={cantidad}
                        onChange={(event) => {
                          setCantidad(
                            unidadCantidad === "UNIDADES"
                              ? event.target.value.replace(/\D/g, "")
                              : sanitizeDecimalInput(event.target.value),
                          );
                          setCosteo(null);
                        }}
                        className="col-span-3 w-full px-3 py-2 border border-ink/10 rounded-lg text-xs"
                        required
                      />
                      <select
                        value={unidadCantidad}
                        onChange={(event) => {
                          const nextUnidad = event.target.value as "UNIDADES" | "MILLARES";
                          setCantidad(convertCantidadInput(cantidad, unidadCantidad, nextUnidad));
                          setUnidadCantidad(nextUnidad);
                          setCosteo(null);
                        }}
                        className="col-span-2 w-full px-3 py-2 border border-ink/10 rounded-lg text-xs"
                      >
                        <option value="UNIDADES">Unidades</option>
                        <option value="MILLARES">Millares</option>
                      </select>
                    </div>
                    <p className="mt-1 text-[11px] text-ink/45">
                      El motor calcula con tarifas por millar. Equivalente:{" "}
                      {formatMillarEquivalent(cantidad, unidadCantidad)}.
                    </p>
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
                          className={`px-3 py-2 rounded-lg border text-left text-[11px] ${idAcabados.includes(item.idAcabado) ? "border-cyan-press bg-cyan-press/10 text-cyan-press" : "border-ink/10 text-ink/70 hover:bg-ink/2"}`}
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

              <aside className="col-span-5 border border-ink/10 rounded-xl p-4 bg-ink/1 flex flex-col">
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
                    <div className="rounded-lg border border-ink/10 bg-white p-3 text-[11px] text-ink/60">
                      <div className="grid grid-cols-2 gap-2">
                        <span>
                          <strong className="text-ink/75">Producto:</strong>{" "}
                          {costeo.tipoProductoNombre}
                        </span>
                        <span>
                          <strong className="text-ink/75">Cantidad:</strong>{" "}
                          {costeo.cantidad.toLocaleString("es-PE")} millar(es) /{" "}
                          {(Number(costeo.cantidad || 0) * 1000).toLocaleString("es-PE")} unidades
                        </span>
                        <span>
                          <strong className="text-ink/75">Papel:</strong> {costeo.papelNombre}
                        </span>
                        <span>
                          <strong className="text-ink/75">Color:</strong> {costeo.numeroColores}{" "}
                          color(es), {costeo.tipoImpresion.toLowerCase()}
                        </span>
                      </div>
                    </div>

                    {ajustes && (
                      <EditableRatesPanel
                        ajustes={ajustes}
                        catalogo={catalogo}
                        idAcabados={idAcabados}
                        costoDiseno={costoDiseno}
                        onChange={(next) => {
                          setAjustes(next);
                          setCosteo(null);
                        }}
                      />
                    )}

                    <div className="border-t border-ink/10 pt-3 space-y-1 text-sm mt-auto">
                      <div className="flex justify-between text-xs text-ink/60">
                        <span>Subtotal</span>
                        <strong>{money(costeo.subtotal)}</strong>
                      </div>
                      <div className="flex justify-between text-xs text-ink/60">
                        <span>Margen {costeo.porcentajeMargen}%</span>
                        <strong>{money(costeo.montoMargen)}</strong>
                      </div>
                      <div className="flex justify-between text-xs text-ink/60">
                        <span>IGV {costeo.porcentajeIgv}%</span>
                        <strong>{money(costeo.montoIgv)}</strong>
                      </div>
                      <div className="flex justify-between text-xl font-display font-bold text-ink pt-2">
                        <span>Total</span>
                        <span>{money(costeo.total)}</span>
                      </div>
                    </div>
                  </div>
                ) : ajustes ? (
                  <div className="space-y-3 flex-1">
                    <EditableRatesPanel
                      ajustes={ajustes}
                      catalogo={catalogo}
                      idAcabados={idAcabados}
                      costoDiseno={costoDiseno}
                      onChange={(next) => setAjustes(next)}
                    />
                    <div className="flex-1 flex items-center justify-center text-center text-sm text-ink/40 px-8">
                      Ajusta los pesos si necesitas y pulsa Calcular para ver el desglose con
                      formulas.
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center text-sm text-ink/40 px-8">
                    Completa los datos comerciales y calcula para revisar el desglose antes de
                    guardar.
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-ink/5 mt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-ink text-paper rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-ink/90 transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
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
            </div>

            {costeo && (
              <div className="px-6 pb-6">
                <CalculationDetailCollapsible
                  costeo={costeo}
                  open={showCalculoDetalle}
                  onToggle={() => setShowCalculoDetalle((value) => !value)}
                />
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function CalculationDetailCollapsible({
  costeo,
  open,
  onToggle,
  variant = "light",
}: {
  costeo: CosteoResponse;
  open: boolean;
  onToggle: () => void;
  variant?: "dark" | "light";
}) {
  const isDark = variant === "dark";
  const detalle = useMemo(() => resolveDetalleCalculo(costeo), [costeo]);

  return (
    <div
      className={`w-full border rounded-xl overflow-hidden ${
        isDark ? "border-paper/10" : "border-ink/10 bg-white"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`w-full px-4 py-3 flex items-center justify-between transition-colors text-left ${
          isDark ? "bg-paper/5 hover:bg-paper/10 text-paper" : "bg-ink/5 hover:bg-ink/8 text-ink"
        }`}
      >
        <span className="text-xs font-bold uppercase tracking-widest">
          {open ? "Ocultar detalle" : "Ver detalle"}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className={`p-4 border-t ${isDark ? "border-paper/10" : "border-ink/10"}`}>
          <CalculationDetailPanel detalle={detalle} variant={variant} />
        </div>
      )}
    </div>
  );
}

function CalculationDetailPanel({
  detalle,
  desglose,
  variant,
}: {
  detalle: DetalleCalculo;
  desglose?: Cotizacion["desglose"];
  variant: "dark" | "light";
}) {
  const isDark = variant === "dark";
  const wrapper = isDark
    ? "mb-6 border border-paper/10 rounded-lg overflow-hidden"
    : "rounded-lg border border-ink/10 overflow-hidden bg-white";
  const header = isDark
    ? "px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-paper/40 bg-paper/5"
    : "px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-ink/45 bg-ink/3";
  const row = isDark
    ? "grid grid-cols-12 gap-2 px-3 py-2 text-[11px] border-t border-paper/10 text-paper/70"
    : "grid grid-cols-12 gap-2 px-3 py-2 text-[11px] border-t border-ink/5 text-ink/70";
  const moneyClass = isDark ? "font-mono text-paper/85" : "font-mono text-ink/85";

  if (detalle.lineas.length > 0) {
    return (
      <div className={wrapper}>
        <div className={header}>Detalle de calculo</div>
        <div className={`${row} font-semibold text-[10px] uppercase tracking-wide`}>
          <span className="col-span-3">Componente</span>
          <span className="col-span-2">Tipo</span>
          <span className="col-span-3">Formula</span>
          <span className="col-span-2 text-right">Peso</span>
          <span className="col-span-2 text-right">Monto</span>
        </div>
        {detalle.lineas.map((linea) => (
          <CalculationLine
            key={`${linea.componente}-${linea.formula}`}
            linea={linea}
            variant={variant}
          />
        ))}
      </div>
    );
  }

  if (!desglose) {
    return <p className="text-sm text-ink/50">No hay detalle de calculo disponible.</p>;
  }

  const fallbackLines: Array<{ label: string; value?: number | null }> = [
    { label: "Diseno", value: desglose.costoDiseno },
    { label: "Placas", value: desglose.costoPlacas },
    { label: "Material", value: desglose.costoMaterial },
    { label: "Depreciacion", value: desglose.costoDepreciacion },
    { label: "Impresion", value: desglose.costoImpresion },
    { label: "Tinta", value: desglose.costoTinta },
    { label: "Acabados", value: desglose.costoAcabados },
    { label: "Mano de obra", value: desglose.costoManoObra },
  ];

  return (
    <div className={wrapper}>
      <div className={header}>Detalle de calculo</div>
      {fallbackLines.map((line) => (
        <div key={line.label} className={`${row} grid-cols-2`}>
          <span>{line.label}</span>
          <span className={`${moneyClass} text-right`}>{money(line.value)}</span>
        </div>
      ))}
    </div>
  );
}

function CalculationLine({ linea, variant }: { linea: LineaCalculo; variant: "dark" | "light" }) {
  const isDark = variant === "dark";
  const row = isDark
    ? "grid grid-cols-12 gap-2 px-3 py-2 text-[11px] border-t border-paper/10 text-paper/70"
    : "grid grid-cols-12 gap-2 px-3 py-2 text-[11px] border-t border-ink/5 text-ink/70";
  const moneyClass = isDark ? "font-mono text-paper/85" : "font-mono text-ink/85";
  const tipoLabel =
    linea.tipo === "FIJO"
      ? "Fijo"
      : linea.tipo === "POR_MILLAR"
        ? "Por millar"
        : linea.tipo === "PORCENTAJE"
          ? "Porcentaje"
          : "Resumen";
  const pesoLabel =
    linea.peso == null
      ? "—"
      : linea.tipo === "POR_MILLAR" && linea.cantidad != null
        ? `${linea.peso.toLocaleString("es-PE")} × ${linea.cantidad.toLocaleString("es-PE")}`
        : linea.peso.toLocaleString("es-PE");

  return (
    <div className={row}>
      <span className="col-span-3 font-medium">{linea.componente}</span>
      <span className="col-span-2 text-[10px] uppercase tracking-wide opacity-70">{tipoLabel}</span>
      <span className="col-span-3 opacity-80">{linea.formula}</span>
      <span className={`col-span-2 text-right ${moneyClass}`}>{pesoLabel}</span>
      <span className={`col-span-2 text-right font-semibold ${moneyClass}`}>
        {money(linea.monto)}
      </span>
    </div>
  );
}

function EditableRatesPanel({
  ajustes,
  catalogo,
  idAcabados,
  costoDiseno,
  onChange,
}: {
  ajustes: CosteoOverrides;
  catalogo: CatalogoCotizacion;
  idAcabados: number[];
  costoDiseno: string;
  onChange: (next: CosteoOverrides) => void;
}) {
  const updateField = (field: keyof CosteoOverrides, value: number) => {
    onChange({ ...ajustes, [field]: value });
  };

  const updateAcabado = (idAcabado: number, value: number) => {
    const acabados = idAcabados.map((id) => {
      const current = ajustes.acabados?.find((item) => item.idAcabado === id);
      return {
        idAcabado: id,
        precioVentaMillar:
          id === idAcabado
            ? value
            : (current?.precioVentaMillar ??
              catalogo.acabados.find((item) => item.idAcabado === id)?.precioVentaMillar ??
              0),
      };
    });
    onChange({ ...ajustes, acabados });
  };

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-3 space-y-2">
      <p className="text-[10px] font-mono uppercase tracking-widest text-ink/45">
        Pesos editables para esta cotizacion
      </p>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <EditableRate
          label="Diseno (fijo)"
          value={Number(costoDiseno || 0)}
          onChange={() => {}}
          disabled
        />
        <EditableRate
          label="Placas (fijo)"
          value={ajustes.costoPlacas ?? 0}
          onChange={(value) => updateField("costoPlacas", value)}
        />
        <EditableRate
          label="Material / millar"
          value={ajustes.precioMaterialMillar ?? 0}
          onChange={(value) => updateField("precioMaterialMillar", value)}
        />
        <EditableRate
          label="Depreciacion / millar"
          value={ajustes.tarifaDepreciacionMillar ?? 0}
          onChange={(value) => updateField("tarifaDepreciacionMillar", value)}
        />
        <EditableRate
          label="Impresion / millar"
          value={ajustes.tarifaImpresionMillar ?? 0}
          onChange={(value) => updateField("tarifaImpresionMillar", value)}
        />
        <EditableRate
          label="Tinta / millar"
          value={ajustes.tarifaTintaMillar ?? 0}
          onChange={(value) => updateField("tarifaTintaMillar", value)}
        />
        <EditableRate
          label="Mano obra / millar"
          value={ajustes.tarifaManoObraMillar ?? 0}
          onChange={(value) => updateField("tarifaManoObraMillar", value)}
        />
        <EditableRate
          label="Margen %"
          value={ajustes.porcentajeMargen ?? 0}
          onChange={(value) => updateField("porcentajeMargen", value)}
        />
        <EditableRate
          label="IGV %"
          value={ajustes.porcentajeIgv ?? 0}
          onChange={(value) => updateField("porcentajeIgv", value)}
        />
        {idAcabados.map((idAcabado) => {
          const nombre =
            catalogo.acabados.find((item) => item.idAcabado === idAcabado)?.nombre ?? "Acabado";
          const value =
            ajustes.acabados?.find((item) => item.idAcabado === idAcabado)?.precioVentaMillar ??
            catalogo.acabados.find((item) => item.idAcabado === idAcabado)?.precioVentaMillar ??
            0;
          return (
            <EditableRate
              key={idAcabado}
              label={`${nombre} / millar`}
              value={value}
              onChange={(next) => updateAcabado(idAcabado, next)}
            />
          );
        })}
      </div>
    </div>
  );
}

function EditableRate({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[9px] uppercase tracking-widest text-ink/40 mb-1">{label}</span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={Number.isFinite(value) ? value : 0}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full px-2 py-1.5 border border-ink/10 rounded text-xs font-mono disabled:bg-ink/5 disabled:text-ink/40"
      />
    </label>
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

function DetailSpec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-ink/2 p-3">
      <dt className="mb-1 text-[9px] font-mono uppercase tracking-widest text-ink/40">{label}</dt>
      <dd className="truncate text-xs font-semibold text-ink/80">{value}</dd>
    </div>
  );
}

function TotalLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value?: number | null;
  strong?: boolean;
}) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-3">
      <p className="text-[10px] font-mono uppercase tracking-widest text-ink/40">{label}</p>
      <p
        className={`mt-1 font-mono ${strong ? "text-lg font-bold text-ink" : "font-semibold text-ink/75"}`}
      >
        {money(value)}
      </p>
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
