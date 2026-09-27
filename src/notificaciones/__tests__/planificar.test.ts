import type { ConfigPais, FuenteIngreso, Recompensa, Tarjeta } from '../../tipos/tipos';
import { iniciarI18n } from '../../i18n/i18n';
import { preferenciasIniciales } from '../../datos/preferencias';
import { calcularRanking } from '../../motor';
import type { Traducir } from '../../inicio/vista';
import { MAXIMO_AVISOS, planificarAvisos, type EntradaAvisos } from '../planificar';

// "Listo cuando: las notificaciones llegan en las fechas correctas en pruebas con fechas
// simuladas" (etapa 5). Hoy es el martes 6 de octubre de 2026, el ejemplo 7.4.
const t = iniciarI18n('es-DO').t as unknown as Traducir;
const pais: ConfigPais = {
  codigo: 'DO',
  monedaPrincipal: 'DOP',
  monedaSecundaria: 'USD',
  idiomas: ['es-DO'],
  feriados: [],
  catalogoDisponible: true,
  funciones: { dobleBalance: true },
  montoReferencia: 1000,
};

function tarjeta(id: string, diaCorte: number, dia: number, recompensa: Recompensa, extra: Partial<Tarjeta> = {}): Tarjeta {
  return {
    id,
    alias: `Tarjeta ${id}`,
    emisorId: null,
    productoId: null,
    productoDesconocido: false,
    diaCorte,
    fechaLimite: { tipo: 'dia_del_mes', dia },
    ajusteDiaNoHabil: 'ninguno',
    compraEnDiaDeCorte: 'entra_en_siguiente',
    monedaFacturacion: 'solo_principal',
    recompensa,
    enPausa: false,
    creadaEn: '2026-09-01',
    ...extra,
  };
}

const A = tarjeta('A', 5, 25, { tipo: 'puntos', regla: { tipo: 'por_monto', puntos: 1, porCadaMonto: 100 }, valorPunto: 0.5, valorPuntoConfirmado: true });
const B = tarjeta('B', 20, 10, { tipo: 'puntos', regla: { tipo: 'por_porcentaje', porcentaje: 2 }, valorPunto: 1, valorPuntoConfirmado: true });
const C = tarjeta('C', 1, 21, { tipo: 'cashback', porcentaje: 1 });
const nomina: FuenteIngreso[] = [{ id: 'n', nombre: 'Nómina', frecuencia: { tipo: 'quincenal_dias_fijos', dias: [15, 30] }, ajusteDiaNoHabil: 'adelantar' }];

function entrada(cambios: Partial<EntradaAvisos> = {}): EntradaAvisos {
  return { hoy: '2026-10-06', tarjetas: [A, B, C], ingresos: nomina, preferencias: preferenciasIniciales('DO', 'es-DO'), pais, t, idioma: 'es-DO', ...cambios };
}
const buscar = (id: string, e = entrada()) => planificarAvisos(e).find(a => a.id === id);

test('fecha límite: 3 días antes, con el día de la semana', () => {
  expect(buscar('fechaLimite:B:2026-10-10')).toEqual({
    id: 'fechaLimite:B:2026-10-10',
    tipo: 'fechaLimite',
    fecha: '2026-10-07',
    titulo: 'Tu pago vence el sábado 10',
    cuerpo: 'Tarjeta B vence el 10 de octubre. Págala completa y a tiempo para no pagar intereses.',
  });
  // Los estados siguientes dentro de los 60 días también.
  expect(buscar('fechaLimite:A:2026-11-25')?.fecha).toBe('2026-11-22');
  expect(buscar('fechaLimite:C:2026-12-21')).toBeUndefined();
});

test('con doble balance, el recordatorio menciona los dos pagos (criterio 14.1)', () => {
  const doble = tarjeta('D', 5, 25, { tipo: 'ninguna' }, { monedaFacturacion: 'doble_balance' });
  const conFechaUsd = tarjeta('E', 5, 25, { tipo: 'ninguna' }, { monedaFacturacion: 'doble_balance', fechaLimiteUsd: { tipo: 'dia_del_mes', dia: 28 } });
  const e = entrada({ tarjetas: [doble, conFechaUsd] });
  expect(buscar('fechaLimite:D:2026-10-25', e)?.cuerpo).toBe('Tarjeta D vence el 25 de octubre. Recuerda pagar los dos balances: el de pesos y el de dólares.');
  expect(buscar('fechaLimite:E:2026-10-25', e)?.cuerpo).toBe('Tarjeta E: el balance en pesos vence el 25 de octubre y el de dólares el 28 de octubre. Recuerda pagar los dos.');
});

test('vence antes del cobro: 5 días antes y con la fecha del cobro (criterio 14.1)', () => {
  expect(buscar('venceAntesDelCobro:A:2026-10-25')).toMatchObject({
    fecha: '2026-10-20',
    cuerpo: 'Tarjeta A vence el 25 de octubre y cobras el 30 de octubre. Aparta el dinero antes.',
  });
  // El 15 de noviembre es domingo: la nómina se adelanta al viernes 13, después del pago de B el 10.
  expect(buscar('venceAntesDelCobro:B:2026-11-10')?.cuerpo).toContain('cobras el 13 de noviembre');
  // Sin cobros registrados no hay este aviso.
  expect(planificarAvisos(entrada({ ingresos: [] })).some(a => a.tipo === 'venceAntesDelCobro')).toBe(false);
});

test('cambio de tarjeta: solo el día en que cambia la mejor (decisión D41)', () => {
  const cambios = planificarAvisos(entrada()).filter(a => a.tipo === 'cambioTarjeta');
  // El 20 de octubre corta B: desde ese día una compra en B entra en el estado siguiente.
  expect(cambios[0]).toMatchObject({ fecha: '2026-10-20', cuerpo: 'Desde hoy, usa Tarjeta B: te da 51 días para pagar.' });
  const e = entrada();
  for (const aviso of cambios) {
    const dia = (f: string) => calcularRanking({ hoy: f, tarjetas: e.tarjetas, ingresos: e.ingresos, preferencias: e.preferencias, pais }).ranking[0];
    const anterior = new Date(`${aviso.fecha}T00:00:00Z`);
    anterior.setUTCDate(anterior.getUTCDate() - 1);
    const antes = dia(anterior.toISOString().slice(0, 10));
    const despues = dia(aviso.fecha);
    expect(despues.tarjetaId).not.toBe(antes.tarjetaId);
    expect(aviso.cuerpo).toBe(`Desde hoy, usa Tarjeta ${despues.tarjetaId}: te da ${despues.diasGracia} días para pagar.`);
  }
  // Con una sola tarjeta no hay a qué cambiar.
  expect(planificarAvisos(entrada({ tarjetas: [A] })).some(a => a.tipo === 'cambioTarjeta')).toBe(false);
});

test('resumen mensual el día 1, sin montos (decisión D38)', () => {
  const resumen = buscar('resumenMensual:2026-10');
  expect(resumen?.fecha).toBe('2026-11-01');
  expect(resumen?.titulo).toBe('Tu resumen de octubre');
  expect(resumen?.cuerpo).toMatch(/^En octubre, la tarjeta de cada día te dio hasta \d+ días para pagar\. Tino te recomendó \d tarjetas? ?(distintas)?\.$/);
});

test('un pago marcado con "Ya pagué" ya no avisa (decisión D45)', () => {
  const e = entrada({ tarjetas: [A, { ...B, pagoHecho: '2026-10-10' }, C] });
  expect(buscar('fechaLimite:B:2026-10-10', e)).toBeUndefined();
  // El estado siguiente sí avisa.
  expect(buscar('fechaLimite:B:2026-11-10', e)).toBeDefined();
});

// Decisión D66: el día que vence y el siguiente, mientras no marque "Ya pagué".
test('día del pago y día siguiente, si no marcó "Ya pagué"', () => {
  expect(buscar('vencimiento:B:2026-10-10')).toEqual({
    id: 'vencimiento:B:2026-10-10',
    tipo: 'vencimiento',
    fecha: '2026-10-10',
    titulo: 'Hoy vence tu Tarjeta B',
    cuerpo: 'Si todavía no pagas, paga hoy el total para no pagar mora ni intereses. Si ya pagaste, márcalo en Tino.',
  });
  expect(buscar('vencido:B:2026-10-10')).toMatchObject({ fecha: '2026-10-11', titulo: 'Tu Tarjeta B venció ayer' });
  // Al abrir la app el día siguiente, el aviso de "venció ayer" se sigue programando.
  expect(buscar('vencido:B:2026-10-10', entrada({ hoy: '2026-10-11' }))?.fecha).toBe('2026-10-11');
  // Con "Ya pagué", ninguno de los dos.
  const pagada = entrada({ tarjetas: [A, { ...B, pagoHecho: '2026-10-10' }, C] });
  expect(buscar('vencimiento:B:2026-10-10', pagada)).toBeUndefined();
  expect(buscar('vencido:B:2026-10-10', pagada)).toBeUndefined();
});

test('antes del corte: con una sola tarjeta, el último día del ciclo y los días que da esperar', () => {
  expect(buscar('antesDelCorte:A:2026-11-04', entrada({ tarjetas: [A] }))).toEqual({
    id: 'antesDelCorte:A:2026-11-04',
    tipo: 'antesDelCorte',
    fecha: '2026-11-04',
    titulo: 'Mañana empieza un ciclo nuevo en tu Tarjeta A',
    cuerpo: 'Si puedes, deja las compras grandes para mañana, jueves 5: tendrás 50 días para pagarlas en vez de 21.',
  });
});

test('antes del corte: no avisa si otra tarjeta es mejor ese día', () => {
  expect(buscar('antesDelCorte:A:2026-11-04')).toBeUndefined();
  const avisos = planificarAvisos(entrada()).filter(a => a.tipo === 'antesDelCorte');
  for (const aviso of avisos) {
    const [mejor] = calcularRanking({ hoy: aviso.fecha, tarjetas: [A, B, C], ingresos: nomina, preferencias: preferenciasIniciales('DO', 'es-DO'), pais }).ranking;
    expect(aviso.id).toBe(`antesDelCorte:${mejor.tarjetaId}:${aviso.fecha}`);
  }
});

test('cada aviso se puede apagar y las tarjetas en pausa no avisan', () => {
  const preferencias = { ...preferenciasIniciales('DO', 'es-DO'), avisos: { fechaLimite: false, venceAntesDelCobro: true, cambioTarjeta: false, resumenMensual: false, vencimiento: false, antesDelCorte: false } };
  const avisos = planificarAvisos(entrada({ preferencias }));
  expect(new Set(avisos.map(a => a.tipo))).toEqual(new Set(['venceAntesDelCobro']));
  expect(planificarAvisos(entrada({ tarjetas: [{ ...B, enPausa: true }] }))).toEqual([]);
});

test('ordenados, dentro del límite y sin montos', () => {
  const avisos = planificarAvisos(entrada());
  expect(avisos.length).toBeLessThanOrEqual(MAXIMO_AVISOS);
  expect(avisos.map(a => a.fecha)).toEqual([...avisos.map(a => a.fecha)].sort());
  expect(avisos.every(a => a.fecha >= '2026-10-06')).toBe(true);
  expect(avisos.some(a => /RD\$|US\$/.test(a.titulo + a.cuerpo))).toBe(false);
});

// Decisión D59: lo que promete el muro de pago, 2 días antes del cobro de la prueba.
test('fin de la prueba de Tino Pro: 2 días antes, aunque los demás avisos estén apagados', () => {
  const apagados = { fechaLimite: false, venceAntesDelCobro: false, cambioTarjeta: false, resumenMensual: false, vencimiento: false, antesDelCorte: false };
  const pro = { ...preferenciasIniciales('DO', 'es-DO'), plan: 'pro' as const, finPruebaPro: '2026-11-05', avisos: apagados };
  expect(planificarAvisos(entrada({ preferencias: pro }))).toEqual([
    {
      id: 'finPrueba:2026-11-05',
      tipo: 'finPrueba',
      fecha: '2026-11-03',
      titulo: 'Tu prueba de Tino Pro termina pronto',
      cuerpo: 'Termina el 5 de noviembre. Si quieres seguir, no tienes que hacer nada; si no, cancélala en la tienda antes de esa fecha.',
    },
  ]);
  // Sin Pro, o si ya pasó la fecha del aviso, no hay aviso.
  expect(buscar('finPrueba:2026-11-05', entrada({ preferencias: { ...pro, plan: 'gratis' } }))).toBeUndefined();
  expect(buscar('finPrueba:2026-10-07', entrada({ preferencias: { ...pro, finPruebaPro: '2026-10-07' } }))).toBeUndefined();
});
