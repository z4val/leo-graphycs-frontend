import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { kanbanService } from "@/lib/api/kanban.service";
import { pagosService, type MedioPago } from "@/lib/api/pagos.service";
import { inventoryService, type Insumo } from "@/lib/api/inventory.service";
import {
  Dialog,

  DialogContent,

  DialogDescription,

  DialogHeader,

  DialogTitle,

} from "@/components/ui/dialog";

import { cn } from "@/lib/utils";

import type { Pago, WorkOrder } from "./types";

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
  onOrderUpdated?: (order: WorkOrder) => void;

}



export function WorkOrderDetailModal({ order, open, onOpenChange, onOrderUpdated }: WorkOrderDetailModalProps) {
  const [preview, setPreview] = useState<Pago | null>(null);

  if (!order) return null;



  const { cotizacion: c } = order;

  const entregado = sumEntregas(order.entregas);

  const pendienteEntrega = Math.max(0, c.cantidad - entregado);

  const saldada = order.saldoPendiente <= 0;



  return (

    <>
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
          <OperationalActions order={order} onUpdated={onOrderUpdated} />
          <OperationalFindings order={order} pendienteEntrega={pendienteEntrega} />

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

                    className={cn(
                      "flex justify-between gap-3 text-sm border rounded-lg px-3 py-2",
                      p.anulado ? "border-destructive/20 bg-destructive/5 opacity-75" : "border-ink/5",
                    )}

                  >

                    <div>

                      <p className="font-semibold">{formatSoles(p.monto)}</p>

                      <p className="text-xs text-ink/50">
                        {p.medioPago}
                        {p.anulado && <span className="ml-2 font-bold text-destructive">ANULADO</span>}
                      </p>
                      {p.numeroOperacion && (
                        <p className="text-[10px] font-mono text-ink/40">
                          Op. {p.numeroOperacion}
                        </p>
                      )}
                      {p.observaciones && <p className="text-xs text-ink/60 mt-1">{p.observaciones}</p>}
                      {p.comprobanteUrl && !p.anulado && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPreview(p);
                          }}
                          className="mt-1 inline-flex text-[10px] font-bold uppercase tracking-wider text-cyan-press hover:underline"
                        >
                          {p.comprobanteNombre ?? "Ver comprobante"}
                        </button>
                      )}
                      {p.anulado && (
                        <p className="mt-1 text-[10px] text-destructive">
                          {p.motivoAnulacion}
                          {p.usuarioAnulacion ? ` · ${p.usuarioAnulacion}` : ""}
                        </p>
                      )}

                    </div>

                    <div className="text-right text-xs text-ink/50">

                      <p>{p.fecha}</p>

                      <p>{p.usuario}</p>
                      {!p.anulado && p.idPago && (
                        <button
                          type="button"
                          onClick={() => {
                            void anularPago(order, p, onOrderUpdated).catch((error) => {
                              window.alert(error instanceof Error ? error.message : "No se pudo anular el pago");
                            });
                          }}
                          className="mt-1 text-[10px] font-bold uppercase tracking-wider text-destructive hover:underline"
                        >
                          Anular
                        </button>
                      )}

                    </div>

                  </li>

                ))}

              </ul>

            )}

          </Section>

        </div>

      </DialogContent>

    </Dialog>
    {preview && <PaymentPreviewModal pago={preview} onClose={() => setPreview(null)} />}
    </>

  );

}



async function anularPago(
  order: WorkOrder,
  pago: Pago,
  onUpdated?: (order: WorkOrder) => void,
) {
  if (!pago.idPago) return;
  const motivo = window.prompt("Motivo de anulación del pago");
  if (!motivo || !motivo.trim()) return;
  await pagosService.anular(order.id, pago.idPago, motivo.trim());
  const updated = (await kanbanService.listarOrdenes()).find((item) => item.id === order.id);
  if (updated) onUpdated?.(updated);
}



function PaymentPreviewModal({ pago, onClose }: { pago: Pago; onClose: () => void }) {
  const isPdf = pago.comprobanteContentType === "application/pdf";
  const isImage = pago.comprobanteContentType?.startsWith("image/");

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-auto flex h-full max-w-4xl flex-col rounded-xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40">
              Comprobante de pago
            </p>
            <p className="truncate text-sm font-semibold">{pago.comprobanteNombre ?? "Archivo"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-ink/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
          >
            Cerrar
          </button>
        </div>
        <div className="grid min-h-0 flex-1 place-items-center bg-ink/5 p-4">
          {isPdf && pago.comprobanteUrl ? (
            <iframe title="Comprobante PDF" src={pago.comprobanteUrl} className="h-full w-full rounded bg-white" />
          ) : isImage && pago.comprobanteUrl ? (
            <img
              src={pago.comprobanteUrl}
              alt={pago.comprobanteNombre ?? "Comprobante"}
              className="max-h-full max-w-full rounded object-contain"
            />
          ) : pago.comprobanteUrl ? (
            <a
              href={pago.comprobanteUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded bg-ink px-4 py-2 text-sm font-semibold text-paper"
            >
              Abrir archivo
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}



function OperationalFindings({ order, pendienteEntrega }: { order: WorkOrder; pendienteEntrega: number }) {
  const findings = [
    order.estado === "PRE_PRENSA" && order.aprobacionesDiseno.length === 0
      ? "Falta aprobación de diseño para enviar a prensa."
      : null,
    order.estado === "POST_PRENSA" &&
    !order.controlesCalidad.some((control) => control.resultado === "APROBADO")
      ? "Falta control de calidad aprobado para entregar."
      : null,
    pendienteEntrega > 0
      ? `Entrega pendiente: ${formatCantidad(pendienteEntrega, order.cotizacion.unidadMedida.toLowerCase())}.`
      : "Entrega completa registrada.",
    order.saldoPendiente > 0
      ? `Saldo pendiente: ${formatSoles(order.saldoPendiente)}.`
      : "Orden saldada.",
    order.numeroReprocesos > 0 ? `Tiene ${order.numeroReprocesos} reproceso(s) registrado(s).` : null,
    order.vencida ? "La orden está vencida según su fecha estimada." : null,
  ].filter((finding): finding is string => Boolean(finding));

  return (
    <Section title="Hallazgos operativos">
      <div className="grid gap-2 sm:grid-cols-2">
        {findings.map((finding) => (
          <div key={finding} className="rounded-lg border border-ink/5 bg-ink/2 px-3 py-2 text-xs text-ink/65">
            {finding}
          </div>
        ))}
      </div>
    </Section>
  );
}



function OperationalActions({ order, onUpdated }: { order: WorkOrder; onUpdated?: (order: WorkOrder) => void }) {
  const [medios, setMedios] = useState<MedioPago[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [transitionNote, setTransitionNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [clientMessage, setClientMessage] = useState(defaultClientMessage(order));

  useEffect(() => {
    Promise.all([pagosService.medios(), inventoryService.getInsumos()])
      .then(([m, i]) => { setMedios(m); setInsumos(i); })
      .catch(() => undefined);
  }, []);

  const run = async (action: () => Promise<WorkOrder>) => {
    setBusy(true); setError("");
    try { onUpdated?.(await action()); } catch (e) { setError(e instanceof Error ? e.message : "No se pudo completar la accion"); }
    finally { setBusy(false); }
  };

  const advance = order.estado === "PRE_PRENSA" ? "PRENSA" : order.estado === "PRENSA" ? "POST_PRENSA" : "ENTREGADO";
  const transitionActions = getTransitionActions(order.estado);
  const input = "w-full rounded border border-ink/15 px-2 py-1.5 text-xs bg-white";
  const textarea = "w-full min-h-16 rounded border border-ink/15 px-2 py-1.5 text-xs bg-white resize-y";
  const button = "rounded bg-ink text-paper px-3 py-2 text-xs font-semibold disabled:opacity-50";
  const secondaryButton = "rounded border border-ink/15 bg-white px-3 py-2 text-xs font-semibold text-ink/70 disabled:opacity-50";

  const changeState = (nuevoEstado: string, notePrefix?: string) => {
    const note = [notePrefix, transitionNote].filter(Boolean).join(" - ");
    void run(async () => {
      const updated = await kanbanService.cambiarEstado(order.id, nuevoEstado as never, note || undefined);
      setTransitionNote("");
      return updated;
    });
  };

  const submitPago = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget);
    setBusy(true); setError("");
    try {
      const file = fd.get("comprobante");
      await pagosService.registrar(
        order.id,
        Number(fd.get("medio")),
        Number(fd.get("monto")),
        String(fd.get("observaciones") ?? ""),
        String(fd.get("numeroOperacion") ?? ""),
        file instanceof File && file.size > 0 ? file : null,
      );
      onUpdated?.((await kanbanService.listarOrdenes()).find(o => o.id === order.id)!);
      e.currentTarget.reset();
    } catch (x) { setError(x instanceof Error ? x.message : "No se pudo registrar el pago"); } finally { setBusy(false); }
  };

  const submitConsumo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget); setBusy(true); setError("");
    try {
      await inventoryService.registrarSalida({ idInsumo: Number(fd.get("insumo")), cantidad: Number(fd.get("cantidad")), idOrdenTrabajo: Number(order.id) });
      e.currentTarget.reset();
    } catch (x) { setError(x instanceof Error ? x.message : "No se pudo registrar el consumo"); } finally { setBusy(false); }
  };

  return (
    <Section title="Acciones operativas">
      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}
      <div className="rounded-lg border border-ink/5 bg-ink/2 p-3">
        <p className="mb-2 text-xs font-semibold">Movimiento de estado</p>
        <textarea className={textarea} value={transitionNote} onChange={(event) => setTransitionNote(event.target.value)} placeholder="Observacion para historial: motivo, responsable o detalle del avance" />
        <div className="mt-2 flex flex-wrap gap-2">
          <button disabled={busy} className={button} onClick={() => changeState(advance)}>Avanzar a {labelEstadoOrden(advance)}</button>
          {transitionActions.map((action) => (
            <button key={action.estado} disabled={busy} className={secondaryButton} onClick={() => changeState(action.estado, action.prefijo)}>{action.label}</button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 mt-4 lg:grid-cols-3">
        <div className="space-y-2 rounded-lg border border-ink/5 p-3">
          <p className="text-xs font-semibold">Preparacion y calidad</p>
          {order.estado === "PRE_PRENSA" && order.aprobacionesDiseno.length === 0 && (
            <button disabled={busy} className={button} onClick={() => run(() => kanbanService.registrarAprobacion(order.id, order.cliente.nombre, transitionNote || undefined))}>Registrar aprobacion de diseno</button>
          )}
          {order.estado === "POST_PRENSA" && (
            <>
              <button disabled={busy} className={button} onClick={() => run(() => kanbanService.registrarControl(order.id, "APROBADO", order.cotizacion.cantidad, transitionNote || undefined))}>Aprobar control de calidad</button>
              <button disabled={busy} className={secondaryButton} onClick={() => run(() => kanbanService.registrarControl(order.id, "OBSERVADO", order.cotizacion.cantidad, transitionNote || "Observado en control de calidad"))}>Registrar observado</button>
            </>
          )}
          {order.estado !== "PRE_PRENSA" && order.estado !== "POST_PRENSA" && <p className="text-xs text-ink/45">Sin acciones de preparacion para esta etapa.</p>}
        </div>
        <div className="space-y-2 rounded-lg border border-ink/5 p-3">
          <p className="text-xs font-semibold">Observacion interna</p>
          <textarea className={textarea} value={internalNote} onChange={(event) => setInternalNote(event.target.value)} placeholder="Nota operativa sin cambiar etapa" />
          <button disabled={busy || !internalNote.trim()} className={button} onClick={() => run(async () => { const updated = await kanbanService.registrarObservacion(order.id, internalNote.trim()); setInternalNote(""); return updated; })}>Guardar observacion</button>
        </div>
        <div className="space-y-2 rounded-lg border border-ink/5 p-3">
          <p className="text-xs font-semibold">Feedback al cliente</p>
          <textarea className={textarea} value={clientMessage} onChange={(event) => setClientMessage(event.target.value)} placeholder="Mensaje de avance para el cliente" />
          <button disabled={busy || !clientMessage.trim()} className={button} onClick={() => run(() => kanbanService.enviarFeedbackCliente(order.id, clientMessage.trim()))}>Enviar avance</button>
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <form className="space-y-2 rounded-lg border border-ink/5 p-3" onSubmit={e => { e.preventDefault(); const f=new FormData(e.currentTarget); run(() => kanbanService.registrarEntrega(order.id, Number(f.get("cantidad")), String(f.get("observaciones") ?? "") || undefined)); }}>
          <p className="text-xs font-semibold">Entrega parcial</p><input className={input} required min="0.01" step="0.01" name="cantidad" type="number" placeholder="Cantidad" />
          <input className={input} name="observaciones" placeholder="Observaciones de entrega" />
          <button disabled={busy} className={button}>Registrar entrega</button>
        </form>
        <form className="space-y-2 rounded-lg border border-ink/5 p-3" onSubmit={submitPago}>
          <p className="text-xs font-semibold">Registrar pago</p>
          <select className={input} required name="medio"><option value="">Medio de pago</option>{medios.map(m => <option key={m.idMedioPago} value={m.idMedioPago}>{m.nombre}</option>)}</select>
          <input className={input} required min="0.01" step="0.01" max={order.saldoPendiente} name="monto" type="number" placeholder="Monto" />
          <input className={input} name="numeroOperacion" placeholder="Nro. operacion" />
          <input className={input} name="observaciones" placeholder="Observaciones" />
          <input className={input} name="comprobante" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" />
          <button disabled={busy} className={button}>Registrar pago</button>
        </form>
        <form className="space-y-2 rounded-lg border border-ink/5 p-3" onSubmit={submitConsumo}>
          <p className="text-xs font-semibold">Consumo de insumo</p>
          <select className={input} required name="insumo"><option value="">Insumo</option>{insumos.map(i => <option key={i.idInsumo} value={i.idInsumo}>{i.nombre} ({i.stockActual})</option>)}</select>
          <input className={input} required min="0.001" step="0.001" name="cantidad" type="number" placeholder="Cantidad" />
          <button disabled={busy} className={button}>Registrar consumo</button>
        </form>
      </div>
    </Section>
  );
}

function defaultClientMessage(order: WorkOrder) {
  return `Hola, te compartimos el avance de tu pedido ${order.codigo}: actualmente se encuentra en ${labelEstadoOrden(order.estado)}.`;
}

function getTransitionActions(estado: string) {
  if (estado === "PRENSA") {
    return [{ estado: "PRE_PRENSA", label: "Volver a diseno", prefijo: "Retroceso a diseno" }];
  }
  if (estado === "POST_PRENSA") {
    return [
      { estado: "PRENSA", label: "Volver a prensa", prefijo: "Retroceso a prensa" },
      { estado: "PRE_PRENSA", label: "Volver a diseno", prefijo: "Reproceso a diseno" },
    ];
  }
  return [];
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


