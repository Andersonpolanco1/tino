import type { ConfigPais, FuenteIngreso, ModoEnfoque, Tarjeta } from '../../tipos/tipos';
import pais from '../../paises/do.json';
import { cobrosRegulares, consejosDeFechas, distanciaCircular } from '../fechas';

// Decisión D73: las reglas, caso por caso. Los 172 escenarios de la vida real están en
// escenarios.test.ts. Hoy fijo: el martes 6 de octubre de 2026, como en las pruebas de Inicio.
const hoy = '2026-10-06';
const config = pais as ConfigPais;

function tarjeta(id: string, diaCorte: number, dias: number, extra: Partial<Tarjeta> = {}): Tarjeta {
  return {
    id,
    alias: `Tarjeta ${id}`,
    emisorId: null,
    productoId: null,
    productoDesconocido: false,
    diaCorte,
    fechaLimite: { tipo: 'dias_despues_corte', dias },
    ajusteDiaNoHabil: 'ninguno',
    compraEnDiaDeCorte: 'entra_en_siguiente',
    monedaFacturacion: 'solo_principal',
    recompensa: { tipo: 'ninguna' },
    enPausa: false,
    creadaEn: '2026-09-01',
    ...extra,
  };
}

const fuente = (id: string, frecuencia: FuenteIngreso['frecuencia']): FuenteIngreso => ({ id, nombre: id, frecuencia, ajusteDiaNoHabil: 'ninguno' });
const mensual = (dia: number) => fuente(`m${dia}`, { tipo: 'mensual', dia });
const quincenal = fuente('q', { tipo: 'quincenal_dias_fijos', dias: [15, 30] });
const uber = fuente('uber', { tipo: 'semanal', diaSemana: 2 });
// Cobros estimados cada mes el día dado, o con días que varían.
const estimados = (dias: number[]) =>
  fuente('p', {
    tipo: 'personalizada',
    fechas: dias.map((dia, i) => ({ fecha: new Date(Date.UTC(2026, 9 + i, dia)).toISOString().slice(0, 10), estimada: true })),
  });

const consejos = (tarjetas: Tarjeta[], ingresos: FuenteIngreso[] = [], enfoque: ModoEnfoque = 'equilibrado') =>
  consejosDeFechas({ hoy, tarjetas, ingresos, pais: config, enfoque });

test('la distancia entre días del mes da la vuelta', () => {
  expect(distanciaCircular(5, 6)).toBe(1);
  expect(distanciaCircular(29, 2)).toBe(3);
  expect(distanciaCircular(5, 20)).toBe(15);
});

describe('pago lejos del cobro', () => {
  test('el caso del usuario: cobra el 22 y paga el ~19; cuenta el cobro anterior al corte', () => {
    const [c, ...resto] = consejos([tarjeta('SC', 23, 27)], [mensual(22)]);
    expect(resto).toEqual([]);
    expect(c).toMatchObject({ tipo: 'pagoLejosDelCobro', tarjetaId: 'SC', diaCobro: 22, diasDesdeCobro: 28, enDolares: false, cobroJusto: false });
    expect([17, 18, 19, 20, 21, 22]).toContain(c.diaPago);
  });

  test('cobra el 30 y paga el ~20: el cobro dura unas 3 semanas, sin consejo', () => {
    expect(consejos([tarjeta('SC', 23, 27)], [mensual(30)])).toEqual([]);
  });

  test('un cobro el mismo día o el día antes del pago no alcanza (2 días de margen)', () => {
    // Corta el 8 y paga el 30, el mismo día del cobro: se paga con el del mes anterior.
    expect(consejos([tarjeta('BR', 8, 22)], [mensual(30)])[0]).toMatchObject({ tipo: 'pagoLejosDelCobro', tarjetaId: 'BR', cobroJusto: true, diaCobro: 30 });
    // El caso del usuario con la fecha movida: paga el 22, el mismo día que cobra.
    expect(consejos([tarjeta('SC', 26, 27)], [mensual(22)])[0]).toMatchObject({ tarjetaId: 'SC', cobroJusto: true, diaCobro: 22 });
  });

  test('con cobros semanales, cada 2 semanas o quincenales nunca queda lejos', () => {
    for (const cobros of [[uber], [quincenal], [fuente('c2s', { tipo: 'cada_dos_semanas', diaSemana: 5, referencia: '2026-09-18' })]]) {
      expect(consejos([tarjeta('A', 5, 20)], cobros)).toEqual([]);
    }
  });

  test('sin cobros registrados no habla del cobro', () => {
    expect(consejos([tarjeta('A', 5, 20)])).toEqual([]);
  });

  test('cobros de fechas variables no sirven para alinear el pago', () => {
    const variable = estimados([8, 12, 3, 15, 10, 18, 9]);
    expect(cobrosRegulares([variable])).toEqual([]);
    expect(consejos([tarjeta('A', 15, 25)], [variable])).toEqual([]);
    // Una remesa que llega casi el mismo día cada mes sí cuenta.
    const remesa = estimados([5, 6, 4, 7, 5, 5, 6]);
    expect(cobrosRegulares([remesa])).toEqual([remesa]);
  });

  test('cobros estimados: 3 días de margen y el consejo lo sabe', () => {
    const [c] = consejos([tarjeta('A', 8, 22)], [estimados([5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5])]);
    expect(c).toMatchObject({ tipo: 'pagoLejosDelCobro', cobroEstimado: true });
  });

  test('doble balance: mira el pago en dólares si vence antes', () => {
    const doble = tarjeta('D', 10, 20, { monedaFacturacion: 'doble_balance', fechaLimiteUsd: { tipo: 'dias_despues_corte', dias: 15 } });
    const [c] = consejos([doble], [mensual(30)]);
    expect(c).toMatchObject({ tipo: 'pagoLejosDelCobro', enDolares: true });
  });

  test('evitar la mora pesa más que unos días de gracia, sin amontonar los cortes', () => {
    // Tarjetas repartidas: pagar A después del cobro cuesta unos días en el peor día del año,
    // pero sigue en 20 o más, así que se aconseja.
    const [c, ...resto] = consejos([tarjeta('A', 5, 20), tarjeta('B', 20, 20)], [mensual(30)]);
    expect(resto).toEqual([]);
    expect(c).toMatchObject({ tipo: 'pagoLejosDelCobro', tarjetaId: 'A', separaCortes: false });
  });
});

describe('cortes juntos', () => {
  test('dos tarjetas que cortan casi el mismo día: conviene separar una', () => {
    const [c, ...resto] = consejos([tarjeta('A', 5, 20), tarjeta('B', 8, 20)], [quincenal]);
    expect(resto).toEqual([]);
    expect(c).toMatchObject({ tipo: 'cortesJuntos', cortes: [5, 8], conCobros: true });
    expect(c.peorDia).toBeLessThan(25);
  });

  test('con enfoque Puntos o Cashback no importa: casi siempre gana la misma tarjeta', () => {
    expect(consejos([tarjeta('A', 5, 20), tarjeta('B', 8, 20)], [quincenal], 'puntos')).toEqual([]);
    expect(consejos([tarjeta('A', 5, 20), tarjeta('B', 8, 20)], [quincenal], 'cashback')).toEqual([]);
    expect(consejos([tarjeta('A', 5, 20), tarjeta('B', 8, 20)], [quincenal], 'liquidez')).toHaveLength(1);
  });

  test('cortes que cruzan el fin de mes también están juntos (28 y 1)', () => {
    expect(consejos([tarjeta('A', 28, 20), tarjeta('B', 1, 22)])[0]).toMatchObject({ tipo: 'cortesJuntos' });
  });

  test('cortes repartidos: sin consejo', () => {
    expect(consejos([tarjeta('A', 5, 20), tarjeta('B', 20, 20)], [quincenal])).toEqual([]);
    expect(consejos([tarjeta('A', 1, 20), tarjeta('B', 8, 20), tarjeta('C', 15, 20), tarjeta('D', 22, 20)], [quincenal])).toEqual([]);
  });

  test('la tarjeta que se pide mover no cambia con el calendario: la más nueva o, en empate, siempre la misma', () => {
    const tarjetas = [tarjeta('A', 5, 20), tarjeta('B', 8, 20)];
    const elegida = (hoy: string) => consejosDeFechas({ hoy, tarjetas, ingresos: [quincenal], pais: config, enfoque: 'equilibrado' })[0].tarjetaId;
    const meses = ['2026-10-06', '2026-11-15', '2027-01-15', '2027-03-01', '2027-06-15', '2027-09-01'];
    expect(new Set(meses.map(elegida))).toEqual(new Set(['A']));
    const nueva = [tarjeta('A', 5, 20), tarjeta('B', 8, 20, { creadaEn: '2026-09-20' })];
    expect(consejos(nueva, [quincenal])[0].tarjetaId).toBe('B');
  });

  test('con cobros de fechas anotadas, solo juzga los meses que cubren', () => {
    // Sueldo el 30 y una remesa anotada hasta diciembre: después Tino no sabe si sigue llegando.
    const remesa = estimados([15, 15, 15]);
    const c = consejosDeFechas({ hoy: '2027-06-01', tarjetas: [tarjeta('A', 5, 20)], ingresos: [mensual(30), remesa], pais: config, enfoque: 'equilibrado' });
    expect(c).toEqual([]);
  });

  test('una tarjeta sola nunca tiene cortes juntos', () => {
    expect(consejos([tarjeta('A', 5, 20)])).toEqual([]);
  });
});

describe('juntos', () => {
  test('si mover la del cobro también separa los cortes, es un solo consejo', () => {
    const lista = consejos([tarjeta('A', 28, 20), tarjeta('B', 1, 22)], [mensual(30)]);
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ tipo: 'pagoLejosDelCobro', tarjetaId: 'B', separaCortes: true });
  });

  test('como máximo 2 consejos; las demás quedan para después y se cuentan', () => {
    const lista = consejos([tarjeta('A', 1, 20), tarjeta('B', 3, 20), tarjeta('C', 5, 20), tarjeta('D', 7, 20)], [mensual(30)]);
    expect(lista).toHaveLength(2);
    expect(new Set(lista.map(c => c.tarjetaId)).size).toBe(2);
    // A (paga ~21) y B (~23) también se pagan lejos del cobro del 30: quedan para después.
    expect(lista.map(c => c.otrasPendientes)).toEqual([2, 2]);
  });

  test('con 5 tarjetas o más no hay consejos de fechas', () => {
    const cinco = [1, 3, 5, 7, 9].map((d, i) => tarjeta(String(i), d, 20));
    expect(consejos(cinco, [mensual(30)])).toEqual([]);
  });

  test('la huella es estable con el calendario y cambia si cambian las fechas o los cobros', () => {
    const tarjetas = [tarjeta('SC', 23, 27)];
    const hoyC = consejos(tarjetas, [mensual(22)])[0].huella;
    const manana = consejosDeFechas({ hoy: '2026-10-20', tarjetas, ingresos: [mensual(22)], pais: config, enfoque: 'equilibrado' })[0].huella;
    expect(manana).toBe(hoyC);
    expect(consejos([tarjeta('SC', 23, 26)], [mensual(22)])[0].huella).not.toBe(hoyC);
    expect(consejos(tarjetas, [{ ...mensual(22), ajusteDiaNoHabil: 'adelantar' }])[0].huella).not.toBe(hoyC);
  });
});
