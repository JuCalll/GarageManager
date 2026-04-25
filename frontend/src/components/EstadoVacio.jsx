export default function EstadoVacio({ icono: Icono, titulo, descripcion, accion }) {
  return (
    <div className="text-center py-16 px-4 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl">
      {Icono && (
        <div className="inline-flex p-4 rounded-full bg-brand-red/10 text-brand-orange mb-4">
          <Icono className="w-8 h-8" />
        </div>
      )}
      <h3 className="text-white font-semibold text-lg">{titulo}</h3>
      {descripcion && (
        <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
          {descripcion}
        </p>
      )}
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  );
}
