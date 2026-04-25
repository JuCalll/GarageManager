import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ abierto, onCerrar, titulo, children, ancho = "max-w-lg" }) {
  useEffect(() => {
    if (!abierto) return;
    const handler = (e) => {
      if (e.key === "Escape") onCerrar?.();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/70 overflow-y-auto">
      <div
        className="absolute inset-0"
        onClick={onCerrar}
        aria-hidden="true"
      />
      <div
        className={`relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full ${ancho} my-8`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-white font-bold text-lg">{titulo}</h2>
          <button
            type="button"
            onClick={onCerrar}
            className="text-slate-400 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
