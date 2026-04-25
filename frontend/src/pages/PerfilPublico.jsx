import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarDays, MapPin, Music } from "lucide-react";
import Logo from "../components/Logo";
import { obtenerPerfilPublico } from "../api/bandas";
import { obtenerPlataforma } from "../utils/redes";
import { formatearFechaHora } from "../utils/format";

export default function PerfilPublico() {
  const { url } = useParams();
  const [datos, setDatos] = useState(null);
  const [estado, setEstado] = useState("cargando");

  useEffect(() => {
    obtenerPerfilPublico(url)
      .then((d) => {
        setDatos(d);
        setEstado("ok");
      })
      .catch(() => setEstado("error"));
  }, [url]);

  if (estado === "cargando") {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Cargando perfil...
      </div>
    );
  }

  if (estado === "error" || !datos) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
        <div className="text-center">
          <Logo size={64} className="mx-auto mb-4 opacity-50" />
          <h1 className="text-white text-xl font-bold">Banda no encontrada</h1>
          <p className="text-slate-400 text-sm mt-2">
            El enlace no existe o el perfil fue removido.
          </p>
        </div>
      </div>
    );
  }

  const {
    Nombre,
    Genero,
    Ciudad,
    Descripcion,
    PortadaUrl,
    Redes = [],
    EventosProximos = [],
  } = datos;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div
        className="h-64 lg:h-80 bg-slate-900 bg-cover bg-center relative"
        style={
          PortadaUrl
            ? { backgroundImage: `url(${PortadaUrl})` }
            : {
                background:
                  "linear-gradient(135deg, var(--color-brand-red), var(--color-brand-orange))",
              }
        }
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 lg:px-8 -mt-20 relative z-10">
        <header className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-6">
          <h1 className="text-3xl lg:text-4xl font-bold text-white">{Nombre}</h1>
          <p className="text-brand-orange text-sm mt-2 font-medium">
            {Genero || "Música"}
            {Ciudad ? ` · ${Ciudad}` : ""}
          </p>
          {Descripcion && (
            <p className="mt-4 text-slate-300 leading-relaxed">{Descripcion}</p>
          )}

          {Redes.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {Redes.map((r) => {
                const plat = obtenerPlataforma(r.Plataforma);
                const Icono = plat.icono;
                return (
                  <a
                    key={r.Id}
                    href={r.Url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-700 hover:border-brand-orange/50 rounded-lg text-sm transition-colors"
                  >
                    <Icono className={`w-4 h-4 ${plat.color}`} />
                    {r.Plataforma}
                  </a>
                );
              })}
            </div>
          )}
        </header>

        <section className="mt-8 mb-12">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-brand-orange" /> Próximos shows
          </h2>
          {EventosProximos.length === 0 ? (
            <div className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl p-8 text-center">
              <Music className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">
                No hay shows programados por ahora.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {EventosProximos.map((ev) => (
                <li
                  key={ev.Id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-4"
                >
                  <div className="bg-brand-red/15 text-brand-orange p-2 rounded-lg shrink-0">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold">{ev.Nombre}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatearFechaHora(ev.Fecha, ev.Hora)}
                    </p>
                    <p className="text-sm text-slate-300 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />{" "}
                      {ev.Lugar}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
          <div className="inline-flex items-center gap-2">
            <Logo size={20} />
            <span>Powered by Garage Manager</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
