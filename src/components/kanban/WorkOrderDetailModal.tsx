import type { ReactNode } from "react";
import {
  Dialog,

  DialogContent,

  DialogDescription,

  DialogHeader,

  DialogTitle,

} from "@/components/ui/dialog";

import { cn } from "@/lib/utils";

import type { WorkOrder } from "./types";

import { sumEntregas } from "./types";

import {

  formatCantidad,

  formatSoles,

  labelColores,

  labelEstadoOrden,

  labelOrigen,

} from "./format";



interface WorkOrderDetailModalProps {

  order: WorkOrder | null;

  open: boolean;

  onOpenChange: (open: boolean) => void;

}



export function WorkOrderDetailModal({ order, open, onOpenChange }: WorkOrderDetailModalProps) {

  if (!order) return null;



  const { cotizacion: c } = order;

  const entregado = sumEntregas(order.entregas);

  const pendienteEntrega = Math.max(0, c.cantidad - entregado);

  const saldada = order.saldoPendiente <= 0;



  return (

    <Dialog open={open} onOpenChange={onOpenChange}>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto gap-0 p-0 sm:rounded-xl border-ink/10">

        <DialogHeader className="px-6 pt-6 pb-4 border-b border-ink/5 sticky top-0 bg-paper z-10">

          <div className="flex flex-wrap items-start justify-between gap-3 pr-8">

            <div>

              <DialogTitle className="font-display text-xl uppercase tracking-tight">

                {order.codigo}

              </DialogTitle>

              <DialogDescription className="text-xs mt-1">

                Cotización {c.codigo} · {labelOrigen(c.origen)} · {c.tipoImpresion}

              </DialogDescription>

            </div>

            <div className="flex flex-wrap gap-2">

              <Badge>{labelEstadoOrden(order.estado)}</Badge>

              {order.numeroReprocesos > 0 && (

                <Badge variant="warning">Reproceso #{order.numeroReprocesos}</Badge>

              )}

              {order.vencida && <Badge variant="danger">Vencida</Badge>}

            </div>

          </div>

        </DialogHeader>



        <div className="px-6 py-5 space-y-8">

          <Section title="Cliente">

            <Dl>

              <Row label="Nombre / razón social" value={order.cliente.nombre} />

              <Row

                label="Documento"

                value={`${order.cliente.tipoDocumento} ${order.cliente.numeroDocumento}`}

              />

              {order.cliente.telefono && <Row label="Teléfono" value={order.cliente.telefono} />}

              {order.cliente.correo && <Row label="Correo" value={order.cliente.correo} />}

            </Dl>

          </Section>



          <Section title="Producto y especificaciones">

            <Dl>

              <Row label="Categoría" value={c.categoriaProducto} />

              <Row label="Tipo de producto" value={c.tipoProducto} />

              <Row label="Tamaño" value={c.tamano} />

              <Row

                label="Cantidad"

                value={formatCantidad(c.cantidad, c.unidadMedida.toLowerCase())}

              />

              <Row

                label="Papel / material"

                value={`${c.papel.nombre}${c.papel.gramaje ? ` · ${c.papel.gramaje}g` : ""}${c.papel.medida ? ` · ${c.papel.medida}` : ""}`}

              />

              <Row

                label="Colores"

                value={`${labelColores(c.colores.numero)} — placas ${formatSoles(c.colores.costoPlacas)} · impresión ${formatSoles(c.colores.tarifaImpresionMillar)}/millar`}

              />

              <Row

                label="Acabados"

                value={

                  c.acabados.length > 0

                    ? c.acabados.map((a) => `${a.nombre} (${formatSoles(a.precioMillar)}/millar)`).join(", ")

                    : "Sin acabados"

                }

              />

              {c.observaciones && <Row label="Obs. cotización" value={c.observaciones} />}

            </Dl>

          </Section>



          <Section title="Costeo (snapshot cotización)">

            <div className="rounded-lg border border-ink/10 overflow-hidden text-sm">

              <table className="w-full">

                <tbody className="divide-y divide-ink/5">

                  <CostRow label="Diseño (fijo)" value={c.costos.diseno} />

                  <CostRow label="Placas (fijo)" value={c.costos.placas} />

                  <CostRow label="Material" value={c.costos.costoMaterial} />

                  <CostRow label="Depreciación" value={c.costos.depreciacion} />

                  <CostRow label="Impresión" value={c.costos.impresion} />

                  <CostRow label="Tinta" value={c.costos.tinta} />

                  <CostRow label="Acabados" value={c.costos.acabados} />

                  <CostRow label="Mano de obra" value={c.costos.manoObra} />

                  <tr className="bg-ink/[0.03] font-semibold">

                    <td className="px-3 py-2 text-ink/70">Subtotal</td>

                    <td className="px-3 py-2 text-right font-mono">{formatSoles(c.subtotal)}</td>

                  </tr>

                  <CostRow

                    label={`Margen (${c.porcentajeMargen} %)`}

                    value={c.montoMargen}

                    muted

                  />

                  <tr className="font-medium">

                    <td className="px-3 py-2 text-ink/70">Base imponible</td>

                    <td className="px-3 py-2 text-right font-mono">{formatSoles(c.baseImponible)}</td>

                  </tr>

                  <CostRow label={`IGV (${c.porcentajeIgv} %)`} value={c.montoIgv} muted />

                  <tr className="bg-ink text-paper font-bold">

                    <td className="px-3 py-2.5">Total cotizado</td>

                    <td className="px-3 py-2.5 text-right font-mono">{formatSoles(c.total)}</td>

                  </tr>

                </tbody>

              </table>

            </div>

            <p className="text-[10px] text-ink/40 mt-2 font-mono uppercase tracking-widest">

              Monto en orden: {formatSoles(order.montoTotal)} (copiado al aprobar cotización)

            </p>

          </Section>



          <Section title="Fechas y observaciones">

            <Dl>

              <Row label="Creación" value={order.fechaCreacion} />

              {order.fechaEstimadaEntrega && (

                <Row label="Entrega estimada" value={order.fechaEstimadaEntrega} />

              )}

              {order.fechaEntregaReal && (

                <Row label="Entrega real" value={order.fechaEntregaReal} />

              )}

              {order.observaciones && <Row label="Observaciones OT" value={order.observaciones} />}

            </Dl>

          </Section>



          <Section title="Historial de estados (Kanban)">

            {order.historialEstados.length === 0 ? (

              <Empty>Sin movimientos registrados</Empty>

            ) : (

              <Timeline>

                {order.historialEstados.map((h, i) => (

                  <li key={i} className="text-sm">

                    <span className="font-mono text-[10px] text-ink/40">{h.fecha}</span>

                    <p className="font-medium mt-0.5">

                      {h.estadoAnterior ? labelEstadoOrden(h.estadoAnterior) : "—"} →{" "}

                      {labelEstadoOrden(h.estadoNuevo)}

                    </p>

                    <p className="text-xs text-ink/50">{h.usuario}</p>

                    {h.observaciones && (

                      <p className="text-xs text-ink/60 mt-1">{h.observaciones}</p>

                    )}

                  </li>

                ))}

              </Timeline>

            )}

          </Section>



          <Section title="Aprobación de diseño (pre-prensa)">

            {order.aprobacionesDiseno.length === 0 ? (

              <Empty>Pendiente de aprobación del cliente</Empty>

            ) : (

              <ul className="space-y-3">

                {order.aprobacionesDiseno.map((a, i) => (

                  <li key={i} className="text-sm border border-ink/5 rounded-lg p-3">

                    <p className="font-medium">{a.fecha}</p>

                    {a.aprobadoPor && (

                      <p className="text-xs text-ink/60">Aprobado por: {a.aprobadoPor}</p>

                    )}

                    <p className="text-xs text-ink/50">Registró: {a.usuarioRegistra}</p>

                    {a.observaciones && (

                      <p className="text-xs mt-1 text-ink/70">{a.observaciones}</p>

                    )}

                  </li>

                ))}

              </ul>

            )}

          </Section>



          <Section title="Operaciones de máquina">

            {order.operacionesMaquina.length === 0 ? (

              <Empty>Sin operaciones registradas</Empty>

            ) : (

              <ul className="space-y-2">

                {order.operacionesMaquina.map((op, i) => (

                  <li

                    key={i}

                    className="flex flex-wrap justify-between gap-2 text-sm border border-ink/5 rounded-lg px-3 py-2"

                  >

                    <div>

                      <p className="font-semibold">{op.maquina}</p>

                      <p className="text-[10px] font-mono uppercase text-ink/40">{op.tipo}</p>

                    </div>

                    <div className="text-right text-xs text-ink/50">

                      <p>Inicio: {op.fechaInicio}</p>

                      {op.fechaFin && <p>Fin: {op.fechaFin}</p>}

                      {op.usuario && <p>{op.usuario}</p>}

                    </div>

                  </li>

                ))}

              </ul>

            )}

          </Section>



          <Section title="Control de calidad (post-prensa)">

            {order.controlesCalidad.length === 0 ? (

              <Empty>Sin registros de control de calidad</Empty>

            ) : (

              <ul className="space-y-2">

                {order.controlesCalidad.map((qc, i) => (

                  <li

                    key={i}

                    className={cn(

                      "text-sm border rounded-lg px-3 py-2",

                      qc.resultado === "APROBADO"

                        ? "border-emerald-press/30 bg-emerald-press/5"

                        : "border-destructive/30 bg-destructive/5",

                    )}

                  >

                    <p className="font-bold text-xs uppercase tracking-widest">

                      {qc.resultado}

                      {qc.cantidadVerificada != null &&

                        ` · ${formatCantidad(qc.cantidadVerificada, c.unidadMedida.toLowerCase())} verificados`}

                    </p>

                    <p className="text-xs text-ink/50 mt-1">

                      {qc.fecha} — {qc.usuario}

                    </p>

                    {qc.observaciones && (

                      <p className="text-xs mt-2 text-ink/70">{qc.observaciones}</p>

                    )}

                  </li>

                ))}

              </ul>

            )}

          </Section>



          <Section title="Entregas">

            <Dl>

              <Row

                label="Cantidad pedida"

                value={formatCantidad(c.cantidad, c.unidadMedida.toLowerCase())}

              />

              <Row

                label="Entregado"

                value={formatCantidad(entregado, c.unidadMedida.toLowerCase())}

              />

              <Row

                label="Pendiente"

                value={formatCantidad(pendienteEntrega, c.unidadMedida.toLowerCase())}

              />

            </Dl>

            {order.entregas.length > 0 && (

              <ul className="mt-3 space-y-2">

                {order.entregas.map((e, i) => (

                  <li key={i} className="text-sm border border-ink/5 rounded-lg px-3 py-2">

                    <p className="font-medium">

                      {formatCantidad(e.cantidadEntregada, c.unidadMedida.toLowerCase())} — {e.fecha}

                    </p>

                    <p className="text-xs text-ink/50">{e.usuario}</p>

                    {e.observaciones && <p className="text-xs mt-1">{e.observaciones}</p>}

                  </li>

                ))}

              </ul>

            )}

          </Section>



          <Section title="Pagos y saldo">

            <div className="grid grid-cols-3 gap-3 mb-3">

              <StatBox label="Monto total" value={formatSoles(order.montoTotal)} />

              <StatBox label="Pagado" value={formatSoles(order.totalPagado)} />

              <StatBox

                label="Saldo"

                value={formatSoles(order.saldoPendiente)}

                highlight={!saldada}

              />

            </div>

            {order.pagos.length === 0 ? (

              <Empty>Sin pagos registrados</Empty>

            ) : (

              <ul className="space-y-2">

                {order.pagos.map((p, i) => (

                  <li

                    key={i}

                    className="flex justify-between text-sm border border-ink/5 rounded-lg px-3 py-2"

                  >

                    <div>

                      <p className="font-semibold">{formatSoles(p.monto)}</p>

                      <p className="text-xs text-ink/50">{p.medioPago}</p>

                    </div>

                    <div className="text-right text-xs text-ink/50">

                      <p>{p.fecha}</p>

                      <p>{p.usuario}</p>

                    </div>

                  </li>

                ))}

              </ul>

            )}

          </Section>

        </div>

      </DialogContent>

    </Dialog>

  );

}



function Section({ title, children }: { title: string; children: ReactNode }) {

  return (

    <section>

      <h3 className="font-display font-bold text-xs uppercase tracking-widest text-ink/50 mb-3 border-b border-ink/5 pb-1.5">

        {title}

      </h3>

      {children}

    </section>

  );

}



function Dl({ children }: { children: ReactNode }) {

  return <dl className="grid gap-2 sm:grid-cols-2">{children}</dl>;

}



function Row({ label, value }: { label: string; value: string }) {

  return (

    <div>

      <dt className="text-[10px] font-mono uppercase tracking-widest text-ink/40">{label}</dt>

      <dd className="text-sm font-medium mt-0.5">{value}</dd>

    </div>

  );

}



function CostRow({

  label,

  value,

  muted,

}: {

  label: string;

  value: number;

  muted?: boolean;

}) {

  return (

    <tr className={muted ? "text-ink/60" : undefined}>

      <td className="px-3 py-1.5 text-ink/70">{label}</td>

      <td className="px-3 py-1.5 text-right font-mono text-sm">{formatSoles(value)}</td>

    </tr>

  );

}



function Badge({

  children,

  variant = "default",

}: {

  children: ReactNode;

  variant?: "default" | "warning" | "danger";

}) {

  return (

    <span

      className={cn(

        "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border",

        variant === "default" && "bg-ink/5 border-ink/10 text-ink/70",

        variant === "warning" && "bg-yellow-press/20 border-yellow-press/40 text-ink/80",

        variant === "danger" && "bg-destructive/10 border-destructive/25 text-destructive",

      )}

    >

      {children}

    </span>

  );

}



function StatBox({

  label,

  value,

  highlight,

}: {

  label: string;

  value: string;

  highlight?: boolean;

}) {

  return (

    <div

      className={cn(

        "rounded-lg border p-3",

        highlight ? "border-magenta-press/30 bg-magenta-press/5" : "border-ink/10 bg-white",

      )}

    >

      <p className="text-[10px] font-mono uppercase tracking-widest text-ink/40">{label}</p>

      <p className="font-display font-bold text-lg mt-1">{value}</p>

    </div>

  );

}



function Timeline({ children }: { children: ReactNode }) {

  return <ol className="space-y-4 border-l-2 border-ink/10 pl-4 ml-1">{children}</ol>;

}



function Empty({ children }: { children: ReactNode }) {

  return (

    <p className="text-xs text-ink/40 font-mono uppercase tracking-widest py-2">{children}</p>

  );

}


