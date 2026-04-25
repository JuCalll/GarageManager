import { useEffect, useState } from "react";
import { Accessibility, X, Eye, ZoomIn, Sparkles, Underline } from "lucide-react";

const STORAGE_KEY = "a11y_prefs_v1";

const DEFAULTS = {
  textSize: "normal",
  contrast: false,
  reduceMotion: false,
  underlineLinks: false,
};

function aplicarPreferencias(prefs) {
  const html = document.documentElement;
  html.classList.remove("a11y-text-lg", "a11y-text-xl");
  if (prefs.textSize === "lg") html.classList.add("a11y-text-lg");
  if (prefs.textSize === "xl") html.classList.add("a11y-text-xl");
  html.classList.toggle("a11y-contrast", prefs.contrast);
  html.classList.toggle("a11y-reduce-motion", prefs.reduceMotion);
  html.classList.toggle("a11y-underline-links", prefs.underlineLinks);
}

export default function BotonAccesibilidad() {
  const [abierto, setAbierto] = useState(false);
  const [prefs, setPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    aplicarPreferencias(prefs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const set = (key, value) => setPrefs((p) => ({ ...p, [key]: value }));

  return (
    <>
      <button
        onClick={() => setAbierto((v) => !v)}
        className="fixed bottom-20 lg:bottom-6 right-6 z-40 bg-brand-red hover:bg-brand-coral text-white p-3 rounded-full shadow-[0_0_20px_rgba(230,0,0,0.5)] transition-colors"
        aria-label="Opciones de accesibilidad"
      >
        <Accessibility className="w-5 h-5" />
      </button>

      {abierto && (
        <div className="fixed bottom-36 lg:bottom-20 right-6 z-40 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <Accessibility className="w-4 h-4 text-brand-orange" /> Accesibilidad
            </h3>
            <button
              onClick={() => setAbierto(false)}
              className="text-slate-400 hover:text-white"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs text-slate-300 flex items-center gap-2 mb-2">
                <ZoomIn className="w-3.5 h-3.5" /> Tamaño de texto
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "normal", label: "M" },
                  { id: "lg", label: "L" },
                  { id: "xl", label: "XL" },
                ].map((op) => (
                  <button
                    key={op.id}
                    onClick={() => set("textSize", op.id)}
                    className={`py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                      prefs.textSize === op.id
                        ? "border-brand-red bg-brand-red/10 text-white"
                        : "border-slate-700 text-slate-400 hover:border-brand-orange/50"
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            <Toggle
              icono={Eye}
              label="Alto contraste"
              valor={prefs.contrast}
              onChange={(v) => set("contrast", v)}
            />
            <Toggle
              icono={Sparkles}
              label="Reducir animaciones"
              valor={prefs.reduceMotion}
              onChange={(v) => set("reduceMotion", v)}
            />
            <Toggle
              icono={Underline}
              label="Subrayar enlaces"
              valor={prefs.underlineLinks}
              onChange={(v) => set("underlineLinks", v)}
            />

            <button
              onClick={() => setPrefs(DEFAULTS)}
              className="w-full text-xs text-slate-400 hover:text-brand-orange pt-2"
            >
              Restablecer
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Toggle({ icono: Icono, label, valor, onChange }) {
  return (
    <button
      onClick={() => onChange(!valor)}
      className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-white"
    >
      <span className="flex items-center gap-2">
        <Icono className="w-3.5 h-3.5" /> {label}
      </span>
      <span
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          valor ? "bg-brand-red" : "bg-slate-700"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            valor ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}
