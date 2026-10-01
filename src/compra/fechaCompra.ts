import type { FechaISO } from '../tipos/tipos';
import { aFecha, enMes, leer, mesSiguiente } from '../motor/fechas';

// Decisión D96: "Tengo una compra" permite elegir el día de la compra desde hoy hasta el mismo
// día del mes siguiente (el 31 de enero llega al último de febrero, como el corte).
export function limiteFechaCompra(hoy: FechaISO): FechaISO {
  const { anio, mes, dia } = leer(hoy);
  const [a, m] = mesSiguiente(anio, mes);
  return aFecha(enMes(a, m, dia));
}

// La fecha elegida si sigue dentro del rango; si no (pasó la medianoche, o llegó de fuera),
// hoy. Las cadenas "AAAA-MM-DD" se comparan bien como texto.
export function fechaCompraValida(elegida: FechaISO | null | undefined, hoy: FechaISO): FechaISO {
  if (!elegida || !/^\d{4}-\d{2}-\d{2}$/.test(elegida)) return hoy;
  return elegida > hoy && elegida <= limiteFechaCompra(hoy) ? elegida : hoy;
}

// El selector nativo trabaja con Date a medianoche local; el modelo, con "AAAA-MM-DD".
export function aDateLocal(fecha: FechaISO): Date {
  const { anio, mes, dia } = leer(fecha);
  return new Date(anio, mes - 1, dia);
}

export function deDateLocal(fecha: Date): FechaISO {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}
