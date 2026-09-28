import type { Tarjeta } from '../../tipos/tipos';
import { iniciarI18n } from '../../i18n/i18n';
import type { Traducir } from '../../inicio/vista';
import type { ConsejoFechas } from '../fechas';
import { textosConsejo } from '../textos';

// Decisiones D73 y D75: el problema con las fechas del usuario y qué hacer, breve y sin días de
// corte exactos.
const t = iniciarI18n('es-DO').t as unknown as Traducir;
const tarjetas = [
  { id: 'SC', alias: 'Visa Santa Cruz' },
  { id: 'B', alias: 'Mastercard BHD' },
] as Tarjeta[];
const base: ConsejoFechas = {
  tipo: 'pagoLejosDelCobro',
  tarjetaId: 'SC',
  huella: 'x',
  diaPago: 19,
  diaCobro: 22,
  diasDesdeCobro: 28,
  cobroJusto: false,
  enDolares: false,
  cobroEstimado: false,
  separaCortes: false,
  cortes: [8, 23],
  peorDia: 36,
  conCobros: true,
  otrasPendientes: 0,
};
const textos = (c: Partial<ConsejoFechas>) => textosConsejo({ ...base, ...c }, tarjetas, t);

test('pago lejos del cobro: qué pasa, qué hacer y qué hacer mientras tanto, en pocas palabras', () => {
  expect(textos({})).toEqual({
    titulo: 'Pagas tu Visa Santa Cruz antes de cobrar',
    problema: 'Vence alrededor del 19 y cobras el 22: tienes que guardar el dinero 28 días para pagarla.',
    solucion: 'Llama a tu banco y pide que la fecha de pago quede unos días después del 22.',
    mientras: 'Aparta el dinero apenas cobres.',
  });
});

test('ningún consejo da un día de corte para pedir ni pasa de unas pocas frases', () => {
  for (const c of [textos({}), textos({ separaCortes: true }), textos({ tipo: 'cortesJuntos', tarjetaId: 'B', cortes: [5, 8], peorDia: 22 })]) {
    const todo = [c.titulo, c.problema, c.solucion, c.mientras ?? ''].join(' ');
    expect(todo).not.toMatch(/corte (sea|entre|el día)|entre el \d+ y el \d+/);
    expect(todo.length).toBeLessThan(330);
  }
});

test('en dólares y cuando también separa los cortes', () => {
  expect(textos({ enDolares: true }).problema).toBe('El balance en dólares vence alrededor del 19 y cobras el 22: tienes que guardar el dinero 28 días para pagarlo.');
  expect(textos({ separaCortes: true }).solucion).toMatch(/Así también tendrás más días para pagar con tus otras tarjetas\.$/);
});

test('cobro el mismo día del pago: el riesgo es que se atrase, no estirar el dinero (D76)', () => {
  expect(textos({ diaPago: 22, diaCobro: 22, diasDesdeCobro: 30, cobroJusto: true })).toEqual({
    titulo: 'Tu Visa Santa Cruz vence justo cuando cobras',
    problema: 'Vence alrededor del 22 y cobras el 22: si el cobro se atrasa o pagas desde otro banco, el pago puede llegar tarde.',
    solucion: 'Llama a tu banco y pide que la fecha de pago quede unos días después del 22.',
    mientras: 'Paga apenas te llegue el cobro, sin dejarlo para el último momento.',
  });
});

test('cobro el mismo día y balance en dólares: dice que es el de dólares', () => {
  expect(textos({ diaPago: 22, diaCobro: 22, cobroJusto: true, enDolares: true }).problema).toMatch(/^El balance en dólares vence alrededor del 22 y cobras el 22: si el cobro se atrasa/);
});

test('sin el día del cobro siguiente, sin fechas', () => {
  expect(textos({ diaCobro: 0 })).toMatchObject({
    problema: 'Vence lejos de tu último cobro: tienes que guardar el dinero 28 días para pagarla.',
    solucion: 'Llama a tu banco y pide que la fecha de pago quede unos días después de uno de tus cobros.',
  });
});

test('cortes juntos: con los cortes de hoy y el peor día; recuerda el cobro solo si hay cobros', () => {
  const x = textos({ tipo: 'cortesJuntos', tarjetaId: 'B', cortes: [5, 8], peorDia: 22 });
  expect(x).toEqual({
    titulo: 'Tus tarjetas cortan muy cerca',
    problema: 'Cortan los días 5 y 8, así que hay días del mes en que ninguna te da más de 22 días para pagar.',
    solucion: 'Llama al banco de una de tus tarjetas, la que te sea más fácil, y pide mover su fecha de corte unas dos semanas. Que el pago quede unos días después de un cobro.',
    mientras: null,
  });
  expect(textos({ tipo: 'cortesJuntos', tarjetaId: 'B', cortes: [5, 8, 8], conCobros: false }).solucion).not.toMatch(/cobro/);
  expect(textos({ tipo: 'cortesJuntos', cortes: [3, 5, 7] }).problema).toMatch(/^Cortan los días 3, 5 y 7,/);
  expect(textos({ tipo: 'cortesJuntos', cortes: [8, 8], peorDia: 26 }).problema).toBe('Cortan el mismo día, el 8, así que hay días del mes en que ninguna te da más de 26 días para pagar.');
});
