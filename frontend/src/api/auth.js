import api from "./axios";
import { limpiarSesion } from "../utils/sesion";

export const registrarUsuario = (payload) =>
  api.post("/auth/registro", payload).then((r) => r.data);

export const loginUsuario = (payload) =>
  api.post("/auth/login", payload).then((r) => r.data);

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

export const cerrarSesion = limpiarSesion;
