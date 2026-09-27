import type { Tarjeta } from '../../tipos/tipos';
import { iniciarI18n } from '../../i18n/i18n';
import type { Traducir } from '../../inicio/vista';
import type { ConsejoFechas } from '../fechas';
import { textosConsejo } from '../textos';

const t = iniciarI18n('es-DO').t as unknown as Traducir;
const tarjeta = (id: string) => ({ id, alias: `Tarjeta ${id}` }) as Tarjeta;
const base: ConsejoFechas = {
  tipo: 'pagoAntesDelCobro',
  tarjetaId: 'A',
  corteSugerido: 11,
  corteDesde: 11,
  corteHasta: 13,
  pagoEjemplo: '2026-10-31',
  cobroEjemplo: '2026-10-30',
  antes: { peorDia: 21, mesesAntesDelCobro: 12 },
  despues: { peorDia: 21, mesesAntesDelCobro: 0 },
};

test('vence antes del cobro: con el rango y un ejemplo de cobro y pago', () => {
  const textos = textosConsejo(base, [tarjeta('A')], t, 'es-DO');
  expect(textos.titulo).toBe('Tu Tarjeta A vence antes de tu cobro');
  expect(textos.explicacion).toBe(
    'En 12 de los próximos 12 meses, el pago vence antes de que cobres. Si el corte fuera entre el 11 y el 13, pagarías después de tu cobro: por ejemplo, cobras el 30 de octubre y pagas el 31 de octubre.',
  );
  expect(textos.resumen).toBe('Pide que el corte de Tarjeta A sea entre el 11 y el 13');
  expect(textos.pasos).toHaveLength(4);
});

test('con un solo día sugerido dice "el día"', () => {
  const textos = textosConsejo({ ...base, tipo: 'cortesJuntos', conTarjetaId: 'B', corteDesde: 19, corteHasta: 19, corteSugerido: 19 }, [tarjeta('A'), tarjeta('B')], t, 'es-DO');
  expect(textos.titulo).toBe('Tarjeta A y Tarjeta B cortan casi el mismo día');
  expect(textos.pasos[1]).toBe('Pide que tu fecha de corte sea el día 19. Si no tienen ese día, pide el más cercano.');
});
