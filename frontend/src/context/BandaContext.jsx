import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { listarMisBandas } from "../api/bandas";
import { estaAutenticado } from "../api/auth";

const BandaContext = createContext(null);

export function BandaProvider({ children }) {
  const [bandas, setBandas] = useState([]);
  const [bandaActivaId, setBandaActivaId] = useState(() => {
    const id = localStorage.getItem("banda_activa_id");
    return id ? Number(id) : null;
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const recargarBandas = useCallback(async () => {
    if (!estaAutenticado()) {
      setBandas([]);
      return;
    }
    setCargando(true);
    setError("");
    try {
      const lista = await listarMisBandas();
      setBandas(lista);
      if (lista.length > 0) {
        const idGuardado = Number(localStorage.getItem("banda_activa_id"));
        const existe = lista.some((b) => b.Id === idGuardado);
        if (!existe) {
          setBandaActivaId(lista[0].Id);
          localStorage.setItem("banda_activa_id", String(lista[0].Id));
        } else {
          setBandaActivaId((prev) => (prev === idGuardado ? prev : idGuardado));
        }
      } else {
        setBandaActivaId(null);
        localStorage.removeItem("banda_activa_id");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudieron cargar las bandas");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargarBandas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cambiarBanda = useCallback((id) => {
    setBandaActivaId(id);
    localStorage.setItem("banda_activa_id", String(id));
  }, []);

  const bandaActiva = bandas.find((b) => b.Id === bandaActivaId) || null;

  return (
    <BandaContext.Provider
      value={{
        bandas,
        bandaActiva,
        bandaActivaId,
        cambiarBanda,
        recargarBandas,
        cargando,
        error,
      }}
    >
      {children}
    </BandaContext.Provider>
  );
}

export const useBanda = () => {
  const ctx = useContext(BandaContext);
  if (!ctx) throw new Error("useBanda debe usarse dentro de BandaProvider");
  return ctx;
};
