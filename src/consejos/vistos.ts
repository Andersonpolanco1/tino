import type { ConsejoFechas } from './fechas';

// Decisión D68: un consejo visto sigue a la vista hasta que el problema se resuelva, pero ya no
// cuenta como nuevo. Se guarda como "tipo:tarjeta:desde-hasta", sin montos ni fechas.

export function claveConsejo(c: ConsejoFechas): string {
  return `${c.tipo}:${c.tarjetaId}:${c.corteDesde}-${c.corteHasta}`;
}

// Visto si hay uno guardado del mismo tipo y tarjeta con un rango que se cruza con el de hoy: el
// rango puede moverse un día al avanzar el calendario sin ser otro consejo. Si el rango cambia
// de verdad (otra tarjeta, otro cobro), vuelve a ser nuevo.
export function esVisto(c: ConsejoFechas, vistos: readonly string[] | undefined): boolean {
  const prefijo = `${c.tipo}:${c.tarjetaId}:`;
  return (vistos ?? []).some(v => {
    if (!v.startsWith(prefijo)) return false;
    const [desde, hasta] = v.slice(prefijo.length).split('-').map(Number);
    return desde <= c.corteHasta && c.corteDesde <= hasta;
  });
}

// Marca como vistos todos los consejos de hoy. Los que ya no existen se quitan de la lista.
export function marcarVistos(consejos: readonly ConsejoFechas[]): string[] {
  return consejos.map(claveConsejo);
}
