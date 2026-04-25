// CSV y PDF mediante impresión del navegador (sin dependencias extra).

const escaparCelda = (valor) => {
  if (valor === null || valor === undefined) return "";
  const str = String(valor);
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export function exportarCSV({ nombreArchivo, encabezados, filas, separador = "," }) {
  const lineas = [
    encabezados.map(escaparCelda).join(separador),
    ...filas.map((fila) => fila.map(escaparCelda).join(separador)),
  ];
  const contenido = "\uFEFF" + lineas.join("\n");
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportarPDFImpresion({ titulo, subtitulo, secciones }) {
  const ventana = window.open("", "_blank", "width=900,height=700");
  if (!ventana) {
    alert("No se pudo abrir la ventana de impresión. Habilita las ventanas emergentes.");
    return;
  }

  const renderTabla = ({ encabezados, filas }) => `
    <table>
      <thead>
        <tr>${encabezados.map((h) => `<th>${h}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${filas
          .map(
            (fila) =>
              `<tr>${fila
                .map((c) => `<td>${c === null || c === undefined ? "—" : c}</td>`)
                .join("")}</tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;

  const html = `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${titulo}</title>
        <style>
          body { font-family: -apple-system, "Segoe UI", sans-serif; padding: 32px; color: #1f2937; }
          h1 { color: #e60000; margin: 0 0 4px; font-size: 22px; }
          .subtitulo { color: #64748b; margin: 0 0 24px; font-size: 13px; }
          h2 { color: #1f2937; margin: 28px 0 8px; font-size: 16px; border-bottom: 2px solid #ff8800; padding-bottom: 4px; }
          .desc { color: #64748b; font-size: 12px; margin: 0 0 8px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 12px; }
          th { background: #f3f4f6; text-align: left; padding: 8px; border-bottom: 2px solid #e5e7eb; }
          td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) td { background: #fafafa; }
          @media print { body { padding: 12px; } }
        </style>
      </head>
      <body>
        <h1>${titulo}</h1>
        ${subtitulo ? `<p class="subtitulo">${subtitulo}</p>` : ""}
        ${secciones
          .map(
            (s) => `
          <h2>${s.titulo}</h2>
          ${s.descripcion ? `<p class="desc">${s.descripcion}</p>` : ""}
          ${renderTabla(s)}
        `
          )
          .join("")}
        <script>window.onload = () => { setTimeout(() => window.print(), 300); };</script>
      </body>
    </html>
  `;

  ventana.document.open();
  ventana.document.write(html);
  ventana.document.close();
}
