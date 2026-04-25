export const formatearFecha = (fechaIso) => {
  if (!fechaIso) return "—";
  const f = typeof fechaIso === "string" ? fechaIso.slice(0, 10) : fechaIso;
  const d = new Date(`${f}T00:00:00`);
  if (isNaN(d.getTime())) return String(fechaIso);
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatearFechaHora = (fechaIso, hora) => {
  const f = formatearFecha(fechaIso);
  if (!hora) return f;
  return `${f} · ${String(hora).slice(0, 5)}`;
};

export const formatearMoneda = (monto) => {
  const valor = Number(monto || 0);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
};

export const formatearDuracion = (segundos) => {
  if (!segundos && segundos !== 0) return "—";
  const s = Math.floor(Number(segundos));
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
};

export const parsearDuracion = (texto) => {
  if (!texto) return null;
  const t = String(texto).trim();
  if (/^\d+$/.test(t)) return Number(t);
  const m = t.match(/^(\d+):(\d{1,2})$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  return null;
};
