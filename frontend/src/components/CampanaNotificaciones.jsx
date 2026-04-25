import { useEffect, useRef, useState } from "react";
import { Bell, Check } from "lucide-react";
import {
  listarNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
} from "../api/notificaciones";

const POLLING_MS = 30000;

export default function CampanaNotificaciones() {
  const [notifs, setNotifs] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  const cargar = async () => {
    try {
      const lista = await listarNotificaciones();
      setNotifs(Array.isArray(lista) ? lista : []);
    } catch {
      /* no bloquea la bandeja si el backend no responde */
    }
  };

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, POLLING_MS);

    const onCustom = () => cargar();
    window.addEventListener("notificaciones:refresh", onCustom);
    return () => {
      clearInterval(id);
      window.removeEventListener("notificaciones:refresh", onCustom);
    };
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const noLeidas = notifs.filter((n) => !n.Leida).length;

  const handleLeer = async (n) => {
    try {
      await marcarLeida(n.Id);
      setNotifs((prev) =>
        prev.map((x) => (x.Id === n.Id ? { ...x, Leida: true } : x))
      );
    } catch {}
  };

  const handleLeerTodas = async () => {
    try {
      await marcarTodasLeidas();
      setNotifs((prev) => prev.map((x) => ({ ...x, Leida: true })));
    } catch {}
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="relative p-2 text-slate-300 hover:text-brand-orange transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-30 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <p className="text-white font-semibold text-sm">Notificaciones</p>
            {noLeidas > 0 && (
              <button
                onClick={handleLeerTodas}
                className="text-xs text-brand-orange hover:text-brand-coral"
              >
                Marcar todas
              </button>
            )}
          </div>
          {notifs.length === 0 ? (
            <p className="p-6 text-center text-slate-500 text-sm">
              Sin notificaciones por ahora.
            </p>
          ) : (
            <ul>
              {notifs.map((n) => (
                <li
                  key={n.Id}
                  className={`px-4 py-3 border-b border-slate-800/70 ${
                    n.Leida ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {n.Titulo}
                      </p>
                      {n.Mensaje && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {n.Mensaje}
                        </p>
                      )}
                    </div>
                    {!n.Leida && (
                      <button
                        onClick={() => handleLeer(n)}
                        className="text-slate-500 hover:text-brand-orange p-1"
                        aria-label="Marcar como leída"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function notificarRefresh() {
  window.dispatchEvent(new Event("notificaciones:refresh"));
}
