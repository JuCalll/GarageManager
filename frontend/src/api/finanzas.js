import api from "./axios";

export const crearRegistroFinanciero = (payload) =>
  api.post("/finanzas/", payload).then((r) => r.data);

export const listarFinanzasBanda = (bandaId) =>
  api.get(`/finanzas/banda/${bandaId}`).then((r) => r.data);

export const actualizarRegistroFinanciero = (registroId, payload) =>
  api.put(`/finanzas/${registroId}`, payload).then((r) => r.data);

export const eliminarRegistroFinanciero = (registroId) =>
  api.delete(`/finanzas/${registroId}`).then((r) => r.data);

export const obtenerBalanceBanda = (bandaId) =>
  api.get(`/finanzas/banda/${bandaId}/balance`).then((r) => r.data);
