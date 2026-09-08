/** Única definición de qué significa "cerrar sesión" en el navegador. */
export const CLAVES_SESION = [
  "access_token",
  "refresh_token",
  "usuario",
  "banda_activa_id",
];

export const limpiarSesion = () => {
  CLAVES_SESION.forEach((clave) => localStorage.removeItem(clave));
};
