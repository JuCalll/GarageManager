import api from "./axios";

export const crearEvento = (payload) =>
  api.post("/eventos/", payload).then((r) => r.data);

export const listarEventosBanda = (bandaId) =>
  api.get(`/eventos/banda/${bandaId}`).then((r) => r.data);

export const actualizarEvento = (eventoId, payload) =>
  api.put(`/eventos/${eventoId}`, payload).then((r) => r.data);

export const eliminarEvento = (eventoId) =>
  api.delete(`/eventos/${eventoId}`).then((r) => r.data);
