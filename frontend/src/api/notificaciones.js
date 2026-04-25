import api from "./axios";

export const listarNotificaciones = () =>
  api.get("/notificaciones/").then((r) => r.data);

export const marcarLeida = (notificacionId) =>
  api.post(`/notificaciones/${notificacionId}/leer`).then((r) => r.data);

export const marcarTodasLeidas = () =>
  api.post("/notificaciones/leer-todas").then((r) => r.data);
