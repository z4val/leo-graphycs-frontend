import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Boxes,
  Clock,
  Coins,
  Filter,
  HelpCircle,
  Lock,
  RefreshCcw,
  TrendingUp,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { authService } from "@/lib/api/auth.service";
import { biService, type BiResumen, type OrigenFiltro, type RangoDias } from "@/lib/api/bi.service";

export const Route = createFileRoute("/bi")({
  beforeLoad: () => {
    if (!authService.isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Tablero BI - LEO GRAPHYC ERP" },
      {
        name: "description",
        content:
          "Inteligencia de negocios: embudo, producción, canales, rentabilidad e inventario.",
      },
    ],
  }),
  component: BiPage,
});

const estadoLabels: Record<string, string> = {
  BORRADOR: "Borrador",
  ENVIADA: "Enviada",
  APROBADA: "Aprobada",
  CONVERTIDA: "Convertida",
  RECHAZADA: "Rechazada",
};

const estadoColor: Record<string, string> = {
  BORRADOR: "var(--ink)",
  ENVIADA: "var(--cyan-press)",
  APROBADA: "var(--emerald-press)",
  CONVERTIDA: "var(--emerald-press)",
  RECHAZADA: "var(--destructive)",
};

const etapaLabels: Record<string, string> = {
  PRE_PRENSA: "Pre-prensa",
  PRENSA: "Prensa",
  POST_PRENSA: "Post-prensa",
};

const etapaColor: Record<string, string> = {
  PRE_PRENSA: "var(--cyan-press)",
  PRENSA: "var(--magenta-press)",
  POST_PRENSA: "var(--yellow-press)",
};

const tipoInsumoLabels: Record<string, string> = {
  PAPEL: "Papel",
  TINTA: "Tinta",
  SOLUCION_FUENTE: "Solución",
};

const rangos: { value: RangoDias; label: string }[] = [
  { value: 7, label: "7 días" },
  { value: 30, label: "30 días" },
  { value: 90, label: "90 días" },
];

const canales: { value: OrigenFiltro; label: string }[] = [
  { value: "TODOS", label: "Todos los canales" },
  { value: "PRESENCIAL", label: "Presencial" },
  { value: "WEB", label: "Web" },
  { value: "TELEGRAM", label: "Telegram" },
];

function BiPage() {
  const user = authService.getCurrentUser();
  const esAdministrador = esRolAdministrador(user?.rol);

  const [dias, setDias] = useState<RangoDias>(30);
  const [origen, setOrigen] = useState<OrigenFiltro>("TODOS");
  const [data, setData] = useState<BiResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (!esAdministrador) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    biService
      .getResumen(dias, origen)
      .then((resumen) => {
        if (!cancelled) setData(resumen);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudo cargar el tablero");
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dias, origen, esAdministrador, reloadKey]);

  if (!esAdministrador) {
    return (
      <AppShell title="Tablero BI">
        <div className="mx-auto mt-16 max-w-md rounded-2xl border border-ink/5 bg-white p-8 text-center">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-ink/5">
            <Lock className="size-5 text-ink/50" />
          </div>
          <h2 className="font-display text-lg font-bold">Acceso restringido</h2>
          <p className="mt-2 text-sm text-ink/55">
            El tablero de inteligencia de negocios es de acceso exclusivo para usuarios con rol{" "}
            <strong className="text-ink/75">Administrador</strong>. Tu rol actual
            {user?.rol ? ` (${user.rol})` : ""} no tiene permiso para visualizarlo.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Tablero BI"
      action={
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="size-8 grid place-items-center border border-ink/10 rounded hover:bg-ink/5 transition-colors"
          title="Actualizar"
          disabled={loading}
        >
          <RefreshCcw className={`size-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      {/* Filtros */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-ink/40">
          <Filter className="size-3.5" /> Filtros
        </span>
        <SegmentedControl
          options={rangos.map((r) => ({ value: String(r.value), label: r.label }))}
          value={String(dias)}
          onChange={(v) => setDias(Number(v) as RangoDias)}
        />
        <select
          value={origen}
          onChange={(e) => setOrigen(e.target.value as OrigenFiltro)}
          className="rounded-md border border-ink/10 bg-white py-1.5 pl-3 pr-8 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-press/40"
        >
          {canales.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <AlertTriangle className="size-4" />
            No se pudo cargar el tablero
          </div>
          <p className="mt-2 text-xs text-ink/55">{error}</p>
          <p className="mt-1 text-xs text-ink/45">
            Verifica que el backend esté levantado en <code>localhost:8080</code> y que existan
            datos (corre el seeder al iniciar la aplicación).
          </p>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="mt-4 rounded bg-ink px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-paper"
          >
            Reintentar
          </button>
        </div>
      ) : loading || !data ? (
        <div className="rounded-xl border border-ink/5 bg-white p-8 text-sm text-ink/50">
          Cargando indicadores...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tarjetas rápidas */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <KpiCard
              label="Cotizaciones"
              value={formatNumber(data.cotizacionesTotales)}
              hint="en el período"
              accent="cyan-press"
              icon={<TrendingUp className="size-4" />}
            />
            <KpiCard
              label="Conversión"
              value={`${data.tasaConversionPct.toFixed(1)}%`}
              hint="ganadas / enviadas"
              accent="emerald-press"
              icon={<TrendingUp className="size-4" />}
            />
            <KpiCard
              label="Margen bruto"
              value={formatCurrency(data.margenBrutoTotal)}
              hint="ventas − costos"
              accent="emerald-press"
              icon={<Coins className="size-4" />}
            />
            <KpiCard
              label="Valor inventario"
              value={formatCurrency(data.valorInventarioTotal)}
              hint="FIFO"
              accent="yellow-press"
              icon={<Boxes className="size-4" />}
            />
            <KpiCard
              label="Alertas de stock"
              value={String(data.alertasStockTotal).padStart(2, "0")}
              hint="bajo el mínimo"
              accent="magenta-press"
              icon={<AlertTriangle className="size-4" />}
            />
          </div>

          {/* Fila comercial */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Embudo de ventas" subtitle="Cotizaciones por estado del ciclo comercial">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={data.embudo.map((e) => ({
                    name: estadoLabels[e.estado],
                    estado: e.estado,
                    cotizaciones: e.cotizaciones,
                    monto: e.montoPotencial,
                  }))}
                  layout="vertical"
                  margin={{ left: 8, right: 24 }}
                >
                  <CartesianGrid horizontal={false} strokeOpacity={0.1} />
                  <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={78}
                  />
                  <Tooltip content={<EmbudoTooltip />} cursor={{ fillOpacity: 0.04 }} />
                  <Bar dataKey="cotizaciones" radius={[0, 4, 4, 0]} barSize={22}>
                    {data.embudo.map((e) => (
                      <Cell key={e.estado} fill={estadoColor[e.estado]} />
                    ))}
                    <LabelList dataKey="cotizaciones" position="right" fontSize={11} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <Interpretacion>
                Lee este bloque como el avance de las cotizaciones por estado. Un volumen alto en{" "}
                <em>Enviada</em> sugiere revisar seguimiento comercial; un volumen alto en{" "}
                <em>Borrador</em> indica trabajo pendiente antes de contactar al cliente.
              </Interpretacion>
            </Panel>

            <Panel
              title="Efectividad de atención por canal"
              subtitle="Enviadas vs. ganadas por origen de la solicitud"
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={data.efectividadCanal.map((c) => ({
                    name: c.origen === "TELEGRAM" || c.origen === "CHATWOOT" ? "Telegram" : capitalize(c.origen),
                    Enviadas: c.enviadas,
                    Ganadas: c.ganadas,
                  }))}
                  margin={{ left: 8, right: 8 }}
                >
                  <CartesianGrid vertical={false} strokeOpacity={0.1} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip cursor={{ fillOpacity: 0.04 }} />
                  <Bar
                    dataKey="Enviadas"
                    fill="var(--ink)"
                    fillOpacity={0.18}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar dataKey="Ganadas" fill="var(--emerald-press)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <Interpretacion>
                Compara cuántas cotizaciones se enviaron y cuántas terminaron ganadas por canal. Si
                un origen genera muchas enviadas pero pocas ganadas, conviene revisar la calidad del
                contacto, el precio presentado o el traspaso al asesor.
              </Interpretacion>
            </Panel>
          </div>

          {/* Fila operativa + tiempo cotización */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel
              title="Tiempos de producción por etapa"
              subtitle="Horas promedio en cada columna del Kanban"
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={data.tiemposProduccion.map((t) => ({
                    name: etapaLabels[t.etapa],
                    etapa: t.etapa,
                    horas: t.horasPromedio,
                  }))}
                  margin={{ left: 8, right: 8 }}
                >
                  <CartesianGrid vertical={false} strokeOpacity={0.1} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                    unit="h"
                  />
                  <Tooltip
                    cursor={{ fillOpacity: 0.04 }}
                    formatter={(v) => [`${v} h`, "Promedio"]}
                  />
                  <Bar dataKey="horas" radius={[4, 4, 0, 0]} barSize={48}>
                    {data.tiemposProduccion.map((t) => (
                      <Cell key={t.etapa} fill={etapaColor[t.etapa]} />
                    ))}
                    <LabelList
                      dataKey="horas"
                      position="top"
                      fontSize={11}
                      formatter={(v: number) => `${v}h`}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <Interpretacion>
                Usa este gráfico para detectar dónde se acumula más tiempo dentro del flujo de
                producción. La etapa con mayor promedio debe contrastarse con las órdenes abiertas
                en Kanban y con los compromisos de entrega.
              </Interpretacion>
            </Panel>

            <Panel
              title="Cotización y calidad"
              subtitle="Tiempo de respuesta y reprocesos de producción"
            >
              <div className="grid grid-cols-3 gap-3 py-2">
                <TimeStat
                  label="Cotización"
                  sublabel="creación → aprob."
                  value={
                    data.horasCotizacionPromedio == null
                      ? "—"
                      : formatHours(data.horasCotizacionPromedio)
                  }
                  accent="cyan-press"
                />
                <TimeStat
                  label="Respondidas"
                  sublabel="con aprobación"
                  value={formatNumber(data.cotizacionesRespondidas)}
                  accent="emerald-press"
                />
                <TimeStat
                  label="Reprocesos"
                  sublabel="de las órdenes"
                  value={`${data.tasaReprocesoPct.toFixed(1)}%`}
                  accent="magenta-press"
                />
              </div>
              <Interpretacion>
                Este bloque ayuda a separar velocidad comercial y calidad operativa. Si el tiempo de
                cotización sube, revisa aprobaciones pendientes; si los reprocesos suben, revisa
                causas de calidad antes de evaluar rentabilidad.
              </Interpretacion>
            </Panel>
          </div>

          {/* Rentabilidad */}
          <Panel
            title="Rentabilidad por orden"
            subtitle="Precio de venta vs. costo estimado y material real (FIFO)"
          >
            {data.rentabilidad.length === 0 ? (
              <p className="rounded-lg border border-ink/5 bg-ink/2 px-3 py-4 text-xs text-ink/45">
                Sin órdenes de trabajo en el período seleccionado.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink/5 text-[10px] uppercase tracking-widest text-ink/40">
                      <th className="px-3 py-2 text-left font-medium">Orden</th>
                      <th className="px-3 py-2 text-right font-medium">Precio venta</th>
                      <th className="px-3 py-2 text-right font-medium">Costo estimado</th>
                      <th className="px-3 py-2 text-right font-medium">Material real (FIFO)</th>
                      <th className="px-3 py-2 text-right font-medium">Margen bruto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rentabilidad.map((o) => (
                      <tr
                        key={o.codigo}
                        className="border-b border-ink/5 last:border-0 hover:bg-ink/2"
                      >
                        <td className="px-3 py-2.5 font-mono text-xs font-semibold">{o.codigo}</td>
                        <td className="px-3 py-2.5 text-right font-mono">
                          {formatCurrency(o.precioVenta)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-ink/55">
                          {formatCurrency(o.costoEstimado)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-ink/55">
                          {o.costoMaterialReal > 0 ? (
                            formatCurrency(o.costoMaterialReal)
                          ) : (
                            <span className="text-ink/30">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-press">
                          {formatCurrency(o.margenBruto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-ink/10 text-xs font-bold">
                      <td className="px-3 py-2.5 uppercase tracking-widest text-ink/40">Total</td>
                      <td className="px-3 py-2.5 text-right font-mono">
                        {formatCurrency(sum(data.rentabilidad, "precioVenta"))}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-ink/55">
                        {formatCurrency(sum(data.rentabilidad, "costoEstimado"))}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-ink/55">
                        {formatCurrency(sum(data.rentabilidad, "costoMaterialReal"))}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-emerald-press">
                        {formatCurrency(sum(data.rentabilidad, "margenBruto"))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            <Interpretacion>
              Revisa cada fila como una comparación entre lo cotizado, lo estimado y lo consumido.
              Diferencias grandes entre costo estimado y material real pueden indicar cambios de
              precios, consumo adicional o una cotización que debe ajustarse.
            </Interpretacion>
          </Panel>

          {/* Fila complementaria: inventario + pendientes */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Inventario" subtitle="Alertas de stock y valor valorizado con FIFO">
              <div className="mb-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-ink/40">
                  Bajo el mínimo
                </p>
                {data.alertasStock.length === 0 ? (
                  <p className="rounded-lg border border-ink/5 bg-ink/2 px-3 py-2 text-xs text-ink/45">
                    Sin alertas: todos los insumos sobre el mínimo.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data.alertasStock.map((a) => (
                      <div
                        key={a.nombre}
                        className="flex items-center gap-3 rounded-lg border border-destructive/15 bg-destructive/5 px-3 py-2"
                      >
                        <AlertTriangle className="size-4 shrink-0 text-destructive" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold">{a.nombre}</p>
                          <p className="text-[10px] text-ink/45">
                            {tipoInsumoLabels[a.tipoInsumo]}
                          </p>
                        </div>
                        <p className="font-mono text-xs text-destructive">
                          {formatNumber(a.stockActual)} / {formatNumber(a.stockMinimo)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40">
                    Valor del inventario (FIFO)
                  </p>
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold">
                    <Boxes className="size-3.5 text-ink/40" />
                    {formatCurrency(data.valorInventarioTotal)}
                  </span>
                </div>
                {data.valorInventario.length === 0 ? (
                  <p className="text-xs text-ink/40">Sin lotes registrados.</p>
                ) : (
                  <div className="space-y-1.5">
                    {data.valorInventario.map((v) => (
                      <div key={v.nombre} className="flex items-center justify-between text-xs">
                        <span className="truncate text-ink/60">{v.nombre}</span>
                        <span className="font-mono text-ink/70">
                          {formatCurrency(v.valorInventario)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Interpretacion>
                Usa las alertas para priorizar reposición antes de que el stock afecte producción.
                El valor FIFO permite entender cuánto capital está inmovilizado en insumos.
              </Interpretacion>
            </Panel>

            <Panel title="KPIs pendientes" subtitle="Requieren módulos aún no modelados">
              <ul className="space-y-2 text-xs text-ink/60">
                <PendienteItem
                  titulo="Ingresos cobrados y saldos por cobrar"
                  detalle="Requiere las tablas pago / medio_pago (módulo financiero)."
                />
                <PendienteItem
                  titulo="Entregas parciales y % de cumplimiento"
                  detalle="Requiere la tabla entrega."
                />
                <PendienteItem
                  titulo="Tiempo de emisión vs. decisión del cliente"
                  detalle="Requiere fecha_envio y fecha_respuesta en la cotización."
                />
              </ul>
              <Interpretacion>
                Estos indicadores aparecen como pendientes porque dependen de datos transaccionales
                que todavía no forman parte completa del flujo. Sirven como mapa de crecimiento del
                BI.
              </Interpretacion>
            </Panel>
          </div>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="fixed bottom-5 right-5 z-30 inline-flex size-11 items-center justify-center rounded-full bg-ink text-paper shadow-lg shadow-ink/20 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-press/50"
            title="Ayuda del tablero"
          >
            <HelpCircle className="size-5" />
          </button>
          {helpOpen && <BiHelpPopup onClose={() => setHelpOpen(false)} />}
        </div>
      )}
    </AppShell>
  );
}

/* ============================ Subcomponentes ============================ */

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-ink/10 bg-white p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
            value === o.value ? "bg-ink text-paper" : "text-ink/55 hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-ink/5 bg-white p-4">
      <div className={`absolute left-0 top-0 h-0.5 w-12 ${accentBarClass[accent]}`} />
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">{label}</span>
        <span className="text-ink/30">{icon}</span>
      </div>
      <p className="font-display text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-[10px] text-ink/40">{hint}</p>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-ink/5 bg-white p-5">
      <header className="mb-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-ink/45">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

function Interpretacion({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 border-t border-ink/5 pt-3">
      <p className="flex gap-2 text-xs leading-relaxed text-ink/55">
        <span className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-cyan-press">
          Lectura
        </span>
        <span>{children}</span>
      </p>
    </div>
  );
}

function BiHelpPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 bg-ink/20 px-4 py-6 backdrop-blur-sm">
      <div className="ml-auto flex h-full max-w-sm flex-col rounded-xl border border-ink/10 bg-white shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-ink/5 p-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-press">
              Ayuda BI
            </p>
            <h3 className="mt-1 font-display text-lg font-bold">Cómo leer el tablero</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded border border-ink/10 text-ink/55 transition-colors hover:bg-ink/5"
            title="Cerrar ayuda"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="space-y-4 overflow-y-auto p-4 text-sm leading-relaxed text-ink/60">
          <p>
            El tablero resume datos transaccionales del sistema según el rango y canal seleccionados.
            Si la base está vacía, los gráficos también aparecerán vacíos o en cero.
          </p>
          <HelpItem
            title="Embudo comercial"
            text="Muestra en qué estado están las cotizaciones. Sirve para detectar seguimiento pendiente, aprobaciones y oportunidades perdidas."
          />
          <HelpItem
            title="Canales"
            text="Compara el origen de las solicitudes. Web, Presencial y Telegram se interpretan por volumen enviado y cotizaciones ganadas."
          />
          <HelpItem
            title="Producción"
            text="Los tiempos por etapa se leen como una señal de carga o demora. Deben revisarse junto con el Kanban operativo."
          />
          <HelpItem
            title="Rentabilidad"
            text="Contrasta precio de venta, costo estimado y material real FIFO. Las diferencias ayudan a revisar costeo o consumo."
          />
          <HelpItem
            title="Inventario"
            text="Las alertas priorizan reposición. El valor FIFO indica capital inmovilizado en insumos disponibles."
          />
        </div>
      </div>
    </div>
  );
}

function HelpItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-ink/5 bg-ink/2 px-3 py-2">
      <p className="text-xs font-bold uppercase tracking-wider text-ink/70">{title}</p>
      <p className="mt-1 text-xs text-ink/50">{text}</p>
    </div>
  );
}

function TimeStat({
  label,
  sublabel,
  value,
  accent,
}: {
  label: string;
  sublabel: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-ink/5 bg-ink/2 p-3 text-center">
      <div className={`mx-auto mb-1.5 h-0.5 w-8 ${accentBarClass[accent]}`} />
      <p className="font-display text-lg font-bold">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/50">{label}</p>
      <p className="text-[9px] text-ink/35">{sublabel}</p>
    </div>
  );
}

function PendienteItem({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <li className="flex gap-2 rounded-lg border border-ink/5 bg-ink/2 px-3 py-2">
      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-ink/25" />
      <span>
        <span className="font-semibold text-ink/70">{titulo}</span>
        <span className="block text-[11px] text-ink/45">{detalle}</span>
      </span>
    </li>
  );
}

function EmbudoTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { name: string; cotizaciones: number; monto: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold">{d.name}</p>
      <p className="text-ink/55">{formatNumber(d.cotizaciones)} cotizaciones</p>
      <p className="text-ink/55">{formatCurrency(d.monto)} potencial</p>
    </div>
  );
}

const accentBarClass: Record<string, string> = {
  "cyan-press": "bg-cyan-press",
  "magenta-press": "bg-magenta-press",
  "yellow-press": "bg-yellow-press",
  "emerald-press": "bg-emerald-press",
};

/* ============================== Helpers ============================== */

function sum<T>(items: T[], key: keyof T) {
  return items.reduce((total, item) => total + Number(item[key] ?? 0), 0);
}

function capitalize(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
    Number(value || 0),
  );
}

function formatHours(value: number) {
  return `${Number(value || 0).toFixed(1)} h`;
}

function esRolAdministrador(rol?: string | null) {
  const normalized = (rol ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
  return normalized === "administrador" || normalized === "admin";
}
