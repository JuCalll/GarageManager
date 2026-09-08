/**
 * Catálogo único de tipos, estados y categorías de movimientos.
 * Agregar un valor nuevo se hace aquí y se propaga a filtros, formulario y badge.
 */
export const TIPOS_MOVIMIENTO = [
  { value: "ingreso", label: "Ingreso", labelPlural: "Ingresos" },
  { value: "gasto", label: "Gasto", labelPlural: "Gastos" },
];

export const ESTADOS_MOVIMIENTO = [
  {
    value: "pendiente",
    label: "Pendiente",
    clase: "bg-yellow-500/15 text-yellow-300",
  },
  {
    value: "cobrado",
    label: "Cobrado",
    clase: "bg-brand-orange/15 text-brand-orange",
  },
  {
    value: "reembolsado",
    label: "Reembolsado",
    clase: "bg-brand-red/15 text-brand-coral",
  },
];

export const CATEGORIAS_MOVIMIENTO = [
  { value: "transporte", label: "Transporte" },
  { value: "sonido", label: "Sonido" },
  { value: "equipos", label: "Equipos" },
  { value: "promocion", label: "Promoción" },
  { value: "otros", label: "Otros" },
];

/** Antepone la opción "ver todo" a un catálogo, para los filtros. */
export const conOpcionTodos = (opciones, value = "todos", label = "Todos") => [
  { value, label },
  ...opciones.map((o) => ({ ...o, label: o.labelPlural || o.label })),
];

export const claseEstado = (estado) =>
  ESTADOS_MOVIMIENTO.find((e) => e.value === estado)?.clase ||
  "bg-slate-700/40 text-slate-300";
