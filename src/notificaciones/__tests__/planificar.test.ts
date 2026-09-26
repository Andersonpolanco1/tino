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

test('cada aviso se puede apagar y las tarjetas en pausa no avisan', () => {
  const preferencias = { ...preferenciasIniciales('DO', 'es-DO'), avisos: { fechaLimite: false, venceAntesDelCobro: true, cambioTarjeta: false, resumenMensual: false } };
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
