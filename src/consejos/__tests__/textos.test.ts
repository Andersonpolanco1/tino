import type { Tarjeta } from '../../tipos/tipos';
import { iniciarI18n } from '../../i18n/i18n';
import type { Traducir } from '../../inicio/vista';
import type { ConsejoFechas } from '../fechas';
import { textosConsejo } from '../textos';

const t = iniciarI18n('es-DO').t as unknown as Traducir;
const tarjetas = [
  { id: 'A', alias: 'Tarjeta A' },
  { id: 'B', alias: 'Tarjeta B' },
] as Tarjeta[];
const base: ConsejoFechas = {
  tipo: 'pagoAntesDelCobro',
  tarjetaId: 'A',
  corteSugerido: 11,
  corteDesde: 11,
  corteHasta: 13,
  pagoEjemplo: '2026-10-31',
  cobroEjemplo: '2026-10-30',
  enDolares: false,
  cobroEstimado: false,
  mesesRevisados: 12,
  mesesAntes: 10,
  mesesDespues: 0,
  peorDiaAntes: 21,
  peorDiaDespues: 21,
  cortesActuales: [5],
  tambienDias: false,
  otrasConProblemaDeCobro: 0,
};
const textos = (c: Partial<ConsejoFechas>) => textosConsejo({ ...base, ...c }, tarjetas, t, 'es-DO');

test('vence antes del cobro: qué pasa, qué pedir con un ejemplo y qué hacer si el banco no puede', () => {
  const x = textos({});
  expect(x.titulo).toBe('Tu Tarjeta A vence antes de tu cobro');
  expect(x.problema).toBe('En 10 de los próximos 12 meses, el pago vence antes de que cobres. Tienes que apartar el dinero con tiempo o te arriesgas a pagar tarde.');
  expect(x.solucion).toBe('Pide que el corte sea entre el 11 y el 13. Así pagarías después de cobrar: por ejemplo, cobras el 30 de octubre y pagas el 31 de octubre.');
  expect(x.siNoPuede).toBe('Si tu banco no puede, aparta el dinero del pago en cuanto cobres el mes anterior.');
  expect(x.resumen).toBe('Pide que el corte de Tarjeta A sea entre el 11 y el 13');
  expect(x.pasos).toHaveLength(4);
});

test('vence antes del cobro en dólares y con cobros estimados', () => {
  const x = textos({ enDolares: true, cobroEstimado: true });
  expect(x.problema).toMatch(/^En 10 de los próximos 12 meses, el pago en dólares vence antes/);
  expect(x.problema).toMatch(/Como tus cobros son estimados, Tino cuenta 3 días de margen\.$/);
});

test('mismo cobro: con los dos cobros de ejemplo y, si aplica, los días que gana', () => {
  const x = textos({
    tipo: 'mismoCobro',
    tarjetaId: 'B',
    cortesActuales: [5, 8],
    cobroCargado: '2026-10-15',
    cobroLibre: '2026-10-30',
    cobroEjemplo: '2026-10-30',
    pagoEjemplo: '2026-11-08',
    tambienDias: true,
    peorDiaDespues: 35,
  });
  expect(x.titulo).toBe('Todas tus tarjetas se pagan con el mismo cobro');
  expect(x.problema).toBe(
    'Casi todos los meses, tus 2 tarjetas se pagan con el mismo cobro y otro queda libre. Por ejemplo, todas con el del 15 de octubre y ninguna con el del 30 de octubre.',
  );
  expect(x.solucion).toBe(
    'Pide que el corte de Tarjeta B sea entre el 11 y el 13: la pagarías con otro cobro, por ejemplo el del 30 de octubre, y el peso queda repartido. Además, siempre tendrías una tarjeta con al menos 35 días para pagar.',
  );
});

test('días sin tarjeta buena: con los cortes de hoy, sin repetir, y "el día" si es uno solo', () => {
  const x = textos({
    tipo: 'diasSinTarjetaBuena',
    tarjetaId: 'B',
    cortesActuales: [5, 5, 6, 12],
    corteDesde: 19,
    corteHasta: 19,
    corteSugerido: 19,
    cobroEjemplo: undefined,
    peorDiaAntes: 22,
    peorDiaDespues: 35,
  });
  expect(x.titulo).toBe('Tus tarjetas cortan muy cerca');
  expect(x.problema).toBe('Tus tarjetas cortan los días 5, 6 y 12. Por eso hay días del mes en que ninguna te da más de 22 días para pagar.');
  expect(x.solucion).toBe('Pide que el corte de Tarjeta B sea el día 19: siempre tendrías una tarjeta con al menos 35 días para pagar.');
  expect(x.siNoPuede).toBe('Si tu banco no puede, no pasa nada: Tino te sigue diciendo cada día cuál usar.');
  expect(x.pasos[1]).toBe('Pide que tu fecha de corte sea el día 19. Si no tienen ese día, pide el más cercano.');
});
