import api from "./axios";

export const registrarUsuario = (payload) =>
  api.post("/auth/registro", payload).then((r) => r.data);

export const loginUsuario = (payload) =>
  api.post("/auth/login", payload).then((r) => r.data);

export const obtenerUsuarioActual = () =>
  api.get("/auth/me").then((r) => r.data);

export const guardarSesion = ({ access_token, refresh_token, usuario }) => {
  localStorage.setItem("access_token", access_token);
  if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
  if (usuario) localStorage.setItem("usuario", JSON.stringify(usuario));
};

export const obtenerUsuarioLocal = () => {
  try {
    const raw = localStorage.getItem("usuario");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const estaAutenticado = () => Boolean(localStorage.getItem("access_token"));

export const cerrarSesion = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("usuario");
  localStorage.removeItem("banda_activa_id");
};
