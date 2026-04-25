import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Wallet,
  Trash2,
  Pencil,
  TrendingUp,
  TrendingDown,
  Filter,
  X as XIcon,
  Download,
  FileText,
} from "lucide-react";
import { useBanda } from "../context/BandaContext";
import {
  crearRegistroFinanciero,
  listarFinanzasBanda,
  actualizarRegistroFinanciero,
  eliminarRegistroFinanciero,
  obtenerBalanceBanda,
} from "../api/finanzas";
import { listarMiembros } from "../api/bandas";
import { listarEventosBanda } from "../api/eventos";
import Modal from "../components/Modal";
import EstadoVacio from "../components/EstadoVacio";
import { formatearFecha, formatearMoneda } from "../utils/format";
import { exportarCSV, exportarPDFImpresion } from "../utils/export";

const FORM_INICIAL = {
  Tipo: "ingreso",
  Concepto: "",
  Monto: "",
  Fecha: new Date().toISOString().slice(0, 10),
  Categoria: "",
  Estado: "pendiente",
  EventoId: "",
  UsuarioPagoId: "",
};

export default function Finanzas() {
  const { bandaActiva } = useBanda();
  const [registros, setRegistros] = useState([]);
  const [balance, setBalance] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [miembros, setMiembros] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editando, setEditando] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [filtros, setFiltros] = useState({
    tipo: "todos",
    estado: "todos",
    desde: "",
    hasta: "",
    categoria: "todas",
  });

  const cargar = async () => {
    if (!bandaActiva) {
      setRegistros([]);
      setBalance(null);
      setEventos([]);
      setMiembros([]);
      return;
    }
    try {
      const [regs, bal, evs, mems] = await Promise.all([
        listarFinanzasBanda(bandaActiva.Id),
        obtenerBalanceBanda(bandaActiva.Id),
        listarEventosBanda(bandaActiva.Id),
        listarMiembros(bandaActiva.Id),
      ]);
      setRegistros(regs);
      setBalance(bal);
      setEventos(evs);
      setMiembros(mems);
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

  const abrirEditar = (r) => {
    setEditando(r);
    setForm({
      Tipo: r.Tipo,
      Concepto: r.Concepto,
      Monto: String(r.Monto),
      Fecha: r.Fecha?.slice(0, 10) || "",
      Categoria: r.Categoria || "",
      Estado: r.Estado || "pendiente",
      EventoId: r.EventoId || "",
      UsuarioPagoId: r.UsuarioPagoId || "",
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
        Tipo: form.Tipo,
        Concepto: form.Concepto,
        Monto: Number(form.Monto),
        Fecha: form.Fecha,
        Categoria: form.Categoria || null,
        Estado: form.Estado,
        BandaId: bandaActiva.Id,
        EventoId: form.EventoId ? Number(form.EventoId) : null,
        UsuarioPagoId:
          form.Tipo === "gasto" && form.UsuarioPagoId
            ? Number(form.UsuarioPagoId)
            : null,
      };
      if (editando) {
        await actualizarRegistroFinanciero(editando.Id, payload);
      } else {
        await crearRegistroFinanciero(payload);
      }
      setModalAbierto(false);
      setForm(FORM_INICIAL);
      setEditando(null);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo guardar el registro");
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este registro?")) return;
    try {
      await eliminarRegistroFinanciero(id);
      await cargar();
    } catch (err) {
      alert(err.response?.data?.detail || "No se pudo eliminar");
    }
  };

  const registrosFiltrados = useMemo(() => {
    return registros
      .filter((r) => {
        if (filtros.tipo !== "todos" && r.Tipo !== filtros.tipo) return false;
        if (filtros.estado !== "todos" && r.Estado !== filtros.estado) return false;
        if (filtros.desde && r.Fecha < filtros.desde) return false;
        if (filtros.hasta && r.Fecha > filtros.hasta) return false;
        if (filtros.categoria !== "todas" && r.Categoria !== filtros.categoria)
          return false;
        return true;
      })
      .sort((a, b) => (a.Fecha < b.Fecha ? 1 : -1));
  }, [registros, filtros]);

  const filtroActivo =
    filtros.tipo !== "todos" ||
    filtros.estado !== "todos" ||
    filtros.desde ||
    filtros.hasta ||
    filtros.categoria !== "todas";

  const handleExportCSV = () => {
    exportarCSV({
      nombreArchivo: `finanzas-${bandaActiva.Url}-${new Date().toISOString().slice(0, 10)}.csv`,
      encabezados: ["Fecha", "Tipo", "Concepto", "Categoría", "Monto", "Estado"],
      filas: registrosFiltrados.map((r) => [
        r.Fecha,
        r.Tipo,
        r.Concepto,
        r.Categoria || "",
        r.Monto,
        r.Estado,
      ]),
    });
  };

  const handleExportPDF = () => {
    exportarPDFImpresion({
      titulo: `Finanzas — ${bandaActiva.Nombre}`,
      subtitulo: `Generado el ${formatearFecha(new Date().toISOString().slice(0, 10))}`,
      secciones: [
        {
          titulo: "Resumen",
          encabezados: ["Concepto", "Valor"],
          filas: [
            ["Ingresos cobrados", formatearMoneda(balance?.TotalIngresos)],
            ["Gastos", formatearMoneda(balance?.TotalGastos)],
            ["Saldo", formatearMoneda(balance?.Saldo)],
          ],
        },
        {
          titulo: "Detalle de movimientos",
          encabezados: ["Fecha", "Tipo", "Concepto", "Categoría", "Monto", "Estado"],
          filas: registrosFiltrados.map((r) => [
            formatearFecha(r.Fecha),
            r.Tipo,
            r.Concepto,
            r.Categoria || "—",
            formatearMoneda(r.Monto),
            r.Estado,
          ]),
        },
      ],
    });
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Finanzas</h1>
          <p className="text-slate-400 text-sm mt-1">
            Ingresos, gastos y balance de la banda.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {registros.length > 0 && (
            <>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 border border-slate-700 hover:border-brand-orange/50 text-slate-200 text-sm py-2 px-3 rounded-lg"
              >
                <Download className="w-4 h-4" /> CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-2 border border-slate-700 hover:border-brand-orange/50 text-slate-200 text-sm py-2 px-3 rounded-lg"
              >
                <FileText className="w-4 h-4" /> PDF
              </button>
            </>
          )}
          <button
            disabled={!bandaActiva}
            onClick={abrirNuevo}
            className="bg-brand-red hover:bg-brand-coral disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Nuevo
          </button>
        </div>
      </header>

      {!bandaActiva ? (
        <EstadoVacio
          icono={Wallet}
          titulo="Sin banda seleccionada"
          descripcion="Selecciona o crea una banda."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-widest">
              <Filter className="w-4 h-4" /> Filtros
            </div>
            <SelectFiltro
              label="Tipo"
              value={filtros.tipo}
              onChange={(v) => setFiltros((f) => ({ ...f, tipo: v }))}
              options={[
                { value: "todos", label: "Todos" },
                { value: "ingreso", label: "Ingresos" },
                { value: "gasto", label: "Gastos" },
              ]}
            />
            <SelectFiltro
              label="Estado"
              value={filtros.estado}
              onChange={(v) => setFiltros((f) => ({ ...f, estado: v }))}
              options={[
                { value: "todos", label: "Todos" },
                { value: "pendiente", label: "Pendiente" },
                { value: "cobrado", label: "Cobrado" },
                { value: "reembolsado", label: "Reembolsado" },
              ]}
            />
            <SelectFiltro
              label="Categoría"
              value={filtros.categoria}
              onChange={(v) => setFiltros((f) => ({ ...f, categoria: v }))}
              options={[
                { value: "todas", label: "Todas" },
                { value: "transporte", label: "Transporte" },
                { value: "sonido", label: "Sonido" },
                { value: "equipos", label: "Equipos" },
                { value: "promocion", label: "Promoción" },
                { value: "otros", label: "Otros" },
              ]}
            />
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
            {filtroActivo && (
              <button
                onClick={() =>
                  setFiltros({
                    tipo: "todos",
                    estado: "todos",
                    desde: "",
                    hasta: "",
                    categoria: "todas",
                  })
                }
                className="text-xs text-brand-orange hover:text-brand-coral inline-flex items-center gap-1"
              >
                <XIcon className="w-3 h-3" /> Limpiar
              </button>
            )}
            <span className="ml-auto text-xs text-slate-500">
              {registrosFiltrados.length} de {registros.length}
            </span>
          </div>

          {registrosFiltrados.length === 0 ? (
            <EstadoVacio
              icono={Wallet}
              titulo={filtroActivo ? "Sin resultados" : "Sin movimientos"}
              descripcion="Registra tus primeros ingresos y gastos."
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-950">
                  <tr className="text-left text-xs text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Concepto</th>
                    <th className="px-4 py-3 hidden md:table-cell">Categoría</th>
                    <th className="px-4 py-3">Monto</th>
                    <th className="px-4 py-3 hidden md:table-cell">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {registrosFiltrados.map((r) => (
                    <tr key={r.Id} className="text-slate-300">
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {formatearFecha(r.Fecha)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{r.Concepto}</p>
                        <p className="text-xs text-slate-500 capitalize">
                          {r.Tipo}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs capitalize">
                        {r.Categoria || "—"}
                      </td>
                      <td
                        className={`px-4 py-3 font-bold ${
                          r.Tipo === "ingreso"
                            ? "text-brand-orange"
                            : "text-red-400"
                        }`}
                      >
                        {r.Tipo === "ingreso" ? "+" : "-"}
                        {formatearMoneda(r.Monto)}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <EstadoBadge estado={r.Estado} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => abrirEditar(r)}
                          className="text-slate-500 hover:text-brand-orange p-1"
                          aria-label="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEliminar(r.Id)}
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

          {balance?.BalancesIndividuales?.length > 0 && (
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-3">Balance por miembro</h3>
              <ul className="divide-y divide-slate-800">
                {balance.BalancesIndividuales.map((s) => (
                  <li key={s.UsuarioId} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="text-white font-medium">{s.Nombre}</p>
                      <p className="text-xs text-slate-500">
                        Aportó {formatearMoneda(s.TotalAportado)} · Pendiente
                        reembolso {formatearMoneda(s.PendienteReembolso)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-brand-orange capitalize">
                      {s.Estado}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <Modal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        titulo={editando ? "Editar registro" : "Nuevo registro"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Tipo</label>
            <select
              name="Tipo"
              value={form.Tipo}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
            >
              <option value="ingreso">Ingreso</option>
              <option value="gasto">Gasto</option>
            </select>
          </div>
          <Campo
            label="Concepto"
            name="Concepto"
            value={form.Concepto}
            onChange={handleChange}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Campo
              type="number"
              label="Monto"
              name="Monto"
              value={form.Monto}
              onChange={handleChange}
              required
              min="0"
              step="any"
            />
            <Campo
              type="date"
              label="Fecha"
              name="Fecha"
              value={form.Fecha}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Categoría</label>
            <select
              name="Categoria"
              value={form.Categoria}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
            >
              <option value="">— Sin categoría —</option>
              <option value="transporte">Transporte</option>
              <option value="sonido">Sonido</option>
              <option value="equipos">Equipos</option>
              <option value="promocion">Promoción</option>
              <option value="otros">Otros</option>
            </select>
          </div>

          {form.Tipo === "gasto" && (
            <div>
              <label className="block text-sm text-slate-300 mb-1">
                Responsable del pago
              </label>
              <select
                name="UsuarioPagoId"
                value={form.UsuarioPagoId}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
              >
                <option value="">— Sin asignar —</option>
                {miembros.map((m) => (
                  <option key={m.UsuarioId} value={m.UsuarioId}>
                    {m.Usuario.Nombre} ({m.Rol})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-300 mb-1">Estado</label>
            <select
              name="Estado"
              value={form.Estado}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
            >
              <option value="pendiente">Pendiente</option>
              <option value="cobrado">Cobrado</option>
              <option value="reembolsado">Reembolsado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Evento (opcional)</label>
            <select
              name="EventoId"
              value={form.EventoId}
              onChange={handleChange}
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

          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-brand-red hover:bg-brand-coral disabled:opacity-60 text-white font-bold py-2 rounded-lg"
          >
            {enviando ? "Guardando..." : editando ? "Actualizar" : "Registrar"}
          </button>
        </form>
      </Modal>
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
      <p className="text-xl font-bold text-white mt-1">{valor}</p>
    </div>
  );
}

function SelectFiltro({ label, value, onChange, options }) {
  return (
    <label className="text-xs text-slate-400">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block input mt-1"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EstadoBadge({ estado }) {
  const map = {
    pendiente: "bg-yellow-500/15 text-yellow-300",
    cobrado: "bg-brand-orange/15 text-brand-orange",
    reembolsado: "bg-brand-red/15 text-brand-coral",
  };
  return (
    <span
      className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
        map[estado] || "bg-slate-700/40 text-slate-300"
      }`}
    >
      {estado}
    </span>
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
