import type { FechaISO, FuenteIngreso } from '../tipos/tipos';
import { ajustar, aFecha, diaSemana, enMes, leer } from './fechas';

// Fechas de cobro entre dos días, ambos incluidos, ya ajustadas por día no hábil.
// Igual que la referencia, calcula semanal, quincenal en días fijos y mensual en día
// fijo; las demás frecuencias llegan en la etapa 5 (decisión D6 de docs/progreso.md).
export function fechasDeCobro(
  ingresos: FuenteIngreso[],
  desde: number,
  hasta: number,
  feriados: ReadonlySet<FechaISO>,
): Set<number> {
  const cobros = new Set<number>();
  for (let d = desde; d <= hasta; d++) {
    const { anio, mes } = leer(aFecha(d));
    for (const ingreso of ingresos) {
      const f = ingreso.frecuencia;
      let cobra = false;
      if (f.tipo === 'quincenal_dias_fijos') cobra = f.dias.some(dia => d === enMes(anio, mes, dia));
      else if (f.tipo === 'mensual' && typeof f.dia === 'number') cobra = d === enMes(anio, mes, f.dia);
      else if (f.tipo === 'semanal') cobra = diaSemana(d) === f.diaSemana;
      if (cobra) cobros.add(ajustar(d, ingreso.ajusteDiaNoHabil ?? 'ninguno', feriados));
    }
  }
  return cobros;
}
