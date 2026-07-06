import type {

  CotizacionSnapshot,

  HistorialEstado,

  OrdenTrabajoEstado,

  WorkOrder,

} from "./types";

import { estadoToFase, sumPagos } from "./types";



const cotizacionTarjetas: CotizacionSnapshot = {

  codigo: "COT-2026-0142",

  origen: "PRESENCIAL",

  tipoImpresion: "OFFSET",

  categoriaProducto: "Brochure",

  tipoProducto: "Tarjeta Personal",

  tamano: "9 × 5.5 cm",

  cantidad: 1,

  unidadMedida: "MILLAR",

  papel: {

    nombre: "Cartulina 300g 70×100",

    gramaje: 300,

    medida: "70×100 cm",

    tipoPapel: "Cartulina",

  },

  colores: { numero: 4, costoPlacas: 25, tarifaImpresionMillar: 25 },

  acabados: [{ nombre: "Plastificado Mate", precioMillar: 50 }],

  costos: {

    diseno: 50,

    placas: 25,

    precioMaterialMillar: 30,

    costoMaterial: 30,

    depreciacion: 0.5,

    impresion: 25,

    tinta: 5,

    acabados: 50,

    manoObra: 12,

  },

  subtotal: 197.5,

  porcentajeMargen: 30,

  montoMargen: 59.25,

  baseImponible: 256.75,

  porcentajeIgv: 18,

  montoIgv: 46.22,

  total: 302.97,

};



const cotizacionVolantes: CotizacionSnapshot = {

  codigo: "COT-2026-0098",

  origen: "WEB",

  tipoImpresion: "OFFSET",

  categoriaProducto: "Brochure",

  tipoProducto: "Volante",

  tamano: "21 × 29.7 cm (A4)",

  cantidad: 10,

  unidadMedida: "MILLAR",

  papel: {

    nombre: "Couché 90g 70×100",

    gramaje: 90,

    medida: "70×100 cm",

    tipoPapel: "Couché",

  },

  colores: { numero: 4, costoPlacas: 25, tarifaImpresionMillar: 25 },

  acabados: [],

  costos: {

    diseno: 80,

    placas: 25,

    precioMaterialMillar: 22,

    costoMaterial: 220,

    depreciacion: 5,

    impresion: 250,

    tinta: 50,

    acabados: 0,

    manoObra: 120,

  },

  subtotal: 750,

  porcentajeMargen: 30,

  montoMargen: 225,

  baseImponible: 975,

  porcentajeIgv: 18,

  montoIgv: 175.5,

  total: 1150.5,

};



const cotizacionTriptico: CotizacionSnapshot = {

  codigo: "COT-2026-0115",

  origen: "PRESENCIAL",

  tipoImpresion: "OFFSET",

  categoriaProducto: "Brochure",

  tipoProducto: "Tríptico",

  tamano: "21 × 29.7 cm desplegado",

  cantidad: 5,

  unidadMedida: "MILLAR",

  papel: {

    nombre: "Couché 120g 70×100",

    gramaje: 120,

    medida: "70×100 cm",

    tipoPapel: "Couché",

  },

  colores: { numero: 2, costoPlacas: 12, tarifaImpresionMillar: 12.5 },

  acabados: [{ nombre: "Barnizado Mate", precioMillar: 40 }],

  costos: {

    diseno: 60,

    placas: 12,

    precioMaterialMillar: 24,

    costoMaterial: 120,

    depreciacion: 2.5,

    impresion: 62.5,

    tinta: 25,

    acabados: 200,

    manoObra: 60,

  },

  subtotal: 542,

  porcentajeMargen: 30,

  montoMargen: 162.6,

  baseImponible: 704.6,

  porcentajeIgv: 18,

  montoIgv: 126.83,

  total: 831.43,

};



const cotizacionManual: CotizacionSnapshot = {

  codigo: "COT-2026-0156",

  origen: "TELEGRAM",
  tipoImpresion: "OFFSET",

  categoriaProducto: "Impresión Editorial",

  tipoProducto: "Libro",

  tamano: "14 × 21 cm",

  cantidad: 50,

  unidadMedida: "MILLAR",

  papel: {

    nombre: "Couché 150g 70×100",

    gramaje: 150,

    medida: "70×100 cm",

    tipoPapel: "Couché",

  },

  colores: { numero: 4, costoPlacas: 25, tarifaImpresionMillar: 25 },

  acabados: [],

  costos: {

    diseno: 1200,

    placas: 25,

    precioMaterialMillar: 28,

    costoMaterial: 1400,

    depreciacion: 25,

    impresion: 1250,

    tinta: 250,

    acabados: 0,

    manoObra: 600,

  },

  subtotal: 4750,

  porcentajeMargen: 30,

  montoMargen: 1425,

  baseImponible: 6175,

  porcentajeIgv: 18,

  montoIgv: 1111.5,

  total: 7286.5,

};



const cotizacionAgenda: CotizacionSnapshot = {

  codigo: "COT-2026-0088",

  origen: "PRESENCIAL",

  tipoImpresion: "OFFSET",

  categoriaProducto: "Impresión Editorial",

  tipoProducto: "Agenda",

  tamano: "17 × 24 cm",

  cantidad: 2,

  unidadMedida: "MILLAR",

  papel: {

    nombre: "Couché 150g 70×100",

    gramaje: 150,

    medida: "70×100 cm",

    tipoPapel: "Couché",

  },

  colores: { numero: 4, costoPlacas: 25, tarifaImpresionMillar: 25 },

  acabados: [{ nombre: "Encolado (hot melt)", precioMillar: 0 }],

  costos: {

    diseno: 200,

    placas: 25,

    precioMaterialMillar: 28,

    costoMaterial: 56,

    depreciacion: 1,

    impresion: 50,

    tinta: 10,

    acabados: 0,

    manoObra: 24,

  },

  subtotal: 366,

  porcentajeMargen: 30,

  montoMargen: 109.8,

  baseImponible: 475.8,

  porcentajeIgv: 18,

  montoIgv: 85.64,

  total: 561.44,

};



const cotizacionCajas: CotizacionSnapshot = {

  codigo: "COT-2026-0071",

  origen: "PRESENCIAL",

  tipoImpresion: "OFFSET",

  categoriaProducto: "Formatería",

  tipoProducto: "Factura",

  tamano: "21 × 14 cm",

  cantidad: 3,

  unidadMedida: "MILLAR",

  papel: {

    nombre: "Cartulina 250g 70×100",

    gramaje: 250,

    medida: "70×100 cm",

    tipoPapel: "Cartulina",

  },

  colores: { numero: 2, costoPlacas: 12, tarifaImpresionMillar: 12.5 },

  acabados: [],

  costos: {

    diseno: 40,

    placas: 12,

    precioMaterialMillar: 30,

    costoMaterial: 90,

    depreciacion: 1.5,

    impresion: 37.5,

    tinta: 15,

    acabados: 0,

    manoObra: 36,

  },

  subtotal: 232,

  porcentajeMargen: 30,

  montoMargen: 69.6,

  baseImponible: 301.6,

  porcentajeIgv: 18,

  montoIgv: 54.29,

  total: 355.89,

};



function buildOrder(

  partial: Omit<WorkOrder, "saldoPendiente" | "totalPagado" | "fase"> & {

    fase?: WorkOrder["fase"];

  },

): WorkOrder {

  const totalPagado = sumPagos(partial.pagos);

  const fase = partial.fase ?? estadoToFase(partial.estado)!;

  return {

    ...partial,

    fase,

    totalPagado,

    saldoPendiente: Math.max(0, partial.montoTotal - totalPagado),

  };

}



const hist = (
  items: HistorialEstado[],

): HistorialEstado[] => items;



/** Órdenes mock alineadas a orden_trabajo + cotización + tablas operativas (spec §6, SQL). */

export const mockWorkOrders: WorkOrder[] = [

  buildOrder({

    id: "1",

    codigo: "OT-2026-08821",

    estado: "PRE_PRENSA",

    cliente: {

      tipoDocumento: "RUC",

      numeroDocumento: "20123456789",

      nombre: "Nova Studio S.A.C.",

      telefono: "044 123456",

      correo: "produccion@novastudio.pe",

    },

    cotizacion: { ...cotizacionManual, codigo: "COT-2026-0156" },

    montoTotal: 7286.5,

    pagos: [{ fecha: "28 may. 2026", monto: 2000, medioPago: "Transferencia", usuario: "Rosa Quispe" }],

    fechaCreacion: "26 may. 2026, 2:48 p. m.",

    fechaEstimadaEntrega: "3 jun. 2026",

    observaciones: "Cliente solicita muestra de color antes de placas.",

    numeroReprocesos: 0,

    etiquetaEstado: "Diseño en revisión",

    etiquetaVariant: "cyan",

    prioridad: "alta",

    progresoDiseno: 75,

    historialEstados: hist([

      {

        estadoAnterior: null,

        estadoNuevo: "PRE_PRENSA",

        fecha: "26 may. 2026, 2:48 p. m.",

        usuario: "Ana Ríos",

        observaciones: "Orden creada desde cotización aprobada",

      },

    ]),

    aprobacionesDiseno: [],

    controlesCalidad: [],

    operacionesMaquina: [

      {

        maquina: "Computadora de Diseño",

        tipo: "COMPUTADORA_DISENO",

        fechaInicio: "26 may. 2026, 3:00 p. m.",

        usuario: "Ana Ríos",

      },

    ],

    entregas: [],

  }),

  buildOrder({

    id: "2",

    codigo: "OT-2026-08825",

    estado: "PRE_PRENSA",

    cliente: {

      tipoDocumento: "DNI",

      numeroDocumento: "45678912",

      nombre: "Colectivo Arte",

      telefono: "987 654 321",

    },

    cotizacion: {

      ...cotizacionVolantes,

      codigo: "COT-2026-0120",

      tipoProducto: "Afiche",

      categoriaProducto: "Publicidad Impresa",

      tamano: "60 × 90 cm",

    },

    montoTotal: 2450,

    pagos: [],

    fechaCreacion: "27 may. 2026, 9:15 a. m.",

    fechaEstimadaEntrega: "5 jun. 2026",

    numeroReprocesos: 0,

    etiquetaEstado: "Placas pendientes",

    etiquetaVariant: "yellow",

    prioridad: "media",

    progresoDiseno: 40,

    historialEstados: hist([

      {

        estadoAnterior: null,

        estadoNuevo: "PRE_PRENSA",

        fecha: "27 may. 2026, 9:15 a. m.",

        usuario: "Luis Mendoza",

      },

    ]),

    aprobacionesDiseno: [

      {

        fecha: "27 may. 2026, 11:00 a. m.",

        aprobadoPor: "María López (cliente)",

        usuarioRegistra: "Luis Mendoza",

      },

    ],

    controlesCalidad: [],

    operacionesMaquina: [],

    entregas: [],

  }),

  buildOrder({

    id: "3",

    codigo: "OT-2026-08827",

    estado: "PRE_PRENSA",

    cliente: {

      tipoDocumento: "RUC",

      numeroDocumento: "20987654321",

      nombre: "Editorial Norte S.R.L.",

      correo: "compras@editorialnorte.pe",

    },

    cotizacion: cotizacionManual,

    montoTotal: 7286.5,

    pagos: [],

    fechaCreacion: "24 may. 2026, 4:20 p. m.",

    fechaEstimadaEntrega: "1 jun. 2026",

    numeroReprocesos: 0,

    etiquetaEstado: "Pendiente aprobación cliente",

    etiquetaVariant: "neutral",

    prioridad: "alta",

    vencida: true,

    progresoDiseno: 90,

    historialEstados: hist([

      {

        estadoAnterior: null,

        estadoNuevo: "PRE_PRENSA",

        fecha: "24 may. 2026, 4:20 p. m.",

        usuario: "Ana Ríos",

      },

    ]),

    aprobacionesDiseno: [],

    controlesCalidad: [],

    operacionesMaquina: [],

    entregas: [],

  }),

  buildOrder({

    id: "4",

    codigo: "OT-2026-08819",

    estado: "PRENSA",

    cliente: {

      tipoDocumento: "RUC",

      numeroDocumento: "20654321098",

      nombre: "Fintech Corp S.A.C.",

      correo: "marketing@fintechcorp.pe",

    },

    cotizacion: cotizacionTarjetas,

    montoTotal: 302.97,

    pagos: [{ fecha: "23 may. 2026", monto: 150, medioPago: "Yape", usuario: "Rosa Quispe" }],

    fechaCreacion: "22 may. 2026, 11:00 a. m.",

    fechaEstimadaEntrega: "2 jun. 2026",

    numeroReprocesos: 0,

    etiquetaEstado: "En máquina offset",

    etiquetaVariant: "magenta",

    prioridad: "media",

    maquinaActual: "Máquina Offset",

    historialEstados: hist([

      {

        estadoAnterior: null,

        estadoNuevo: "PRE_PRENSA",

        fecha: "22 may. 2026, 11:00 a. m.",

        usuario: "Ana Ríos",

      },

      {

        estadoAnterior: "PRE_PRENSA",

        estadoNuevo: "PRENSA",

        fecha: "25 may. 2026, 8:00 a. m.",

        usuario: "Carlos Vega",

        observaciones: "Diseño aprobado y placas listas",

      },

    ]),

    aprobacionesDiseno: [

      {

        fecha: "24 may. 2026, 5:30 p. m.",

        aprobadoPor: "Juan Pérez — Fintech Corp",

        usuarioRegistra: "Ana Ríos",

      },

    ],

    controlesCalidad: [],

    operacionesMaquina: [

      {

        maquina: "Procesadora de Placas",

        tipo: "PROCESADORA_PLACA",

        fechaInicio: "24 may. 2026, 6:00 p. m.",

        fechaFin: "24 may. 2026, 9:00 p. m.",

        usuario: "Carlos Vega",

      },

      {

        maquina: "Máquina Offset",

        tipo: "OFFSET",

        fechaInicio: "25 may. 2026, 8:15 a. m.",

        usuario: "Carlos Vega",

        observaciones: "Cartulina 300g — full color",

      },

    ],

    entregas: [],

  }),

  buildOrder({

    id: "5",

    codigo: "OT-2026-08820",

    estado: "PRENSA",

    cliente: {

      tipoDocumento: "RUC",

      numeroDocumento: "20111222333",

      nombre: "Clínica Río",

      telefono: "044 998877",

    },

    cotizacion: cotizacionTriptico,

    montoTotal: 831.43,

    pagos: [],

    fechaCreacion: "25 may. 2026, 8:30 a. m.",

    fechaEstimadaEntrega: "4 jun. 2026",

    numeroReprocesos: 0,

    etiquetaEstado: "Impresión en curso",

    etiquetaVariant: "magenta",

    prioridad: "baja",

    maquinaActual: "Máquina Offset",

    historialEstados: hist([

      {

        estadoAnterior: null,

        estadoNuevo: "PRE_PRENSA",

        fecha: "25 may. 2026, 8:30 a. m.",

        usuario: "Ana Ríos",

      },

      {

        estadoAnterior: "PRE_PRENSA",

        estadoNuevo: "PRENSA",

        fecha: "28 may. 2026, 7:00 a. m.",

        usuario: "Carlos Vega",

      },

    ]),

    aprobacionesDiseno: [

      {

        fecha: "26 may. 2026, 10:00 a. m.",

        aprobadoPor: "Dirección Clínica Río",

        usuarioRegistra: "Ana Ríos",

      },

    ],

    controlesCalidad: [],

    operacionesMaquina: [

      {

        maquina: "Máquina Offset",

        tipo: "OFFSET",

        fechaInicio: "28 may. 2026, 7:15 a. m.",

        usuario: "Carlos Vega",

      },

    ],

    entregas: [],

  }),

  buildOrder({

    id: "6",

    codigo: "OT-2026-08812",

    estado: "POST_PRENSA",

    cliente: {

      tipoDocumento: "DNI",

      numeroDocumento: "12345678",

      nombre: "Proyecto Personal — Luis G.",

    },

    cotizacion: cotizacionAgenda,

    montoTotal: 561.44,

    pagos: [{ fecha: "20 may. 2026", monto: 300, medioPago: "Efectivo", usuario: "Rosa Quispe" }],

    fechaCreacion: "20 may. 2026, 3:00 p. m.",

    fechaEstimadaEntrega: "6 jun. 2026",

    numeroReprocesos: 0,

    etiquetaEstado: "Control de calidad",

    etiquetaVariant: "emerald",

    prioridad: "media",

    historialEstados: hist([

      {

        estadoAnterior: null,

        estadoNuevo: "PRE_PRENSA",

        fecha: "20 may. 2026, 3:00 p. m.",

        usuario: "María Solís",

      },

      {

        estadoAnterior: "PRE_PRENSA",

        estadoNuevo: "PRENSA",

        fecha: "22 may. 2026, 9:00 a. m.",

        usuario: "Carlos Vega",

      },

      {

        estadoAnterior: "PRENSA",

        estadoNuevo: "POST_PRENSA",

        fecha: "27 may. 2026, 2:00 p. m.",

        usuario: "María Solís",

      },

    ]),

    aprobacionesDiseno: [

      {

        fecha: "21 may. 2026, 4:00 p. m.",

        aprobadoPor: "Luis G.",

        usuarioRegistra: "María Solís",

      },

    ],

    controlesCalidad: [

      {

        resultado: "OBSERVADO",

        cantidadVerificada: 2000,

        observaciones: "Encolado irregular en lomo — refile pendiente",

        fecha: "28 may. 2026, 10:00 a. m.",

        usuario: "María Solís",

      },

    ],

    operacionesMaquina: [

      {

        maquina: "Máquina Offset",

        tipo: "OFFSET",

        fechaInicio: "22 may. 2026, 9:00 a. m.",

        fechaFin: "23 may. 2026, 6:00 p. m.",

        usuario: "Carlos Vega",

      },

      {

        maquina: "Encoladora",

        tipo: "ENCOLADORA",

        fechaInicio: "27 may. 2026, 2:30 p. m.",

        fechaFin: "27 may. 2026, 6:00 p. m.",

        usuario: "María Solís",

      },

    ],

    entregas: [],

  }),

  buildOrder({

    id: "7",

    codigo: "OT-2026-08810",

    estado: "POST_PRENSA",

    cliente: {

      tipoDocumento: "RUC",

      numeroDocumento: "20444555666",

      nombre: "Café Roble S.A.C.",

    },

    cotizacion: cotizacionCajas,

    montoTotal: 355.89,

    pagos: [],

    fechaCreacion: "18 may. 2026, 1:15 p. m.",

    fechaEstimadaEntrega: "30 may. 2026",

    numeroReprocesos: 1,

    etiquetaEstado: "Reproceso — acabado final",

    etiquetaVariant: "yellow",

    prioridad: "alta",

    vencida: true,

    historialEstados: hist([

      {

        estadoAnterior: null,

        estadoNuevo: "PRE_PRENSA",

        fecha: "18 may. 2026, 1:15 p. m.",

        usuario: "María Solís",

      },

      {

        estadoAnterior: "PRE_PRENSA",

        estadoNuevo: "PRENSA",

        fecha: "20 may. 2026, 8:00 a. m.",

        usuario: "Carlos Vega",

      },

      {

        estadoAnterior: "PRENSA",

        estadoNuevo: "POST_PRENSA",

        fecha: "24 may. 2026, 3:00 p. m.",

        usuario: "María Solís",

      },

      {

        estadoAnterior: "POST_PRENSA",

        estadoNuevo: "PRE_PRENSA",

        fecha: "26 may. 2026, 9:00 a. m.",

        usuario: "María Solís",

        observaciones: "Reproceso #1 — error de corte (spec §6.2)",

      },

      {

        estadoAnterior: "PRE_PRENSA",

        estadoNuevo: "POST_PRENSA",

        fecha: "28 may. 2026, 4:00 p. m.",

        usuario: "María Solís",

      },

    ]),

    aprobacionesDiseno: [

      {

        fecha: "19 may. 2026, 11:00 a. m.",

        aprobadoPor: "Gerencia Café Roble",

        usuarioRegistra: "María Solís",

      },

    ],

    controlesCalidad: [

      {

        resultado: "OBSERVADO",

        observaciones: "Corte fuera de tolerancia — reinicio a pre-prensa",

        fecha: "25 may. 2026, 11:00 a. m.",

        usuario: "María Solís",

      },

    ],

    operacionesMaquina: [

      {

        maquina: "Guillotina",

        tipo: "GUILLOTINA",

        fechaInicio: "28 may. 2026, 4:30 p. m.",

        usuario: "María Solís",

      },

    ],

    entregas: [],

  }),

  buildOrder({

    id: "8",

    codigo: "OT-2026-08808",

    estado: "POST_PRENSA",

    cliente: {

      tipoDocumento: "RUC",

      numeroDocumento: "20100998877",

      nombre: "Pizzería Roma",

    },

    cotizacion: cotizacionVolantes,

    montoTotal: 1150.5,

    pagos: [

      { fecha: "19 may. 2026", monto: 500, medioPago: "Transferencia", usuario: "Rosa Quispe" },

      { fecha: "29 may. 2026", monto: 300, medioPago: "Yape", usuario: "Rosa Quispe" },

    ],

    fechaCreacion: "19 may. 2026, 10:45 a. m.",

    fechaEstimadaEntrega: "7 jun. 2026",

    numeroReprocesos: 0,

    etiquetaEstado: "Observado QC",

    etiquetaVariant: "destructive",

    prioridad: "media",

    historialEstados: hist([

      {

        estadoAnterior: null,

        estadoNuevo: "PRE_PRENSA",

        fecha: "19 may. 2026, 10:45 a. m.",

        usuario: "María Solís",

      },

      {

        estadoAnterior: "PRE_PRENSA",

        estadoNuevo: "PRENSA",

        fecha: "22 may. 2026, 7:00 a. m.",

        usuario: "Carlos Vega",

      },

      {

        estadoAnterior: "PRENSA",

        estadoNuevo: "POST_PRENSA",

        fecha: "27 may. 2026, 5:00 p. m.",

        usuario: "María Solís",

      },

    ]),

    aprobacionesDiseno: [

      {

        fecha: "20 may. 2026, 9:00 a. m.",

        aprobadoPor: "Administración Pizzería Roma",

        usuarioRegistra: "María Solís",

      },

    ],

    controlesCalidad: [

      {

        resultado: "OBSERVADO",

        cantidadVerificada: 10000,

        observaciones: "Tono magenta desviado en 2do millar — corrección en prensa",

        fecha: "29 may. 2026, 8:00 a. m.",

        usuario: "María Solís",

      },

    ],

    operacionesMaquina: [

      {

        maquina: "Máquina Offset",

        tipo: "OFFSET",

        fechaInicio: "22 may. 2026, 7:00 a. m.",

        fechaFin: "25 may. 2026, 8:00 p. m.",

        usuario: "Carlos Vega",

      },

      {

        maquina: "Guillotina",

        tipo: "GUILLOTINA",

        fechaInicio: "27 may. 2026, 5:30 p. m.",

        fechaFin: "27 may. 2026, 7:00 p. m.",

        usuario: "María Solís",

      },

    ],

    entregas: [

      {

        fecha: "30 may. 2026, 10:00 a. m.",

        cantidadEntregada: 2,

        usuario: "María Solís",

        observaciones: "Entrega parcial urgente (spec §6.4)",

      },

    ],

  }),

];