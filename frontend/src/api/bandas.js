import api from "./axios";

export const listarMisBandas = () => api.get("/bandas/mias").then((r) => r.data);

export const crearBanda = (payload) =>
  api.post("/bandas/", payload).then((r) => r.data);

export const actualizarBanda = (bandaId, payload) =>
  api.put(`/bandas/${bandaId}`, payload).then((r) => r.data);

export const listarMiembros = (bandaId) =>
  api.get(`/bandas/${bandaId}/miembros`).then((r) => r.data);

export const invitarMiembro = (bandaId, payload) =>
  api.post(`/bandas/${bandaId}/miembros`, payload).then((r) => r.data);

export const eliminarMiembro = (bandaId, miembroId) =>
  api.delete(`/bandas/${bandaId}/miembros/${miembroId}`).then((r) => r.data);

export const listarRedes = (bandaId) =>
  api.get(`/bandas/${bandaId}/redes`).then((r) => r.data);

export const agregarRed = (bandaId, payload) =>
  api.post(`/bandas/${bandaId}/redes`, payload).then((r) => r.data);

export const eliminarRed = (bandaId, redId) =>
  api.delete(`/bandas/${bandaId}/redes/${redId}`).then((r) => r.data);

export const obtenerPerfilPublico = (url) =>
  api.get(`/bandas/publico/${url}`).then((r) => r.data);
