import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useBanda } from "../context/BandaContext";

export default function SelectorBanda() {
  const { bandas, bandaActiva, cambiarBanda } = useBanda();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!bandas.length) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-brand-orange" />
        <span className="font-medium truncate max-w-[150px]">
          {bandaActiva?.Nombre || "Selecciona banda"}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-30 max-h-80 overflow-y-auto">
          {bandas.map((b) => (
            <button
              key={b.Id}
              onClick={() => {
                cambiarBanda(b.Id);
                setAbierto(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-800 transition-colors ${
                b.Id === bandaActiva?.Id ? "text-brand-orange" : "text-slate-200"
              }`}
            >
              <div>
                <p className="text-sm font-medium">{b.Nombre}</p>
                <p className="text-xs text-slate-500">/{b.Url}</p>
              </div>
              {b.Id === bandaActiva?.Id && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
