/**
 * Extrae el mensaje que devuelve la API sin obligar a cada pantalla a recorrer
 * la cadena `error.response.data.detail`.
 */
export const mensajeError = (error, respaldo = "Ocurrió un error inesperado") =>
  error?.response?.data?.detail || respaldo;
