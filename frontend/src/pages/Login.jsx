import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import Logo from "../components/Logo";
import { guardarSesion, loginUsuario } from "../api/auth";
import { mensajeError } from "../utils/errores";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ Correo: "", Contrasena: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const data = await loginUsuario(form);
      guardarSesion(data);
      navigate("/");
    } catch (err) {
      setError(mensajeError(err, "No se pudo iniciar sesión"));
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
          <h1 className="text-3xl font-bold text-white">Garage Manager</h1>
          <p className="text-slate-400 mt-2">Tu banda, tu show, tu negocio.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl"
        >
          <h2 className="text-white font-bold text-lg">Iniciar sesión</h2>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Correo</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                name="Correo"
                value={form.Correo}
                onChange={handleChange}
                required
                placeholder="tu@correo.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-3 py-2 text-slate-200 focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                name="Contrasena"
                value={form.Contrasena}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-3 py-2 text-slate-200 focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-brand-red hover:bg-brand-coral disabled:opacity-60 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(230,0,0,0.3)]"
          >
            {enviando ? "Ingresando..." : "Ingresar"}
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-sm text-slate-400">
            ¿Aún no tienes cuenta?{" "}
            <Link to="/registro" className="text-brand-orange hover:text-brand-coral font-medium">
              Registrate
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
