/**
 * Select con la etiqueta y los estilos del formulario, para no repetir el mismo
 * bloque de markup en cada campo.
 */
export default function CampoSelect({
  label,
  opciones = [],
  placeholder,
  ...props
}) {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1">{label}</label>
      <select
        {...props}
        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {opciones.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
