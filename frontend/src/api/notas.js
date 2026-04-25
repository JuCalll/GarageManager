import api from "./axios";

export const crearNota = (payload) =>
  api.post("/notas/", payload).then((r) => r.data);

export const listarNotasBanda = (bandaId) =>
  api.get(`/notas/banda/${bandaId}`).then((r) => r.data);

export const actualizarNota = (notaId, payload) =>
  api.put(`/notas/${notaId}`, payload).then((r) => r.data);

export const eliminarNota = (notaId) =>
  api.delete(`/notas/${notaId}`).then((r) => r.data);
