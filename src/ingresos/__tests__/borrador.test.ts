import { iniciarI18n } from '../../i18n/i18n';
import pais from '../../paises/do.json';
import type { ConfigPais } from '../../tipos/tipos';
import { aIngreso, borradorDesde, borradorNuevo, elegirTipo, proximosCobros, resumenFrecuencia, tocarDiaQuincena, ultimasDosVeces, type Traducir } from '../borrador';

const t = iniciarI18n('es-DO').t as unknown as Traducir;

test('la quincena viene con 15 y 30, y tocar un tercer día reemplaza el más viejo', () => {
  expect(borradorNuevo().dias).toEqual([15, 30]);
  expect(tocarDiaQuincena([15, 30], 30)).toEqual([15]);
  expect(tocarDiaQuincena([15, 30], 5)).toEqual([30, 5]);
});

test('elegir la frecuencia sugiere un nombre si el usuario no escribió uno', () => {
  const b = elegirTipo(borradorNuevo(), 'quincenal_dias_fijos', t);
  expect(b.nombre).toBe('Nómina');
  expect(elegirTipo({ ...b, nombre: 'Mi trabajo', nombreEditado: true }, 'personalizada', t).nombre).toBe('Mi trabajo');
});

test('cada 2 semanas ofrece las dos últimas veces de ese día', () => {
  // El 26 de septiembre de 2026 es sábado: los viernes anteriores son el 25 y el 18.
  expect(ultimasDosVeces(5, '2026-09-26')).toEqual(['2026-09-25', '2026-09-18']);
  expect(ultimasDosVeces(6, '2026-09-26')).toEqual(['2026-09-26', '2026-09-19']);
});

test('valida cada paso y guarda la quincena ordenada', () => {
  expect(aIngreso(borradorNuevo(), 'x')).toEqual({ ok: false, errores: ['sinTipo', 'nombreVacio'] });
  const r = aIngreso({ ...elegirTipo(borradorNuevo(), 'quincenal_dias_fijos', t), dias: [30, 15] }, 'x');
  expect(r).toEqual({ ok: true, ingreso: { id: 'x', nombre: 'Nómina', frecuencia: { tipo: 'quincenal_dias_fijos', dias: [15, 30] }, ajusteDiaNoHabil: 'adelantar' } });
});

test('rechaza un número de tarjeta como nombre', () => {
  const b = { ...elegirTipo(borradorNuevo(), 'mensual', t), nombre: '4111 1111 1111 1111' };
  expect(aIngreso(b, 'x')).toEqual({ ok: false, errores: ['numeroDeTarjeta'] });
});

test('editar parte de lo guardado', () => {
  const ingreso = { id: 'x', nombre: 'Cliente', frecuencia: { tipo: 'cada_dos_semanas' as const, diaSemana: 5, referencia: '2026-09-25' }, ajusteDiaNoHabil: 'atrasar' as const };
  expect(aIngreso(borradorDesde(ingreso), 'x')).toEqual({ ok: true, ingreso });
});

test('resumen y próximos cobros', () => {
  expect(resumenFrecuencia({ tipo: 'quincenal_dias_fijos', dias: [15, 30] }, t)).toBe('Días 15 y 30');
  expect(resumenFrecuencia({ tipo: 'semanal', diaSemana: 5 }, t)).toBe('Cada viernes');
  expect(resumenFrecuencia({ tipo: 'mensual', dia: 'ultimo_dia_habil' }, t)).toBe('Último día hábil del mes');
  expect(resumenFrecuencia({ tipo: 'personalizada', fechas: [{ fecha: '2026-10-10', estimada: true }] }, t)).toBe('1 fecha');
  const nomina = { id: 'n', nombre: 'Nómina', frecuencia: { tipo: 'quincenal_dias_fijos' as const, dias: [15, 30] as [number, number] }, ajusteDiaNoHabil: 'adelantar' as const };
  expect(proximosCobros([nomina], '2026-09-26', pais as unknown as ConfigPais)).toEqual([
    { fecha: '2026-09-30', estimada: false },
    { fecha: '2026-10-15', estimada: false },
    { fecha: '2026-10-30', estimada: false },
  ]);
});
