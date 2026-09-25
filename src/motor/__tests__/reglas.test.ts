import type { ConfigPais, EntradaMotor, Preferencias, Recompensa, Tarjeta } from '../../tipos/tipos';
import { aFecha, ajustar, diaSemana, fechaLimite, numeroDe, proximoCorte } from '../fechas';
import { valorRecompensa } from '../recompensas';
import { redondear2 } from '../redondeo';
import { ordenarRanking } from '../orden';
import { calcularRanking, ErrorModoNoDisponible } from '../ranking';

const sinFeriados = new Set<string>();
const corte = (hoy: string, diaCorte: number, compraEnDiaDeCorte: Tarjeta['compraEnDiaDeCorte'] = 'entra_en_siguiente') =>
  aFecha(proximoCorte(numeroDe(hoy), { diaCorte, compraEnDiaDeCorte }));

describe('fechas (criterio 14.1: meses de 28 a 31 días)', () => {
  test.each([
    ['2027-02-10', 31, '2027-02-28'], // febrero de 28
    ['2028-02-10', 31, '2028-02-29'], // febrero bisiesto
    ['2028-02-10', 30, '2028-02-29'],
    ['2026-04-10', 31, '2026-04-30'], // mes de 30
    ['2026-01-10', 31, '2026-01-31'], // mes de 31
    ['2026-12-20', 15, '2027-01-15'], // cambio de año
    ['2026-03-31', 31, '2026-04-30'], // hoy es el corte y entra en el siguiente
  ])('hoy %s con corte %i: próximo corte %s', (hoy, diaCorte, esperado) => {
    expect(corte(hoy, diaCorte)).toBe(esperado);
  });

  test('el corte del día 31 vuelve al 31 en el mes siguiente si existe', () => {
    expect(corte('2026-04-30', 31)).toBe('2026-05-31');
  });

  test('"día del mes" usa la primera fecha con ese día posterior al corte, también al cambiar de año', () => {
    const limite = (c: string, dia: number) =>
      aFecha(fechaLimite(numeroDe(c), { tipo: 'dia_del_mes', dia }, 'ninguno', sinFeriados));
    expect(limite('2027-01-15', 5)).toBe('2027-02-05');
    expect(limite('2026-12-20', 10)).toBe('2027-01-10');
    expect(limite('2027-01-31', 30)).toBe('2027-02-28');
  });

  test('"días después del corte" cruza meses y años', () => {
    const limite = aFecha(fechaLimite(numeroDe('2026-12-20'), { tipo: 'dias_despues_corte', dias: 20 }, 'ninguno', sinFeriados));
    expect(limite).toBe('2027-01-09');
  });

  test('el día de la semana es correcto', () => {
    expect(diaSemana(numeroDe('2026-09-25'))).toBe(5); // viernes
    expect(diaSemana(numeroDe('2026-09-27'))).toBe(0); // domingo
  });

  test('un feriado junto a un fin de semana salta todos los días no hábiles', () => {
    const navidad = new Set(['2026-12-25']); // viernes
    expect(aFecha(ajustar(numeroDe('2026-12-25'), 'atrasar', navidad))).toBe('2026-12-28');
    expect(aFecha(ajustar(numeroDe('2026-12-26'), 'adelantar', navidad))).toBe('2026-12-24');
    expect(aFecha(ajustar(numeroDe('2026-12-26'), 'ninguno', navidad))).toBe('2026-12-26');
  });
});

describe('recompensas (criterio 14.1: valor por cada 1,000)', () => {
  const puntos = (regla: Extract<Recompensa, { tipo: 'puntos' }>['regla'], valorPunto = 1): Recompensa => ({
    tipo: 'puntos',
    regla,
    valorPunto,
    valorPuntoConfirmado: false,
  });

  test('"1 punto por cada 100" vale 10 por cada 1,000 con el punto a 1.00', () => {
    expect(valorRecompensa(puntos({ tipo: 'por_monto', puntos: 1, porCadaMonto: 100 }), 1000, false)).toEqual({ puntos: 10, cashback: 0 });
  });

  test('"2% en puntos" vale 20 por cada 1,000 con el punto a 1.00', () => {
    expect(valorRecompensa(puntos({ tipo: 'por_porcentaje', porcentaje: 2 }), 1000, false)).toEqual({ puntos: 20, cashback: 0 });
  });

  test('el valor del punto multiplica el resultado', () => {
    expect(valorRecompensa(puntos({ tipo: 'por_monto', puntos: 1, porCadaMonto: 100 }, 0.5), 1000, false).puntos).toBe(5);
  });

  test('los puntos por transacción solo cuentan en "Tengo una compra"', () => {
    const recompensa = puntos({ tipo: 'por_transaccion', puntos: 10 }, 0.5);
    expect(valorRecompensa(recompensa, 1000, false).puntos).toBe(0);
    expect(valorRecompensa(recompensa, 1000, true).puntos).toBe(5);
  });

  test('cashback y sin recompensa', () => {
    expect(valorRecompensa({ tipo: 'cashback', porcentaje: 1.5 }, 1000, false)).toEqual({ puntos: 0, cashback: 15 });
    expect(valorRecompensa({ tipo: 'ninguna' }, 1000, false)).toEqual({ puntos: 0, cashback: 0 });
  });
});

describe('redondeo igual a round(x, 2) de Python', () => {
  test.each([
    [0.125, 0.12],
    [0.375, 0.38],
    [2.5 / 8 + 1, 1.31], // 1.3125 no es empate a 2 decimales
    [2.675, 2.67], // en binario está por debajo de 2.675
    [1.005, 1],
    [-0.125, -0.12],
    [83.555, 83.56],
    [66.8, 66.8],
  ])('%d → %d', (x, esperado) => {
    expect(redondear2(x)).toBe(esperado);
  });

  test('conserva el -0 como Python', () => {
    expect(Object.is(redondear2(-0.001), -0)).toBe(true);
  });
});

// Entrada mínima para probar el ranking completo.
function tarjeta(id: string, diaCorte: number, dia: number, recompensa: Recompensa): Tarjeta {
  return {
    id,
    alias: id,
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
  };
}

const preferencias: Preferencias = {
  pais: 'DO',
  idioma: 'es-DO',
  enfoque: { modo: 'equilibrado' },
  pagoBalanceUsd: null,
  diferencialCambiarioPct: 6,
  umbralCorteCercanoDias: 3,
  analiticaActiva: true,
  plan: 'gratis',
};

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

function entrada(tarjetas: Tarjeta[], cambios: Partial<EntradaMotor> = {}): EntradaMotor {
  return { hoy: '2026-10-06', tarjetas, ingresos: [], preferencias, pais, ...cambios };
}

describe('ranking', () => {
  const conPuntos = tarjeta('P', 5, 25, { tipo: 'puntos', regla: { tipo: 'por_porcentaje', porcentaje: 2 }, valorPunto: 1, valorPuntoConfirmado: true });
  const sinRecompensa = tarjeta('N', 20, 10, { tipo: 'ninguna' });

  test('una tarjeta sin recompensa aparece y se puntúa solo por días (criterio 14.1)', () => {
    const { ranking } = calcularRanking(entrada([conPuntos, sinRecompensa]));
    const n = ranking.find(r => r.tarjetaId === 'N')!;
    expect(n).toBeDefined();
    expect(n.valorRecompensa).toBe(0);
    expect(n.normalizado.puntos).toBe(0);
    // Equilibrado sin cashback: días 40/70 del peso y puntos 30/70.
    expect(n.puntaje).toBe(redondear2(((40 * 100) / 70 / 100) * n.normalizado.dias));
  });

  test('una tarjeta en pausa no aparece en el ranking (criterio 14.1)', () => {
    const resultado = calcularRanking(entrada([conPuntos, { ...sinRecompensa, enPausa: true }]));
    expect(resultado.ranking.map(r => r.tarjetaId)).toEqual(['P']);
    expect(resultado.excluidas).toEqual([{ tarjetaId: 'N', motivo: 'en_pausa' }]);
  });

  test('sin tarjetas devuelve un ranking vacío', () => {
    expect(calcularRanking(entrada([])).ranking).toEqual([]);
  });

  test('los modos de v2 no están disponibles en el MVP (decisión D7)', () => {
    for (const modo of ['reducir_deuda', 'personalizado'] as const) {
      expect(() => calcularRanking(entrada([conPuntos], { preferencias: { ...preferencias, enfoque: { modo } } }))).toThrow(
        ErrorModoNoDisponible,
      );
    }
  });

  test('un país sin moneda secundaria trata toda compra como compra local', () => {
    const soloLocal = { ...conPuntos, monedaFacturacion: 'solo_local' as const };
    const resultado = calcularRanking(
      entrada([soloLocal], { pais: { ...pais, monedaSecundaria: null }, compra: { monto: 100, moneda: 'USD' } }),
    );
    expect(resultado.excluidas).toEqual([]);
  });
});

describe('barra de orden (criterio 14.1)', () => {
  const tarjetas = [
    tarjeta('A', 5, 25, { tipo: 'puntos', regla: { tipo: 'por_monto', puntos: 1, porCadaMonto: 100 }, valorPunto: 0.5, valorPuntoConfirmado: true }),
    tarjeta('B', 20, 10, { tipo: 'puntos', regla: { tipo: 'por_porcentaje', porcentaje: 2 }, valorPunto: 1, valorPuntoConfirmado: true }),
    tarjeta('C', 1, 21, { tipo: 'cashback', porcentaje: 1 }),
  ];
  const { ranking } = calcularRanking(entrada(tarjetas));
  const ids = (lista: typeof ranking) => lista.map(r => r.tarjetaId);

  test('Recomendado conserva el orden por puntaje', () => {
    expect(ids(ordenarRanking(ranking, 'recomendado'))).toEqual(['C', 'B', 'A']);
  });

  test('Más días ordena por días de gracia', () => {
    expect(ids(ordenarRanking(ranking, 'mas_dias'))).toEqual(['A', 'C', 'B']); // 50, 46 y 35 días
  });

  test('Más puntos ordena por valor en puntos y deja al final las que no tienen', () => {
    expect(ids(ordenarRanking(ranking, 'mas_puntos'))).toEqual(['B', 'A', 'C']);
  });

  test('Más cashback ordena por cashback; en empate mantiene el orden recomendado', () => {
    expect(ids(ordenarRanking(ranking, 'mas_cashback'))).toEqual(['C', 'B', 'A']);
  });

  test('reordenar no modifica el ranking original', () => {
    ordenarRanking(ranking, 'mas_dias');
    expect(ids(ranking)).toEqual(['C', 'B', 'A']);
  });
});
