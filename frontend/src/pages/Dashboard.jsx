import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Wallet,
  TrendingUp,
  TrendingDown,
  StickyNote,
  ListMusic,
  Music,
} from "lucide-react";
import { useBanda } from "../context/BandaContext";
import { listarEventosBanda } from "../api/eventos";
import { obtenerBalanceBanda } from "../api/finanzas";
import { listarNotasBanda } from "../api/notas";
import { listarCanciones, listarSetlists } from "../api/repertorio";
import CalendarioMensual from "../components/CalendarioMensual";
import EstadoVacio from "../components/EstadoVacio";
import { formatearFechaHora, formatearMoneda } from "../utils/format";

export default function Dashboard() {
  const navigate = useNavigate();
  const { bandaActiva, bandas, cargando } = useBanda();
  const [eventos, setEventos] = useState([]);
  const [balance, setBalance] = useState(null);
  const [notas, setNotas] = useState([]);
  const [canciones, setCanciones] = useState([]);
  const [setlists, setSetlists] = useState([]);

  useEffect(() => {
    if (!bandaActiva) {
      setEventos([]);
      setBalance(null);
      setNotas([]);
      setCanciones([]);
      setSetlists([]);
      return;
    }
    let cancelado = false;
    (async () => {
      const resultados = await Promise.allSettled([
        listarEventosBanda(bandaActiva.Id),
        obtenerBalanceBanda(bandaActiva.Id),
        listarNotasBanda(bandaActiva.Id),
        listarCanciones(bandaActiva.Id),
        listarSetlists(bandaActiva.Id),
      ]);
      if (cancelado) return;
      const [rEv, rBal, rNot, rCan, rSet] = resultados;
      setEventos(rEv.status === "fulfilled" ? rEv.value : []);
      setBalance(rBal.status === "fulfilled" ? rBal.value : null);
      setNotas(rNot.status === "fulfilled" ? rNot.value : []);
      setCanciones(rCan.status === "fulfilled" ? rCan.value : []);
      setSetlists(rSet.status === "fulfilled" ? rSet.value : []);
      resultados.forEach((r, i) => {
        if (r.status === "rejected") {
          const nombres = ["eventos", "balance", "notas", "canciones", "setlists"];
          console.error(`[Dashboard] Error cargando ${nombres[i]}:`, r.reason);
        }
      });
    })();
    return () => {
      cancelado = true;
    };
  }, [bandaActiva?.Id]);

  const proximos = useMemo(() => {
    const hoy = fechaLocalHoyIso();
    return [...eventos]
      .filter((e) => String(e.Fecha ?? "").slice(0, 10) >= hoy)
      .sort((a, b) =>
        String(a.Fecha).slice(0, 10) < String(b.Fecha).slice(0, 10) ? -1 : 1
      )
      .slice(0, 5);
  }, [eventos]);

  if (cargando && bandas.length === 0) {
    return <p className="p-8 text-slate-400">Cargando...</p>;
  }

  if (bandas.length === 0) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>
        <EstadoVacio
          icono={Music}
          titulo="¡Bienvenido a Garage Manager!"
          descripcion="Para empezar, crea tu primera banda. Luego podrás agendar eventos, gestionar finanzas y mucho más."
          accion={
            <button
              onClick={() => navigate("/banda")}
              className="bg-brand-red hover:bg-brand-coral text-white font-bold px-5 py-2.5 rounded-lg shadow-[0_0_10px_rgba(230,0,0,0.3)]"
            >
              Crear mi banda
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Hola, {bandaActiva?.Nombre || "banda"}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Resumen general de tu actividad.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tarjeta
          icono={CalendarDays}
          titulo="Eventos próximos"
          valor={proximos.length}
        />
        <Tarjeta
          icono={TrendingUp}
          titulo="Ingresos cobrados"
          valor={formatearMoneda(balance?.TotalIngresos)}
        />
        <Tarjeta
          icono={TrendingDown}
          titulo="Gastos"
          valor={formatearMoneda(balance?.TotalGastos)}
        />
        <Tarjeta
          icono={Wallet}
          titulo="Saldo"
          valor={formatearMoneda(balance?.Saldo)}
          destacado
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CalendarioMensual
            eventos={eventos}
            onSeleccionarDia={() => navigate("/eventos")}
          />
        </div>

        <div className="space-y-6">
          <Bloque
            titulo="Próximos eventos"
            icono={CalendarDays}
            vacio="No hay eventos próximos."
          >
            {proximos.map((e) => (
              <li
                key={e.Id}
                onClick={() => navigate("/eventos")}
                className="py-2 border-b border-slate-800/60 last:border-0 cursor-pointer hover:bg-slate-800/30 px-2 -mx-2 rounded"
              >
                <p className="text-sm text-white font-medium truncate">
                  {e.Nombre}
                </p>
                <p className="text-xs text-slate-400">
                  {formatearFechaHora(e.Fecha, e.Hora)} · {e.Lugar}
                </p>
              </li>
            ))}
            {proximos.length === 0 && (
              <p className="text-sm text-slate-500 py-2">No hay eventos.</p>
            )}
          </Bloque>

          <Bloque titulo="Notas recientes" icono={StickyNote}>
            {notas.slice(0, 3).map((n) => (
              <li
                key={n.Id}
                onClick={() => navigate("/notas")}
                className="py-2 border-b border-slate-800/60 last:border-0 cursor-pointer hover:bg-slate-800/30 px-2 -mx-2 rounded"
              >
                <p className="text-sm text-slate-300 line-clamp-2">
                  {n.Contenido}
                </p>
              </li>
            ))}
            {notas.length === 0 && (
              <p className="text-sm text-slate-500 py-2">Sin notas todavía.</p>
            )}
          </Bloque>

          <Bloque titulo="Repertorio" icono={ListMusic}>
            <div className="flex justify-between text-sm py-1">
              <span className="text-slate-400">Canciones</span>
              <span className="text-white font-semibold">{canciones.length}</span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-slate-400">Setlists</span>
              <span className="text-white font-semibold">{setlists.length}</span>
            </div>
          </Bloque>
        </div>
      </div>
    </div>
  );
}

function Tarjeta({ icono: Icono, titulo, valor, destacado }) {
  return (
    <div
      className={`bg-slate-900 border rounded-xl p-4 ${
        destacado ? "border-brand-red/30" : "border-slate-800"
      }`}
    >
      <div className="inline-flex p-2 rounded-lg bg-brand-red/10 text-brand-orange mb-2">
        <Icono className="w-4 h-4" />
      </div>
      <p className="text-slate-400 text-xs">{titulo}</p>
      <p className="text-lg font-bold text-white mt-1">{valor}</p>
    </div>
  );
}

function Bloque({ titulo, icono: Icono, children }) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
        <Icono className="w-4 h-4 text-brand-orange" /> {titulo}
      </h3>
      <ul>{children}</ul>
    </section>
  );
}

/** Fecha local YYYY-MM-DD (evita desfase vs UTC de `toISOString()` al filtrar eventos). */
function fechaLocalHoyIso() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}
