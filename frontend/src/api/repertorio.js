import api from "./axios";

export const listarCanciones = (bandaId) =>
  api.get(`/repertorio/bandas/${bandaId}/canciones`).then((r) => r.data);

export const crearCancion = (payload) =>
  api.post("/repertorio/canciones", payload).then((r) => r.data);

export const actualizarCancion = (cancionId, payload) =>
  api.put(`/repertorio/canciones/${cancionId}`, payload).then((r) => r.data);

export const eliminarCancion = (cancionId) =>
  api.delete(`/repertorio/canciones/${cancionId}`).then((r) => r.data);

export const listarSetlists = (bandaId) =>
  api.get(`/repertorio/bandas/${bandaId}/setlists`).then((r) => r.data);

export const obtenerSetlist = (setlistId) =>
  api.get(`/repertorio/setlists/${setlistId}`).then((r) => r.data);

export const obtenerSetlistDeEvento = (eventoId) =>
  api.get(`/repertorio/eventos/${eventoId}/setlist`).then((r) => r.data);

export const crearSetlist = (payload) =>
  api.post("/repertorio/setlists", payload).then((r) => r.data);

export const actualizarSetlist = (setlistId, payload) =>
  api.put(`/repertorio/setlists/${setlistId}`, payload).then((r) => r.data);

export const eliminarSetlist = (setlistId) =>
  api.delete(`/repertorio/setlists/${setlistId}`).then((r) => r.data);
