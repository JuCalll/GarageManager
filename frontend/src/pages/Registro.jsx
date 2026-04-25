import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import Logo from "../components/Logo";
import { guardarSesion, loginUsuario, registrarUsuario } from "../api/auth";

export default function Registro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ Nombre: "", Correo: "", Contrasena: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await registrarUsuario(form);
      const data = await loginUsuario({
        Correo: form.Correo,
        Contrasena: form.Contrasena,
      });
      guardarSesion(data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo crear la cuenta");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex mb-4">
            <Logo size={80} />
          </div>
          <h1 className="text-3xl font-bold text-white">Crear cuenta</h1>
          <p className="text-slate-400 mt-2">Empieza a gestionar tu banda hoy.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl"
        >
          <Campo
            label="Nombre"
            name="Nombre"
            value={form.Nombre}
            onChange={handleChange}
            placeholder="Tu nombre"
            icono={User}
            required
          />
          <Campo
            label="Correo"
            type="email"
            name="Correo"
            value={form.Correo}
            onChange={handleChange}
            placeholder="tu@correo.com"
            icono={Mail}
            required
          />
          <Campo
            label="Contraseña"
            type="password"
            name="Contrasena"
            value={form.Contrasena}
            onChange={handleChange}
            placeholder="Mínimo 8 caracteres"
            icono={Lock}
            required
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-brand-red hover:bg-brand-coral disabled:opacity-60 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(230,0,0,0.3)]"
          >
            {enviando ? "Creando..." : "Crear cuenta"}
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-sm text-slate-400">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-brand-orange hover:text-brand-coral font-medium">
              Iniciar sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function Campo({ label, icono: Icono, ...props }) {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1">{label}</label>
      <div className="relative">
        <Icono className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          {...props}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-3 py-2 text-slate-200 focus:outline-none focus:border-brand-orange"
        />
      </div>
    </div>
  );
}
