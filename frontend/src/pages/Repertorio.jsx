import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Music,
  ListMusic,
  Trash2,
  Pencil,
  Clock,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  X as XIcon,
} from "lucide-react";
import { useBanda } from "../context/BandaContext";
import {
  listarCanciones,
  crearCancion,
  actualizarCancion,
  eliminarCancion,
  listarSetlists,
  crearSetlist,
  actualizarSetlist,
  eliminarSetlist,
} from "../api/repertorio";
import { listarEventosBanda } from "../api/eventos";
import Modal from "../components/Modal";
import EstadoVacio from "../components/EstadoVacio";
import {
  formatearDuracion,
  parsearDuracion,
  formatearFecha,
} from "../utils/format";
import { mensajeError } from "../utils/errores";

const FORM_CANCION = {
  Titulo: "",
  Tono: "",
  duracion: "",
  Bpm: "",
  Notas: "",
  UrlReferencia: "",
};

const FORM_SETLIST = {
  Nombre: "",
  EventoId: "",
  Items: [],
};

export default function Repertorio() {
  const { bandaActiva } = useBanda();
  const [tab, setTab] = useState("canciones");
  const [canciones, setCanciones] = useState([]);
  const [setlists, setSetlists] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [modalCancion, setModalCancion] = useState(false);
  const [modalSetlist, setModalSetlist] = useState(false);
  const [formCancion, setFormCancion] = useState(FORM_CANCION);
  const [formSetlist, setFormSetlist] = useState(FORM_SETLIST);
  const [editandoCancion, setEditandoCancion] = useState(null);
  const [editandoSetlist, setEditandoSetlist] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const cargar = async () => {
    if (!bandaActiva) {
      setCanciones([]);
      setSetlists([]);
      setEventos([]);
      return;
    }
    try {
      const [cs, ss, evs] = await Promise.all([
        listarCanciones(bandaActiva.Id),
        listarSetlists(bandaActiva.Id),
        listarEventosBanda(bandaActiva.Id),
      ]);
      setCanciones(cs);
      setSetlists(ss);
      setEventos(evs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargar();
  }, [bandaActiva?.Id]); // eslint-disable-line react-hooks/exhaustive-deps

  const abrirNuevaCancion = () => {
    setEditandoCancion(null);
    setFormCancion(FORM_CANCION);
    setError("");
    setModalCancion(true);
  };

  const abrirEditarCancion = (c) => {
    setEditandoCancion(c);
    setFormCancion({
      Titulo: c.Titulo,
      Tono: c.Tono || "",
      duracion: c.DuracionSegundos != null
        ? formatearDuracion(c.DuracionSegundos)
        : "",
      Bpm: c.Bpm != null && c.Bpm !== "" ? String(c.Bpm) : "",
      Notas: c.Notas || "",
      UrlReferencia: c.UrlReferencia || "",
    });
    setError("");
    setModalCancion(true);
  };

  const handleGuardarCancion = async (e) => {
    e.preventDefault();
    if (!bandaActiva) return;
    setError("");
    setEnviando(true);
    try {
      const payload = {
        Titulo: formCancion.Titulo.trim(),
        Tono: formCancion.Tono || null,
        DuracionSegundos: formCancion.duracion
          ? parsearDuracion(formCancion.duracion)
          : null,
        Bpm: formCancion.Bpm ? Number(formCancion.Bpm) : null,
        Notas: formCancion.Notas || null,
        UrlReferencia: formCancion.UrlReferencia || null,
        BandaId: bandaActiva.Id,
      };
      if (editandoCancion) {
        await actualizarCancion(editandoCancion.Id, payload);
      } else {
        await crearCancion(payload);
      }
      setModalCancion(false);
      setFormCancion(FORM_CANCION);
      setEditandoCancion(null);
      await cargar();
    } catch (err) {
      setError(mensajeError(err, "No se pudo guardar la canción"));
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminarCancion = async (id) => {
    if (!confirm("¿Eliminar esta canción del repertorio?")) return;
    try {
      await eliminarCancion(id);
      await cargar();
    } catch (err) {
      alert(mensajeError(err, "No se pudo eliminar"));
    }
  };

  const abrirNuevoSetlist = () => {
    setEditandoSetlist(null);
    setFormSetlist({ ...FORM_SETLIST, Items: [] });
    setError("");
    setModalSetlist(true);
  };

  const abrirEditarSetlist = (s) => {
    setEditandoSetlist(s);
    setFormSetlist({
      Nombre: s.Nombre,
      EventoId: s.EventoId || "",
      Items: (s.Items || []).map((it) => ({
        CancionId: it.CancionId,
        NotaInterpretacion: it.NotaInterpretacion || "",
      })),
    });
    setError("");
    setModalSetlist(true);
  };

  const agregarCancionSetlist = (cancionId) => {
    if (!cancionId) return;
    if (formSetlist.Items.some((i) => i.CancionId === Number(cancionId))) return;
    setFormSetlist((f) => ({
      ...f,
      Items: [...f.Items, { CancionId: Number(cancionId), NotaInterpretacion: "" }],
    }));
  };

  const intercambiarItems = (idx, destino) => {
    setFormSetlist((f) => {
      if (destino < 0 || destino >= f.Items.length) return f;
      const items = [...f.Items];
      [items[idx], items[destino]] = [items[destino], items[idx]];
      return { ...f, Items: items };
    });
  };

  const subirItem = (idx) => intercambiarItems(idx, idx - 1);

  const bajarItem = (idx) => intercambiarItems(idx, idx + 1);

  const removerItem = (idx) => {
    setFormSetlist((f) => ({
      ...f,
      Items: f.Items.filter((_, i) => i !== idx),
    }));
  };

  const handleGuardarSetlist = async (e) => {
    e.preventDefault();
    if (!bandaActiva) return;
    setError("");
    setEnviando(true);
    try {
      const payload = {
        Nombre: formSetlist.Nombre.trim(),
        BandaId: bandaActiva.Id,
        EventoId: formSetlist.EventoId ? Number(formSetlist.EventoId) : null,
        Items: formSetlist.Items.map((it, idx) => ({
          CancionId: it.CancionId,
          Orden: idx + 1,
          NotaInterpretacion: it.NotaInterpretacion || null,
        })),
      };
      if (editandoSetlist) {
        await actualizarSetlist(editandoSetlist.Id, payload);
      } else {
        await crearSetlist(payload);
      }
      setModalSetlist(false);
      setEditandoSetlist(null);
      setFormSetlist(FORM_SETLIST);
      await cargar();
    } catch (err) {
      setError(mensajeError(err, "No se pudo guardar el setlist"));
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminarSetlist = async (id) => {
    if (!confirm("¿Eliminar este setlist?")) return;
    try {
      await eliminarSetlist(id);
      await cargar();
    } catch (err) {
      alert(mensajeError(err, "No se pudo eliminar"));
    }
  };

  const cancionesIndex = useMemo(() => {
    const m = new Map();
    canciones.forEach((c) => m.set(c.Id, c));
    return m;
  }, [canciones]);

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Repertorio</h1>
          <p className="text-slate-400 text-sm mt-1">
            Catálogo de canciones y setlists por evento.
          </p>
        </div>
        {bandaActiva && (
          <button
            onClick={tab === "canciones" ? abrirNuevaCancion : abrirNuevoSetlist}
            className="bg-brand-red hover:bg-brand-coral text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {tab === "canciones" ? "Nueva canción" : "Nuevo setlist"}
          </button>
        )}
      </header>

      {!bandaActiva ? (
        <EstadoVacio
          icono={Music}
          titulo="Sin banda seleccionada"
          descripcion="Selecciona o crea una banda."
        />
      ) : (
        <>
          <div className="inline-flex bg-slate-900 border border-slate-800 rounded-xl p-1">
            <TabBoton
              activo={tab === "canciones"}
              onClick={() => setTab("canciones")}
              icono={Music}
            >
              Canciones ({canciones.length})
            </TabBoton>
            <TabBoton
              activo={tab === "setlists"}
              onClick={() => setTab("setlists")}
              icono={ListMusic}
            >
              Setlists ({setlists.length})
            </TabBoton>
          </div>

          {tab === "canciones" && (
            <>
              {canciones.length === 0 ? (
                <EstadoVacio
                  icono={Music}
                  titulo="Sin canciones"
                  descripcion="Empieza a construir tu repertorio."
                />
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-950">
                      <tr className="text-left text-xs text-slate-400 uppercase tracking-wider">
                        <th className="px-4 py-3">Título</th>
                        <th className="px-4 py-3">Tono</th>
                        <th className="px-4 py-3">Duración</th>
                        <th className="px-4 py-3">BPM</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {canciones.map((c) => (
                        <tr key={c.Id} className="text-slate-300">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{c.Titulo}</span>
                              {c.UrlReferencia && (
                                <a
                                  href={c.UrlReferencia}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-brand-orange hover:text-brand-coral"
                                  aria-label="Referencia"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                            {c.Notas && (
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                {c.Notas}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs">{c.Tono || "—"}</td>
                          <td className="px-4 py-3 text-xs">
                            {c.DuracionSegundos != null
                              ? formatearDuracion(c.DuracionSegundos)
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs">{c.Bpm || "—"}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => abrirEditarCancion(c)}
                              className="text-slate-500 hover:text-brand-orange p-1"
                              aria-label="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEliminarCancion(c.Id)}
                              className="text-slate-500 hover:text-red-400 p-1"
                              aria-label="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {tab === "setlists" && (
            <>
              {setlists.length === 0 ? (
                <EstadoVacio
                  icono={ListMusic}
                  titulo="Sin setlists"
                  descripcion="Arma tu primer setlist arrastrando canciones."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {setlists.map((s) => {
                    const evento = eventos.find((e) => e.Id === s.EventoId);
                    const total = s.DuracionTotalSegundos;
                    return (
                      <article
                        key={s.Id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-white font-bold">{s.Nombre}</p>
                            {evento && (
                              <p className="text-xs text-brand-orange mt-0.5">
                                {evento.Nombre} · {formatearFecha(evento.Fecha)}
                              </p>
                            )}
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />{" "}
                              {(s.Items || []).length} canciones ·{" "}
                              {formatearDuracion(total)}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => abrirEditarSetlist(s)}
                              className="text-slate-500 hover:text-brand-orange"
                              aria-label="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEliminarSetlist(s.Id)}
                              className="text-slate-500 hover:text-red-400"
                              aria-label="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {(s.Items || []).length > 0 && (
                          <ol className="mt-3 space-y-1 text-sm text-slate-300">
                            {s.Items.map((it, idx) => {
                              const c = cancionesIndex.get(it.CancionId);
                              return (
                                <li
                                  key={`${s.Id}-${it.CancionId}-${idx}`}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <span>
                                    <span className="text-slate-500">{idx + 1}.</span>{" "}
                                    {c?.Titulo || "Canción eliminada"}
                                  </span>
                                  {c?.DuracionSegundos != null && (
                                    <span className="text-slate-500">
                                      {formatearDuracion(c.DuracionSegundos)}
                                    </span>
                                  )}
                                </li>
                              );
                            })}
                          </ol>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      <Modal
        abierto={modalCancion}
        onCerrar={() => setModalCancion(false)}
        titulo={editandoCancion ? "Editar canción" : "Nueva canción"}
      >
        <form onSubmit={handleGuardarCancion} className="space-y-4">
          <Campo
            label="Título"
            value={formCancion.Titulo}
            onChange={(e) => setFormCancion({ ...formCancion, Titulo: e.target.value })}
            required
          />
          <div className="grid grid-cols-3 gap-3">
            <Campo
              label="Tono"
              placeholder="Em"
              value={formCancion.Tono}
              onChange={(e) =>
                setFormCancion({ ...formCancion, Tono: e.target.value })
              }
            />
            <Campo
              label="Duración"
              placeholder="3:45"
              value={formCancion.duracion}
              onChange={(e) =>
                setFormCancion({ ...formCancion, duracion: e.target.value })
              }
            />
            <Campo
              type="number"
              label="BPM"
              placeholder="120"
              value={formCancion.Bpm}
              onChange={(e) => setFormCancion({ ...formCancion, Bpm: e.target.value })}
            />
          </div>
          <Campo
            type="url"
            label="Referencia (URL)"
            placeholder="https://..."
            value={formCancion.UrlReferencia}
            onChange={(e) =>
              setFormCancion({ ...formCancion, UrlReferencia: e.target.value })
            }
          />
          <div>
            <label className="block text-sm text-slate-300 mb-1">Notas</label>
            <textarea
              value={formCancion.Notas}
              onChange={(e) => setFormCancion({ ...formCancion, Notas: e.target.value })}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-brand-red hover:bg-brand-coral disabled:opacity-60 text-white font-bold py-2 rounded-lg"
          >
            {enviando ? "Guardando..." : editandoCancion ? "Actualizar" : "Crear"}
          </button>
        </form>
      </Modal>

      <Modal
        abierto={modalSetlist}
        onCerrar={() => setModalSetlist(false)}
        titulo={editandoSetlist ? "Editar setlist" : "Nuevo setlist"}
        ancho="max-w-2xl"
      >
        <form onSubmit={handleGuardarSetlist} className="space-y-4">
          <Campo
            label="Nombre del setlist"
            value={formSetlist.Nombre}
            onChange={(e) => setFormSetlist({ ...formSetlist, Nombre: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Evento asociado (opcional)
            </label>
            <select
              value={formSetlist.EventoId}
              onChange={(e) =>
                setFormSetlist({ ...formSetlist, EventoId: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
            >
              <option value="">— Sin evento —</option>
              {eventos.map((e) => (
                <option key={e.Id} value={e.Id}>
                  {e.Nombre} ({formatearFecha(e.Fecha)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Agregar canción</label>
            <select
              onChange={(e) => {
                agregarCancionSetlist(e.target.value);
                e.target.value = "";
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
            >
              <option value="">— Selecciona una canción —</option>
              {canciones.map((c) => (
                <option key={c.Id} value={c.Id}>
                  {c.Titulo}
                </option>
              ))}
            </select>
          </div>

          {formSetlist.Items.length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-lg divide-y divide-slate-800">
              {formSetlist.Items.map((it, idx) => {
                const c = cancionesIndex.get(it.CancionId);
                return (
                  <div
                    key={`${it.CancionId}-${idx}`}
                    className="p-3 flex items-center gap-3"
                  >
                    <span className="text-xs text-slate-500 w-6">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {c?.Titulo || "Canción"}
                      </p>
                      <input
                        type="text"
                        placeholder="Nota de interpretación..."
                        value={it.NotaInterpretacion}
                        onChange={(e) =>
                          setFormSetlist((f) => {
                            const items = [...f.Items];
                            items[idx] = {
                              ...items[idx],
                              NotaInterpretacion: e.target.value,
                            };
                            return { ...f, Items: items };
                          })
                        }
                        className="w-full bg-transparent text-xs text-slate-400 mt-1 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => subirItem(idx)}
                        className="text-slate-500 hover:text-brand-orange p-1"
                        aria-label="Subir"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => bajarItem(idx)}
                        className="text-slate-500 hover:text-brand-orange p-1"
                        aria-label="Bajar"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removerItem(idx)}
                        className="text-slate-500 hover:text-red-400 p-1"
                        aria-label="Quitar"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              <p className="px-3 py-2 text-xs text-slate-400">
                Duración estimada:{" "}
                <span className="text-brand-orange font-semibold">
                  {formatearDuracion(duracionTotalSetlist(formSetlist.Items))}
                </span>
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-brand-red hover:bg-brand-coral disabled:opacity-60 text-white font-bold py-2 rounded-lg"
          >
            {enviando ? "Guardando..." : editandoSetlist ? "Actualizar" : "Crear setlist"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function TabBoton({ activo, onClick, icono: Icono, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        activo
          ? "bg-brand-red/15 text-brand-orange"
          : "text-slate-400 hover:text-white"
      }`}
    >
      <Icono className="w-4 h-4" />
      {children}
    </button>
  );
}

function Campo({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1">{label}</label>
      <input
        {...props}
        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-red/50"
      />
    </div>
  );
}
