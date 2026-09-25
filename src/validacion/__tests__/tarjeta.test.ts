import type { ConfigPais, Tarjeta } from '../../tipos/tipos';
import {
  algunTextoConNumeroDeTarjeta,
  contieneNumeroDeTarjeta,
  fechaLimiteUsdCercana,
  ultimos4Valido,
  validarTarjeta,
} from '../tarjeta';

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

const base: Tarjeta = {
  id: 't1',
  alias: 'Visa Clásica Banreservas',
  emisorId: 'banreservas',
  productoId: 'banreservas-visa-clasica',
  productoDesconocido: false,
  diaCorte: 5,
  fechaLimite: { tipo: 'dia_del_mes', dia: 25 },
  ajusteDiaNoHabil: 'ninguno',
  compraEnDiaDeCorte: 'entra_en_siguiente',
  monedaFacturacion: 'doble_balance',
  recompensa: { tipo: 'puntos', regla: { tipo: 'por_monto', puntos: 1, porCadaMonto: 100 }, valorPunto: 1, valorPuntoConfirmado: false },
  enPausa: false,
  creadaEn: '2026-09-25',
};

describe('número de tarjeta (criterio 14.1: ningún campo lo permite)', () => {
  test.each(['4111111111111111', '4111 1111 1111 1111', '4111-1111-1111-1111', 'mi visa 5500.0000.0000.0004', '1234567890123'])(
    'detecta %s',
    texto => expect(contieneNumeroDeTarjeta(texto)).toBe(true),
  );

  test.each(['Visa Gold', 'Tarjeta 4821', '123456789012', 'Corte 5 y pago 25'])('permite %s', texto => {
    expect(contieneNumeroDeTarjeta(texto)).toBe(false);
  });

  test('revisa textos anidados en objetos', () => {
    expect(algunTextoConNumeroDeTarjeta({ a: [{ b: '4111 1111 1111 1111' }] })).toBe(true);
    expect(algunTextoConNumeroDeTarjeta({ a: [{ b: 'Visa' }], n: 4111111111111111 })).toBe(false);
  });

  test('el alias con un número completo no pasa la validación', () => {
    expect(validarTarjeta({ ...base, alias: 'Visa 4111111111111111' }, pais)).toContain('numeroDeTarjeta');
  });
});

describe('últimos 4 dígitos', () => {
  test('acepta exactamente 4 números', () => {
    expect(ultimos4Valido('4821')).toBe(true);
    for (const malo of ['482', '48210', '48a1', ' 482']) expect(ultimos4Valido(malo)).toBe(false);
  });

  test('es opcional', () => {
    expect(validarTarjeta({ ...base, ultimos4: undefined }, pais)).toEqual([]);
    expect(validarTarjeta({ ...base, ultimos4: '' }, pais)).toEqual([]);
    expect(validarTarjeta({ ...base, ultimos4: '12' }, pais)).toEqual(['ultimos4Invalido']);
  });
});

describe('validarTarjeta', () => {
  test('una tarjeta completa es válida', () => {
    expect(validarTarjeta(base, pais)).toEqual([]);
  });

  test('producto "Otro" y "No sé el tipo" no bloquean el registro (criterio 14.1)', () => {
    expect(validarTarjeta({ ...base, productoId: null }, pais)).toEqual([]);
    expect(validarTarjeta({ ...base, productoId: null, productoDesconocido: true }, pais)).toEqual([]);
  });

  test('"Mi banco no está" exige el nombre escrito', () => {
    expect(validarTarjeta({ ...base, emisorId: null }, pais)).toEqual(['bancoVacio']);
    expect(validarTarjeta({ ...base, emisorId: null, emisorTextoLibre: 'Banco Nuevo' }, pais)).toEqual([]);
  });

  test('sin catálogo, el banco es opcional (criterio 18.6)', () => {
    const sinCatalogo = { ...pais, catalogoDisponible: false, funciones: { dobleBalance: false } };
    expect(validarTarjeta({ ...base, emisorId: null, productoId: null, monedaFacturacion: 'solo_principal' }, sinCatalogo)).toEqual([]);
  });

  test('el doble balance solo se permite donde el país lo activa (criterio 18.6)', () => {
    expect(validarTarjeta(base, { ...pais, funciones: { dobleBalance: false } })).toEqual(['dobleBalanceNoDisponible']);
  });

  test('alias, corte, fecha límite y recompensas fuera de rango', () => {
    expect(validarTarjeta({ ...base, alias: '  ' }, pais)).toEqual(['aliasVacio']);
    expect(validarTarjeta({ ...base, diaCorte: 32 }, pais)).toEqual(['diaCorteInvalido']);
    expect(validarTarjeta({ ...base, diaCorte: 0 }, pais)).toEqual(['diaCorteInvalido']);
    expect(validarTarjeta({ ...base, fechaLimite: { tipo: 'dia_del_mes', dia: 0 } }, pais)).toEqual(['fechaLimiteInvalida']);
    expect(validarTarjeta({ ...base, fechaLimite: { tipo: 'dias_despues_corte', dias: 0 } }, pais)).toEqual(['fechaLimiteInvalida']);
    expect(validarTarjeta({ ...base, recompensa: { tipo: 'cashback', porcentaje: 0 } }, pais)).toEqual(['recompensaInvalida']);
    expect(
      validarTarjeta({ ...base, recompensa: { tipo: 'puntos', regla: { tipo: 'por_monto', puntos: 1, porCadaMonto: 100 }, valorPunto: 0, valorPuntoConfirmado: false } }, pais),
    ).toEqual(['recompensaInvalida']);
  });
});

describe('fecha límite en dólares (sección 4.3: máximo 5 días de la principal)', () => {
  test('dentro de 5 días es válida', () => {
    expect(fechaLimiteUsdCercana(5, { tipo: 'dia_del_mes', dia: 25 }, { tipo: 'dia_del_mes', dia: 20 })).toBe(true);
    expect(fechaLimiteUsdCercana(5, { tipo: 'dias_despues_corte', dias: 20 }, { tipo: 'dias_despues_corte', dias: 25 })).toBe(true);
  });

  test('a más de 5 días no es válida', () => {
    expect(fechaLimiteUsdCercana(5, { tipo: 'dia_del_mes', dia: 25 }, { tipo: 'dia_del_mes', dia: 19 })).toBe(false);
  });

  test('compara bien reglas distintas y meses cortos', () => {
    // Corte 5 + 20 días cae el 25 en todos los meses: igual que "día 25".
    expect(fechaLimiteUsdCercana(5, { tipo: 'dia_del_mes', dia: 25 }, { tipo: 'dias_despues_corte', dias: 20 })).toBe(true);
    // Corte 31: "día 28" y "día 2" quedan lejos en meses de 31 días.
    expect(fechaLimiteUsdCercana(31, { tipo: 'dia_del_mes', dia: 28 }, { tipo: 'dia_del_mes', dia: 2 })).toBe(false);
  });

  test('en la validación completa', () => {
    expect(validarTarjeta({ ...base, fechaLimiteUsd: { tipo: 'dia_del_mes', dia: 10 } }, pais)).toEqual(['fechaLimiteUsdLejana']);
    expect(validarTarjeta({ ...base, fechaLimiteUsd: { tipo: 'dia_del_mes', dia: 23 } }, pais)).toEqual([]);
    expect(validarTarjeta({ ...base, monedaFacturacion: 'solo_principal', fechaLimiteUsd: { tipo: 'dia_del_mes', dia: 23 } }, pais)).toEqual([
      'fechaLimiteUsdSinDobleBalance',
    ]);
  });
});
