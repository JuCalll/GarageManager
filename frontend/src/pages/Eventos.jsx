import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  CalendarDays,
  Trash2,
  Pencil,
  Filter,
  X as XIcon,
  ListMusic,
  MapPin,
  DollarSign,
} from "lucide-react";
import { useBanda } from "../context/BandaContext";
import {
  crearEvento,
  listarEventosBanda,
  actualizarEvento,
  eliminarEvento,
} from "../api/eventos";
import { obtenerSetlistDeEvento } from "../api/repertorio";
import Modal from "../components/Modal";
import EstadoVacio from "../components/EstadoVacio";
import { formatearFechaHora } from "../utils/format";
import { notificarRefresh } from "../components/CampanaNotificaciones";
import { mensajeError } from "../utils/errores";

const FORM_INICIAL = {
  Nombre: "",
  Fecha: "",
  Hora: "",
  Lugar: "",
  Direccion: "",
  CondicionPago: "remunerado",
  ContactoOrganizador: "",
  Notas: "",
};

export default function Eventos() {
  const { bandaActiva } = useBanda();
  const [eventos, setEventos] = useState([]);
  const [setlistsPorEvento, setSetlistsPorEvento] = useState({});
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [editando, setEditando] = useState(null);
  const [filtros, setFiltros] = useState({
    desde: "",
    hasta: "",
    condicion: "todas",
  });

  const cargar = async () => {
    if (!bandaActiva) {
      setEventos([]);
      setSetlistsPorEvento({});
      return;
    }
    try {
      const lista = await listarEventosBanda(bandaActiva.Id);
      setEventos(lista);
      const mapa = {};
      await Promise.all(
        lista.map(async (e) => {
          try {
            const sl = await obtenerSetlistDeEvento(e.Id);
            if (sl) mapa[e.Id] = sl;
          } catch {}
        })
      );
      setSetlistsPorEvento(mapa);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargar();
  }, [bandaActiva?.Id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const abrirNuevo = () => {
    setEditando(null);
    setForm(FORM_INICIAL);
    setError("");
    setModalAbierto(true);
  };

  const abrirEditar = (ev) => {
    setEditando(ev);
    setForm({
      Nombre: ev.Nombre,
      Fecha: ev.Fecha?.slice(0, 10) || "",
      Hora: String(ev.Hora || "").slice(0, 5),
      Lugar: ev.Lugar,
      Direccion: ev.Direccion || "",
      CondicionPago: ev.CondicionPago,
      ContactoOrganizador: ev.ContactoOrganizador || "",
      Notas: ev.Notas || "",
    });
    setError("");
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bandaActiva) return;
    setError("");
    setEnviando(true);
    try {
      const payload = {
        ...form,
        Direccion: form.Direccion || null,
        ContactoOrganizador: form.ContactoOrganizador || null,
        Notas: form.Notas || null,
        BandaId: bandaActiva.Id,
      };
      if (editando) {
        await actualizarEvento(editando.Id, payload);
      } else {
        await crearEvento(payload);
        notificarRefresh();
      }
      setModalAbierto(false);
      setForm(FORM_INICIAL);
      setEditando(null);
      await cargar();
    } catch (err) {
      setError(mensajeError(err, "No se pudo guardar el evento"));
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este evento?")) return;
    try {
      await eliminarEvento(id);
      await cargar();
    } catch (err) {
      alert(mensajeError(err, "No se pudo eliminar"));
    }
  };

  const eventosFiltrados = useMemo(() => {
    return eventos
      .filter((ev) => {
        if (filtros.desde && ev.Fecha < filtros.desde) return false;
        if (filtros.hasta && ev.Fecha > filtros.hasta) return false;
        if (filtros.condicion !== "todas" && ev.CondicionPago !== filtros.condicion)
          return false;
        return true;
      })
      .sort((a, b) => (a.Fecha < b.Fecha ? 1 : -1));
  }, [eventos, filtros]);

  const filtroActivo =
    filtros.desde || filtros.hasta || filtros.condicion !== "todas";

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Eventos</h1>
          <p className="text-slate-400 text-sm mt-1">
            Agenda de shows, ensayos y compromisos.
          </p>
        </div>
        <button
          disabled={!bandaActiva}
          onClick={abrirNuevo}
          className="bg-brand-red hover:bg-brand-coral disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-[0_0_10px_rgba(230,0,0,0.2)]"
        >
          <Plus className="w-5 h-5" /> Nuevo evento
        </button>
      </header>

      {!bandaActiva ? (
        <EstadoVacio
          icono={CalendarDays}
          titulo="Sin banda seleccionada"
          descripcion="Selecciona o crea una banda."
        />
      ) : (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-widest">
              <Filter className="w-4 h-4" /> Filtros
            </div>
            <label className="text-xs text-slate-400">
              Desde
              <input
                type="date"
                value={filtros.desde}
                onChange={(e) => setFiltros((f) => ({ ...f, desde: e.target.value }))}
                className="block input mt-1"
              />
            </label>
            <label className="text-xs text-slate-400">
              Hasta
              <input
                type="date"
                value={filtros.hasta}
                onChange={(e) => setFiltros((f) => ({ ...f, hasta: e.target.value }))}
                className="block input mt-1"
              />
            </label>
            <label className="text-xs text-slate-400">
              Condición
              <select
                value={filtros.condicion}
                onChange={(e) => setFiltros((f) => ({ ...f, condicion: e.target.value }))}
                className="block input mt-1"
              >
                <option value="todas">Todas</option>
                <option value="remunerado">Remunerado</option>
                <option value="sin remuneracion">Sin remuneración</option>
              </select>
            </label>
            {filtroActivo && (
              <button
                onClick={() =>
                  setFiltros({ desde: "", hasta: "", condicion: "todas" })
                }
                className="text-xs text-brand-orange hover:text-brand-coral inline-flex items-center gap-1"
              >
                <XIcon className="w-3 h-3" /> Limpiar
              </button>
            )}
            <span className="ml-auto text-xs text-slate-500">
              {eventosFiltrados.length} de {eventos.length}
            </span>
          </div>

          {eventosFiltrados.length === 0 ? (
            <EstadoVacio
              icono={CalendarDays}
              titulo={filtroActivo ? "Sin resultados" : "Sin eventos"}
              descripcion={
                filtroActivo
                  ? "Probá con otros filtros o limpialos."
                  : "Crea tu primer evento."
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eventosFiltrados.map((ev) => {
                const sl = setlistsPorEvento[ev.Id];
                return (
                  <article
                    key={ev.Id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="text-white font-bold text-lg truncate">
                          {ev.Nombre}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatearFechaHora(ev.Fecha, ev.Hora)}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          ev.CondicionPago === "remunerado"
                            ? "bg-brand-red/15 text-brand-orange"
                            : "bg-slate-700/40 text-slate-300"
                        }`}
                      >
                        {ev.CondicionPago === "remunerado" ? (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> Remunerado
                          </span>
                        ) : (
                          "Sin remuneración"
                        )}
                      </span>
                    </div>
                    <div className="mt-3 text-sm text-slate-300 flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 text-brand-orange shrink-0" />
                      <div>
                        <p>{ev.Lugar}</p>
                        {ev.Direccion && (
                          <p className="text-xs text-slate-500">{ev.Direccion}</p>
                        )}
                      </div>
                    </div>
                    {ev.Notas && (
                      <p className="mt-3 text-xs text-slate-400 line-clamp-3">
                        {ev.Notas}
                      </p>
                    )}
                    {sl && (
                      <div className="mt-3 inline-flex items-center gap-2 text-xs bg-brand-orange/10 text-brand-orange px-2.5 py-1 rounded-lg">
                        <ListMusic className="w-3.5 h-3.5" />
                        Setlist: {sl.Nombre}
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-end gap-2">
                      <button
                        onClick={() => abrirEditar(ev)}
                        className="text-slate-500 hover:text-brand-orange"
                        aria-label="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEliminar(ev.Id)}
                        className="text-slate-500 hover:text-red-400"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        titulo={editando ? "Editar evento" : "Nuevo evento"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Campo
            label="Nombre"
            name="Nombre"
            value={form.Nombre}
            onChange={handleChange}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Campo
              type="date"
              label="Fecha"
              name="Fecha"
              value={form.Fecha}
              onChange={handleChange}
              required
            />
            <Campo
              type="time"
              label="Hora"
              name="Hora"
              value={form.Hora}
              onChange={handleChange}
              required
            />
          </div>
          <Campo
            label="Lugar"
            name="Lugar"
            value={form.Lugar}
            onChange={handleChange}
            required
          />
          <Campo
            label="Dirección"
            name="Direccion"
            value={form.Direccion}
            onChange={handleChange}
          />
          <div>
            <label className="block text-sm text-slate-300 mb-1">Condición de pago</label>
            <select
              name="CondicionPago"
              value={form.CondicionPago}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
            >
              <option value="remunerado">Remunerado</option>
              <option value="sin remuneracion">Sin remuneración</option>
            </select>
          </div>
          <Campo
            label="Contacto del organizador"
            name="ContactoOrganizador"
            value={form.ContactoOrganizador}
            onChange={handleChange}
            placeholder="Nombre, teléfono, email..."
          />
          <div>
            <label className="block text-sm text-slate-300 mb-1">Notas</label>
            <textarea
              name="Notas"
              value={form.Notas}
              onChange={handleChange}
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
            {enviando ? "Guardando..." : editando ? "Actualizar" : "Crear evento"}
          </button>
        </form>
      </Modal>
    </div>
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
