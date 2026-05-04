import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Wallet,
  StickyNote,
  ListMusic,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Logo from "./Logo";
import SelectorBanda from "./SelectorBanda";
import CampanaNotificaciones from "./CampanaNotificaciones";
import BotonAccesibilidad from "./BotonAccesibilidad";
import { cerrarSesion, obtenerUsuarioLocal } from "../api/auth";

const NAV = [
  { to: "/", label: "Dashboard", icono: LayoutDashboard, end: true },
  { to: "/banda", label: "Mi Banda", icono: Users },
  { to: "/eventos", label: "Eventos", icono: CalendarDays },
  { to: "/finanzas", label: "Finanzas", icono: Wallet },
  { to: "/notas", label: "Notas", icono: StickyNote },
  { to: "/repertorio", label: "Repertorio", icono: ListMusic },
];

export default function Layout() {
  const navigate = useNavigate();
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const usuario = obtenerUsuarioLocal();

  useEffect(() => {
    setDrawerAbierto(false);
  }, []);

  const handleLogout = () => {
    cerrarSesion();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 bg-slate-900 border-r border-slate-800 flex-col">
        <div className="px-4 py-6 border-b border-slate-800 flex items-center justify-center">
          <Logo size={140} />
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-brand-red/15 text-brand-orange"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`
              }
            >
              <item.icono className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          {usuario && (
            <div className="mb-3">
              <p className="text-white text-sm font-medium truncate">
                {usuario.Nombre}
              </p>
              <p className="text-xs text-slate-500 truncate">{usuario.Correo}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm"
          >
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Drawer móvil */}
      {drawerAbierto && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setDrawerAbierto(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
            <div className="relative px-4 py-6 border-b border-slate-800 flex items-center justify-center">
              <Logo size={120} />
              <button
                onClick={() => setDrawerAbierto(false)}
                className="absolute right-3 top-3 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setDrawerAbierto(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg text-sm ${
                      isActive
                        ? "bg-brand-red/15 text-brand-orange"
                        : "text-slate-300 hover:bg-slate-800/50"
                    }`
                  }
                >
                  <item.icono className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm"
              >
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Contenido */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 lg:px-6 py-3 flex items-center justify-between gap-3 sticky top-0 z-20">
          <button
            onClick={() => setDrawerAbierto(true)}
            className="lg:hidden text-slate-300 p-2"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="lg:hidden flex items-center">
            <Logo size={40} />
          </div>
          <div className="flex-1" />
          <SelectorBanda />
          <CampanaNotificaciones />
        </header>

        <main className="flex-1 pb-20 lg:pb-6">
          <Outlet />
        </main>

        {/* Bottom nav móvil */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-slate-900 border-t border-slate-800 grid grid-cols-6 z-30">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2 text-[10px] ${
                  isActive ? "text-brand-orange" : "text-slate-500"
                }`
              }
            >
              <item.icono className="w-4 h-4" />
              <span>{item.label.split(" ")[0]}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <BotonAccesibilidad />
    </div>
  );
}
