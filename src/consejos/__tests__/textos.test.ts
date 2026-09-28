import type { Tarjeta } from '../../tipos/tipos';
import { iniciarI18n } from '../../i18n/i18n';
import type { Traducir } from '../../inicio/vista';
import type { ConsejoFechas } from '../fechas';
import { textosConsejo } from '../textos';

// Decisión D73: el problema con las fechas del usuario y la dirección del cambio, nunca un día
// de corte exacto.
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
  enDolares: false,
  cobroEstimado: false,
  separaCortes: false,
  cortes: [8, 23],
  peorDia: 36,
  conCobros: true,
  otrasPendientes: 0,
};
const textos = (c: Partial<ConsejoFechas>) => textosConsejo({ ...base, ...c }, tarjetas, t);

test('pago lejos del cobro: el problema con sus fechas, qué pedir sin día exacto y qué hacer mientras tanto', () => {
  const x = textos({});
  expect(x.titulo).toBe('Tu Visa Santa Cruz se paga justo antes de tu cobro');
  expect(x.problema).toBe(
    'Pagas tu Visa Santa Cruz alrededor del día 19 y cobras el 22. Así, el dinero de tu cobro anterior tiene que durarte unos 28 días, y si se va en otros gastos, terminas pagando tarde.',
  );
  expect(x.solucion).toBe('Pide que tu fecha de pago caiga pocos días después de tu cobro del 22. Muchos bancos lo hacen cambiando la fecha de corte.');
  expect(x.siNoPuedeTitulo).toBe('Mientras tanto');
  expect(x.siNoPuede).toMatch(/^Paga apenas salga tu estado de cuenta/);
  expect(x.resumen).toBe('Pide que se pague después de tu cobro del 22');
  expect(x.pasos).toHaveLength(4);
  expect(x.pasos[1]).toMatch(/después de tu cobro del 22/);
  expect(x.pasos[2]).toMatch(/Casi siempre es gratis/);
});

test('ningún consejo da un día de corte para pedir', () => {
  for (const c of [textos({}), textos({ tipo: 'cortesJuntos', tarjetaId: 'B', cortes: [5, 8], peorDia: 22 })]) {
    const todo = [c.titulo, c.problema, c.solucion, c.siNoPuede, c.resumen, ...c.pasos].join(' ');
    expect(todo).not.toMatch(/corte (sea|entre|el día)|entre el \d+ y el \d+/);
  }
});

test('en dólares, con cobros estimados y cuando también separa los cortes', () => {
  expect(textos({ enDolares: true }).problema).toMatch(/^El balance en dólares de tu Visa Santa Cruz se paga alrededor del día 19/);
  expect(textos({ cobroEstimado: true }).problema).toMatch(/Tino cuenta 3 días de margen\.$/);
  expect(textos({ separaCortes: true }).solucion).toMatch(/dejarían de cortar casi juntas/);
});

test('sin el día del cobro siguiente, sin fechas', () => {
  const x = textos({ diaCobro: 0 });
  expect(x.problema).toBe('El pago de tu Visa Santa Cruz cae lejos de tu último cobro: el dinero tiene que durarte unos 28 días, y si se va en otros gastos, terminas pagando tarde.');
  expect(x.resumen).toBe('Pide que se pague pocos días después de un cobro');
});

test('cortes juntos: con los cortes de hoy y el peor día; recuerda el cobro solo si hay cobros', () => {
  const x = textos({ tipo: 'cortesJuntos', tarjetaId: 'B', cortes: [5, 8], peorDia: 22 });
  expect(x.titulo).toBe('Tus tarjetas cortan casi al mismo tiempo');
  expect(x.problema).toBe('Tus tarjetas cortan los días 5 y 8. Por eso hay días del mes en que ninguna te da más de 22 días para pagar.');
  expect(x.solucion).toMatch(/^Pide que la fecha de corte de tu Mastercard BHD quede unas dos semanas lejos/);
  expect(x.solucion).toMatch(/Cuida que su nueva fecha de pago caiga pocos días después de un cobro\.$/);
  expect(x.resumen).toBe('Pide separar el corte de tu Mastercard BHD de las demás');
  expect(textos({ tipo: 'cortesJuntos', tarjetaId: 'B', cortes: [5, 8, 8], conCobros: false }).solucion).not.toMatch(/Cuida/);
  expect(textos({ tipo: 'cortesJuntos', cortes: [3, 5, 7] }).problema).toMatch(/los días 3, 5 y 7\./);
});
