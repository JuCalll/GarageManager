import { useEffect, useState } from "react";
import {
  Plus,
  Users,
  Music,
  Trash2,
  ExternalLink,
  UserPlus,
  Globe,
} from "lucide-react";
import { PLATAFORMAS, obtenerPlataforma, validarUrlRed } from "../utils/redes";
import { useBanda } from "../context/BandaContext";
import {
  crearBanda,
  actualizarBanda,
  listarMiembros,
  invitarMiembro,
  eliminarMiembro,
  listarRedes,
  agregarRed,
  eliminarRed,
} from "../api/bandas";
import Modal from "../components/Modal";
import EstadoVacio from "../components/EstadoVacio";

const slugify = (texto) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const FORM_INICIAL = {
  Nombre: "",
  Genero: "",
  Ciudad: "",
  Descripcion: "",
  PortadaUrl: "",
  Url: "",
};

export default function Banda() {
  const { bandas, bandaActiva, recargarBandas, cargando } = useBanda();
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalMiembro, setModalMiembro] = useState(false);
  const [modalRed, setModalRed] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [formMiembro, setFormMiembro] = useState({
    Correo: "",
    Rol: "",
    EsAdministrador: false,
  });
  const [formRed, setFormRed] = useState({ Plataforma: "Instagram", Url: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [miembros, setMiembros] = useState([]);
  const [redes, setRedes] = useState([]);

  const cargarDetalle = async () => {
    if (!bandaActiva) {
      setMiembros([]);
      setRedes([]);
      return;
    }
    try {
      const [m, r] = await Promise.all([
        listarMiembros(bandaActiva.Id),
        listarRedes(bandaActiva.Id),
      ]);
      setMiembros(m);
      setRedes(r);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargarDetalle();
  }, [bandaActiva?.Id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChangeCrear = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "Nombre" && (!prev.Url || prev.Url === slugify(prev.Nombre))) {
        next.Url = slugify(value);
      }
      return next;
    });
  };

  const handleCrearBanda = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await crearBanda({
        Nombre: form.Nombre.trim(),
        Genero: form.Genero.trim() || null,
        Ciudad: form.Ciudad.trim() || null,
        Descripcion: form.Descripcion.trim() || null,
        PortadaUrl: form.PortadaUrl.trim() || null,
        Url: slugify(form.Url || form.Nombre),
      });
      setModalCrear(false);
      setForm(FORM_INICIAL);
      await recargarBandas();
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo crear la banda");
    } finally {
      setEnviando(false);
    }
  };

  const abrirEditar = () => {
    if (!bandaActiva) return;
    setForm({
      Nombre: bandaActiva.Nombre || "",
      Genero: bandaActiva.Genero || "",
      Ciudad: bandaActiva.Ciudad || "",
      Descripcion: bandaActiva.Descripcion || "",
      PortadaUrl: bandaActiva.PortadaUrl || "",
      Url: bandaActiva.Url || "",
    });
    setError("");
    setModalEditar(true);
  };

  const handleEditarBanda = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await actualizarBanda(bandaActiva.Id, {
        Nombre: form.Nombre.trim(),
        Genero: form.Genero.trim() || null,
        Ciudad: form.Ciudad.trim() || null,
        Descripcion: form.Descripcion.trim() || null,
        PortadaUrl: form.PortadaUrl.trim() || null,
      });
      setModalEditar(false);
      await recargarBandas();
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo actualizar la banda");
    } finally {
      setEnviando(false);
    }
  };

  const handleInvitarMiembro = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await invitarMiembro(bandaActiva.Id, formMiembro);
      setModalMiembro(false);
      setFormMiembro({ Correo: "", Rol: "", EsAdministrador: false });
      await cargarDetalle();
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo invitar al miembro");
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminarMiembro = async (miembroId) => {
    if (!confirm("¿Eliminar este miembro de la banda?")) return;
    try {
      await eliminarMiembro(bandaActiva.Id, miembroId);
      await cargarDetalle();
    } catch (err) {
      alert(err.response?.data?.detail || "No se pudo eliminar");
    }
  };

  const handleAgregarRed = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await agregarRed(bandaActiva.Id, formRed);
      setModalRed(false);
      setFormRed({ Plataforma: "Instagram", Url: "" });
      await cargarDetalle();
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo agregar la red");
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminarRed = async (redId) => {
    if (!confirm("¿Eliminar esta red social?")) return;
    try {
      await eliminarRed(bandaActiva.Id, redId);
      await cargarDetalle();
    } catch (err) {
      alert(err.response?.data?.detail || "No se pudo eliminar");
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Mi Banda</h1>
          <p className="text-slate-400 text-sm mt-1">
            Perfil, miembros y presencia digital.
          </p>
        </div>
        <button
          onClick={() => {
            setForm(FORM_INICIAL);
            setError("");
            setModalCrear(true);
          }}
          className="bg-brand-red hover:bg-brand-coral text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-[0_0_10px_rgba(230,0,0,0.2)]"
        >
          <Plus className="w-5 h-5" /> Crear Banda
        </button>
      </header>

      {cargando ? (
        <p className="text-slate-400">Cargando bandas...</p>
      ) : bandas.length === 0 ? (
        <EstadoVacio
          icono={Music}
          titulo="Aún no tienes bandas"
          descripcion="Crea tu primera banda para comenzar."
        />
      ) : (
        <>
          {bandaActiva && (
            <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              {bandaActiva.PortadaUrl ? (
                <div
                  className="h-40 bg-cover bg-center"
                  style={{ backgroundImage: `url(${bandaActiva.PortadaUrl})` }}
                />
              ) : (
                <div className="h-40 bg-gradient-to-br from-brand-red/30 to-slate-900" />
              )}
              <div className="p-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {bandaActiva.Nombre}
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {bandaActiva.Genero || "Sin género"}
                    {bandaActiva.Ciudad ? ` · ${bandaActiva.Ciudad}` : ""}
                  </p>
                  {bandaActiva.Descripcion && (
                    <p className="text-sm text-slate-300 mt-3 max-w-2xl">
                      {bandaActiva.Descripcion}
                    </p>
                  )}
                  <a
                    href={`/publico/${bandaActiva.Url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 mt-3 text-brand-orange text-sm hover:underline"
                  >
                    Ver perfil público
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <button
                  onClick={abrirEditar}
                  className="border border-slate-700 hover:border-brand-red/40 text-slate-200 text-sm px-4 py-2 rounded-lg"
                >
                  Editar perfil
                </button>
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-orange" /> Miembros
                </h3>
                <button
                  onClick={() => {
                    setError("");
                    setModalMiembro(true);
                  }}
                  className="flex items-center gap-1 text-sm text-brand-orange hover:text-brand-coral"
                >
                  <UserPlus className="w-4 h-4" /> Invitar
                </button>
              </div>
              {miembros.length === 0 ? (
                <p className="text-slate-400 text-sm">
                  Aún no hay miembros registrados.
                </p>
              ) : (
                <ul className="divide-y divide-slate-800">
                  {miembros.map((m) => (
                    <li
                      key={m.Id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-white font-medium">{m.Usuario.Nombre}</p>
                        <p className="text-xs text-slate-400">
                          {m.Rol}
                          {m.EsAdministrador && (
                            <span className="ml-2 text-brand-orange">· admin</span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEliminarMiembro(m.Id)}
                        className="text-slate-500 hover:text-red-400"
                        aria-label="Eliminar miembro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-brand-orange" /> Redes sociales
                </h3>
                <button
                  onClick={() => {
                    setError("");
                    setModalRed(true);
                  }}
                  className="flex items-center gap-1 text-sm text-brand-orange hover:text-brand-coral"
                >
                  <Plus className="w-4 h-4" /> Agregar
                </button>
              </div>
              {redes.length === 0 ? (
                <p className="text-slate-400 text-sm">
                  Aún no has conectado redes sociales.
                </p>
              ) : (
                <ul className="divide-y divide-slate-800">
                  {redes.map((r) => {
                    const plat = obtenerPlataforma(r.Plataforma);
                    const Icono = plat.icono;
                    return (
                      <li
                        key={r.Id}
                        className="py-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`p-2 rounded-lg bg-slate-950 ${plat.color}`}>
                            <Icono className="w-4 h-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium">
                              {r.Plataforma}
                            </p>
                            <a
                              href={r.Url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-brand-orange hover:underline truncate block max-w-[240px]"
                            >
                              {r.Url}
                            </a>
                          </div>
                        </div>
                        <button
                          onClick={() => handleEliminarRed(r.Id)}
                          className="text-slate-500 hover:text-red-400"
                          aria-label="Eliminar red"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <section>
            <h3 className="text-white font-semibold mb-3">Todas mis bandas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bandas.map((banda) => (
                <div
                  key={banda.Id}
                  className={`bg-slate-900 border rounded-xl p-4 flex items-center justify-between ${
                    bandaActiva?.Id === banda.Id
                      ? "border-brand-red/40"
                      : "border-slate-800"
                  }`}
                >
                  <div>
                    <p className="text-white font-medium">{banda.Nombre}</p>
                    <p className="text-xs text-slate-500">/{banda.Url}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <Modal
        abierto={modalCrear}
        onCerrar={() => setModalCrear(false)}
        titulo="Crear nueva banda"
      >
        <form onSubmit={handleCrearBanda} className="space-y-4">
          <Campo
            label="Nombre"
            name="Nombre"
            value={form.Nombre}
            onChange={handleChangeCrear}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Campo label="Género" name="Genero" value={form.Genero} onChange={handleChangeCrear} />
            <Campo label="Ciudad" name="Ciudad" value={form.Ciudad} onChange={handleChangeCrear} />
          </div>
          <Campo
            label="URL pública"
            name="Url"
            value={form.Url}
            onChange={handleChangeCrear}
            required
          />
          <Campo
            label="Imagen de portada (URL)"
            name="PortadaUrl"
            value={form.PortadaUrl}
            onChange={handleChangeCrear}
            placeholder="https://..."
          />
          <div>
            <label className="block text-sm text-slate-300 mb-1">Descripción</label>
            <textarea
              name="Descripcion"
              value={form.Descripcion}
              onChange={handleChangeCrear}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-red/50"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-brand-red hover:bg-brand-coral disabled:opacity-60 text-white font-bold py-2 rounded-lg"
          >
            {enviando ? "Creando..." : "Crear banda"}
          </button>
        </form>
      </Modal>

      <Modal
        abierto={modalEditar}
        onCerrar={() => setModalEditar(false)}
        titulo="Editar banda"
      >
        <form onSubmit={handleEditarBanda} className="space-y-4">
          <Campo
            label="Nombre"
            name="Nombre"
            value={form.Nombre}
            onChange={handleChangeCrear}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Campo label="Género" name="Genero" value={form.Genero} onChange={handleChangeCrear} />
            <Campo label="Ciudad" name="Ciudad" value={form.Ciudad} onChange={handleChangeCrear} />
          </div>
          <Campo
            label="Imagen de portada (URL)"
            name="PortadaUrl"
            value={form.PortadaUrl}
            onChange={handleChangeCrear}
          />
          <div>
            <label className="block text-sm text-slate-300 mb-1">Descripción</label>
            <textarea
              name="Descripcion"
              value={form.Descripcion}
              onChange={handleChangeCrear}
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
            {enviando ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </Modal>

      <Modal
        abierto={modalMiembro}
        onCerrar={() => setModalMiembro(false)}
        titulo="Invitar miembro"
      >
        <form onSubmit={handleInvitarMiembro} className="space-y-4">
          <Campo
            type="email"
            label="Correo del miembro registrado"
            value={formMiembro.Correo}
            onChange={(e) => setFormMiembro({ ...formMiembro, Correo: e.target.value })}
            required
          />
          <Campo
            label="Rol"
            placeholder="Vocalista, bajista, manager..."
            value={formMiembro.Rol}
            onChange={(e) => setFormMiembro({ ...formMiembro, Rol: e.target.value })}
            required
          />
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={formMiembro.EsAdministrador}
              onChange={(e) =>
                setFormMiembro({ ...formMiembro, EsAdministrador: e.target.checked })
              }
              className="accent-brand-red"
            />
            Conceder permisos de administrador
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-brand-red hover:bg-brand-coral disabled:opacity-60 text-white font-bold py-2 rounded-lg"
          >
            {enviando ? "Invitando..." : "Invitar"}
          </button>
        </form>
      </Modal>

      <Modal
        abierto={modalRed}
        onCerrar={() => setModalRed(false)}
        titulo="Agregar red social"
      >
        <RedSocialForm
          formRed={formRed}
          setFormRed={setFormRed}
          enviando={enviando}
          errorExterno={error}
          setErrorExterno={setError}
          onSubmit={handleAgregarRed}
        />
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

function RedSocialForm({
  formRed,
  setFormRed,
  enviando,
  errorExterno,
  setErrorExterno,
  onSubmit,
}) {
  const plataforma = obtenerPlataforma(formRed.Plataforma);
  const PlataformaIcono = plataforma.icono;
  const validacion = formRed.Url
    ? validarUrlRed(formRed.Plataforma, formRed.Url)
    : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorExterno("");
    const v = validarUrlRed(formRed.Plataforma, formRed.Url);
    if (!v.valido) {
      setErrorExterno(v.mensaje);
      return;
    }
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-slate-300 mb-2">Plataforma</label>
        <div className="grid grid-cols-3 gap-2">
          {PLATAFORMAS.map((p) => {
            const Icono = p.icono;
            const activo = p.id === formRed.Plataforma;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  setFormRed({ ...formRed, Plataforma: p.id })
                }
                className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-xs ${
                  activo
                    ? "border-brand-red bg-brand-red/10 text-white"
                    : "border-slate-800 text-slate-400 hover:border-brand-orange/50"
                }`}
              >
                <Icono className={`w-4 h-4 ${p.color}`} />
                {p.id}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">URL</label>
        <div className="relative">
          <PlataformaIcono
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${plataforma.color}`}
          />
          <input
            type="url"
            required
            value={formRed.Url}
            onChange={(e) => setFormRed({ ...formRed, Url: e.target.value })}
            placeholder={plataforma.placeholder}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-3 py-2 text-slate-200 focus:outline-none focus:border-brand-orange"
          />
        </div>
        {validacion && !validacion.valido && (
          <p className="text-xs text-red-400 mt-1">{validacion.mensaje}</p>
        )}
        {validacion?.valido && (
          <p className="text-xs text-brand-coral mt-1">URL válida ✓</p>
        )}
      </div>

      {errorExterno && <p className="text-sm text-red-400">{errorExterno}</p>}
      <button
        type="submit"
        disabled={enviando}
        className="w-full bg-brand-red hover:bg-brand-coral disabled:opacity-60 text-white font-bold py-2 rounded-lg"
      >
        {enviando ? "Guardando..." : "Agregar"}
      </button>
    </form>
  );
}
