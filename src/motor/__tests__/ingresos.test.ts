import type { FrecuenciaIngreso } from '../../tipos/tipos';
import { aFecha, numeroDe } from '../fechas';
import { cobrosEntre, proximoCobro } from '../ingresos';
import pais from '../../paises/do.json';

// Criterio 14.1: las 5 frecuencias generan las fechas de cobro correctas durante 12 meses,
// incluidos feriados. Fechas esperadas calculadas con motor.py y los feriados de RD de 2026.
const feriados = new Set(pais.feriados);
const anio = (frecuencia: FrecuenciaIngreso) =>
  cobrosEntre([{ id: 'i', nombre: 'Cobro', frecuencia, ajusteDiaNoHabil: 'adelantar' }], numeroDe('2026-01-01'), numeroDe('2026-12-31'), feriados).map(c =>
    aFecha(c.dia),
  );

test('semanal: los 52 viernes de 2026', () => {
  const fechas = anio({ tipo: 'semanal', diaSemana: 5 });
  expect(fechas).toHaveLength(52);
  expect(fechas.slice(0, 2)).toEqual(['2026-01-02', '2026-01-09']);
});

test('quincenal 15 y 30: febrero corto, fines de semana y el feriado del 27 de febrero', () => {
  expect(anio({ tipo: 'quincenal_dias_fijos', dias: [15, 30] })).toEqual([
    '2026-01-15', '2026-01-30', '2026-02-13', '2026-02-26', '2026-03-13', '2026-03-30', '2026-04-15', '2026-04-30',
    '2026-05-15', '2026-05-29', '2026-06-15', '2026-06-30', '2026-07-15', '2026-07-30', '2026-08-14', '2026-08-28',
    '2026-09-15', '2026-09-30', '2026-10-15', '2026-10-30', '2026-11-13', '2026-11-30', '2026-12-15', '2026-12-30',
  ]);
});

test('cada 2 semanas: 26 cobros; Viernes Santo y Navidad se adelantan', () => {
  const fechas = anio({ tipo: 'cada_dos_semanas', diaSemana: 5, referencia: '2026-01-09' });
  expect(fechas).toHaveLength(26);
  expect(fechas).toContain('2026-04-02');
  expect(fechas).toContain('2026-12-24');
});

test('mensual, último día hábil: 12 cobros', () => {
  expect(anio({ tipo: 'mensual', dia: 'ultimo_dia_habil' })).toEqual([
    '2026-01-30', '2026-02-26', '2026-03-31', '2026-04-30', '2026-05-29', '2026-06-30',
    '2026-07-31', '2026-08-31', '2026-09-30', '2026-10-30', '2026-11-30', '2026-12-31',
  ]);
});

test('mensual día 31: en meses cortos es el último día', () => {
  expect(anio({ tipo: 'mensual', dia: 31 })).toHaveLength(12);
});

test('personalizada: fechas ajustadas y marcadas como estimadas', () => {
  const frecuencia: FrecuenciaIngreso = {
    tipo: 'personalizada',
    fechas: [
      { fecha: '2026-02-27', estimada: false },
      { fecha: '2026-08-16', estimada: true },
    ],
  };
  const cobros = cobrosEntre([{ id: 'i', nombre: 'Cliente', frecuencia, ajusteDiaNoHabil: 'adelantar' }], numeroDe('2026-01-01'), numeroDe('2026-12-31'), feriados);
  expect(cobros.map(c => [aFecha(c.dia), c.estimada])).toEqual([
    ['2026-02-26', false],
    ['2026-08-14', true],
  ]);
});

test('próximo cobro desde un día, o ninguno si no hay', () => {
  const nomina = [{ id: 'n', nombre: 'Nómina', frecuencia: { tipo: 'quincenal_dias_fijos', dias: [15, 30] } as FrecuenciaIngreso, ajusteDiaNoHabil: 'adelantar' as const }];
  expect(aFecha(proximoCobro(nomina, numeroDe('2026-09-26'), feriados)!.dia)).toBe('2026-09-30');
  expect(proximoCobro([], numeroDe('2026-09-26'), feriados)).toBeNull();
});
