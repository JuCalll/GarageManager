import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function CalendarioMensual({ eventos = [], onSeleccionarDia }) {
  const [refMes, setRefMes] = useState(() => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  });

  const eventosPorFecha = useMemo(() => {
    const map = new Map();
    for (const ev of eventos) {
      const k = String(ev.Fecha).slice(0, 10);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(ev);
    }
    return map;
  }, [eventos]);

  const año = refMes.getFullYear();
  const mes = refMes.getMonth();
  const primerDia = new Date(año, mes, 1);
  const ultimoDia = new Date(año, mes + 1, 0);
  const offsetInicio = (primerDia.getDay() + 6) % 7;

  const celdas = [];
  for (let i = 0; i < offsetInicio; i++) celdas.push(null);
  for (let d = 1; d <= ultimoDia.getDate(); d++) {
    const fecha = new Date(año, mes, d);
    const iso = fecha.toISOString().slice(0, 10);
    celdas.push({ dia: d, iso, evs: eventosPorFecha.get(iso) || [] });
  }

  const nombreMes = refMes.toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric",
  });
  const hoyIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setRefMes(new Date(año, mes - 1, 1))}
          className="p-2 text-slate-400 hover:text-brand-orange"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-white font-semibold capitalize">{nombreMes}</h3>
        <button
          onClick={() => setRefMes(new Date(año, mes + 1, 1))}
          className="p-2 text-slate-400 hover:text-brand-orange"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs text-slate-500 uppercase mb-1">
        {DIAS.map((d) => (
          <div key={d} className="text-center py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {celdas.map((c, i) =>
          c === null ? (
            <div key={`v-${i}`} className="h-14" />
          ) : (
            <button
              key={c.iso}
              onClick={() => onSeleccionarDia?.(c.iso, c.evs)}
              className={`h-14 text-left rounded-lg p-1.5 text-xs transition-colors ${
                c.iso === hoyIso
                  ? "bg-brand-red/20 border border-brand-red/40 text-white"
                  : c.evs.length
                    ? "bg-brand-orange/10 border border-brand-orange/30 text-white hover:bg-brand-orange/20"
                    : "border border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="font-semibold">{c.dia}</div>
              {c.evs.length > 0 && (
                <div className="text-[10px] text-brand-orange mt-1 truncate">
                  {c.evs[0].Nombre}
                  {c.evs.length > 1 ? ` +${c.evs.length - 1}` : ""}
                </div>
              )}
            </button>
          )
        )}
      </div>
    </div>
  );
}
