import { useEffect, useMemo, useState } from "react";
import { Plus, StickyNote, Trash2, Pencil, Search, X as XIcon } from "lucide-react";
import { useBanda } from "../context/BandaContext";
import {
  crearNota,
  listarNotasBanda,
  actualizarNota,
  eliminarNota,
} from "../api/notas";
import Modal from "../components/Modal";
import EstadoVacio from "../components/EstadoVacio";
import { formatearFecha } from "../utils/format";
import { mensajeError } from "../utils/errores";

const FORM_INICIAL = { Contenido: "" };

export default function Notas() {
  const { bandaActiva } = useBanda();
  const [notas, setNotas] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editando, setEditando] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const cargar = async () => {
    if (!bandaActiva) return setNotas([]);
    try {
      const lista = await listarNotasBanda(bandaActiva.Id);
      setNotas(lista);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargar();
  }, [bandaActiva?.Id]); // eslint-disable-line react-hooks/exhaustive-deps

  const abrirNueva = () => {
    setEditando(null);
    setForm(FORM_INICIAL);
    setError("");
    setModalAbierto(true);
  };

  const abrirEditar = (n) => {
    setEditando(n);
    setForm({ Contenido: n.Contenido });
    setError("");
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bandaActiva) return;
    setError("");
    setEnviando(true);
    try {
      if (editando) {
        await actualizarNota(editando.Id, { Contenido: form.Contenido });
      } else {
        await crearNota({ Contenido: form.Contenido, BandaId: bandaActiva.Id });
      }
      setModalAbierto(false);
      setForm(FORM_INICIAL);
      setEditando(null);
      await cargar();
    } catch (err) {
      setError(mensajeError(err, "No se pudo guardar la nota"));
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar esta nota?")) return;
    try {
      await eliminarNota(id);
      await cargar();
    } catch (err) {
      alert(mensajeError(err, "No se pudo eliminar"));
    }
  };

  const notasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return notas;
    return notas.filter((n) => n.Contenido.toLowerCase().includes(q));
  }, [notas, busqueda]);

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Notas</h1>
          <p className="text-slate-400 text-sm mt-1">
            Ideas, recordatorios y pendientes de la banda.
          </p>
        </div>
        <button
          disabled={!bandaActiva}
          onClick={abrirNueva}
          className="bg-brand-red hover:bg-brand-coral disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Nueva nota
        </button>
      </header>

      {!bandaActiva ? (
        <EstadoVacio
          icono={StickyNote}
          titulo="Sin banda seleccionada"
          descripcion="Selecciona o crea una banda."
        />
      ) : (
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="search"
              placeholder="Buscar en notas..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-9 py-2 text-slate-200 focus:outline-none focus:border-brand-orange"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                aria-label="Limpiar"
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {notasFiltradas.length === 0 ? (
            <EstadoVacio
              icono={StickyNote}
              titulo={busqueda ? "Sin resultados" : "Sin notas"}
              descripcion={
                busqueda ? "Probá con otra búsqueda." : "Crea tu primera nota."
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notasFiltradas.map((n) => (
                <article
                  key={n.Id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col"
                >
                  <p className="text-sm text-slate-200 whitespace-pre-wrap flex-1 line-clamp-[10]">
                    {n.Contenido}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      {formatearFecha(n.FechaCreacion)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirEditar(n)}
                        className="text-slate-500 hover:text-brand-orange"
                        aria-label="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEliminar(n.Id)}
                        className="text-slate-500 hover:text-red-400"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        titulo={editando ? "Editar nota" : "Nueva nota"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={form.Contenido}
            onChange={(e) => setForm({ Contenido: e.target.value })}
            rows={8}
            required
            placeholder="Escribe tu nota..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-red/50"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-brand-red hover:bg-brand-coral disabled:opacity-60 text-white font-bold py-2 rounded-lg"
          >
            {enviando ? "Guardando..." : editando ? "Actualizar" : "Crear nota"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
