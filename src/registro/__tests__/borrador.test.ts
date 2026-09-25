import type { ConfigPais } from '../../tipos/tipos';
import { catalogoIncluido } from '../../catalogo/catalogo';
import { iniciarI18n } from '../../i18n/i18n';
import {
  aTarjeta,
  borradorDesde,
  borradorNuevo,
  editarAlias,
  elegirMoneda,
  elegirEmisor,
  elegirProducto,
  emisoresParaRegistro,
  escribirBanco,
  filtrar,
  productoFueraDeLista,
  tieneDolares,
  type BorradorTarjeta,
} from '../borrador';

const t = iniciarI18n('es-DO').t as unknown as (clave: string, opciones?: Record<string, string>) => string;
const catalogo = catalogoIncluido('DO')!;
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

function completo(b: BorradorTarjeta): BorradorTarjeta {
  return { ...b, diaCorte: '5', fechaLimite: { tipo: 'dia_del_mes', valor: '25' } };
}

describe('catálogo en el registro', () => {
  test('ofrece solo bancos confirmados, los más grandes primero', () => {
    const emisores = emisoresParaRegistro(catalogo);
    expect(emisores.every(e => e.emiteTarjetas === 'confirmado')).toBe(true);
    expect(emisores[0].id).toBe('banreservas');
  });

  test('busca sin distinguir acentos ni mayúsculas', () => {
    const encontrados = filtrar(emisoresParaRegistro(catalogo), 'asociacion cibao', e => [e.nombreCorto, e.nombreLegal]);
    expect(encontrados.map(e => e.id)).toEqual(['asociacion-cibao']);
  });
});

describe('precarga y alias', () => {
  test('elegir banco y producto sugiere el alias y precarga la moneda del catálogo', () => {
    let b = elegirEmisor(borradorNuevo(), 'bhd', t, catalogo);
    expect(b.alias).toBe('Tarjeta BHD');
    b = elegirProducto(b, 'bhd-visa-clasica', t, catalogo);
    expect(b.alias).toBe('Visa Clásica BHD');
    expect(b.monedaFacturacion).toBe('doble_balance');
  });

  test('sin moneda en el catálogo, queda por elegir', () => {
    const b = elegirProducto(elegirEmisor(borradorNuevo(), 'banreservas', t, catalogo), 'banreservas-visa-clasica', t, catalogo);
    expect(b.monedaFacturacion).toBeNull();
  });

  test('un alias escrito por el usuario no se reemplaza', () => {
    let b = editarAlias(elegirEmisor(borradorNuevo(), 'bhd', t, catalogo), 'Mi Visa');
    b = elegirProducto(b, 'bhd-visa-clasica', t, catalogo);
    expect(b.alias).toBe('Mi Visa');
  });

  test('la moneda del catálogo se reemplaza al cambiar de producto; la elegida por el usuario se respeta', () => {
    let b = elegirProducto(elegirEmisor(borradorNuevo(), 'bhd', t, catalogo), 'bhd-visa-clasica', t, catalogo);
    b = elegirProducto(b, 'bhd-visa-clasica-pesos', t, catalogo);
    expect(b.monedaFacturacion).toBe('solo_principal');
    b = productoFueraDeLista(b, false, t, catalogo);
    expect(b.monedaFacturacion).toBeNull();
    b = productoFueraDeLista(elegirMoneda(b, 'doble_balance'), true, t, catalogo);
    expect(b.monedaFacturacion).toBe('doble_balance');
  });

  test('cambiar de banco borra el producto elegido', () => {
    let b = elegirProducto(elegirEmisor(borradorNuevo(), 'bhd', t, catalogo), 'bhd-visa-clasica', t, catalogo);
    b = elegirEmisor(b, 'banreservas', t, catalogo);
    expect(b.productoId).toBeNull();
    expect(b.monedaFacturacion).toBeNull();
    expect(b.alias).toBe('Tarjeta Banreservas');
  });

  test('"Mi banco no está" usa el nombre escrito', () => {
    const b = escribirBanco(borradorNuevo(), 'Banco Nuevo', t, catalogo);
    expect(b.alias).toBe('Tarjeta Banco Nuevo');
  });
});

describe('aTarjeta', () => {
  const base = () => ({ ...completo(elegirEmisor(borradorNuevo(), 'banreservas', t, catalogo)), monedaFacturacion: 'solo_principal' as const });

  test('con banco, producto "Otro", corte y fecha límite ya se puede guardar (criterio 14.1)', () => {
    const r = aTarjeta(productoFueraDeLista(base(), false, t, catalogo), pais, 'id1', '2026-09-25');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.tarjeta).toMatchObject({
        id: 'id1',
        alias: 'Tarjeta Banreservas',
        emisorId: 'banreservas',
        productoId: null,
        productoDesconocido: false,
        diaCorte: 5,
        fechaLimite: { tipo: 'dia_del_mes', dia: 25 },
        ajusteDiaNoHabil: 'adelantar',
        compraEnDiaDeCorte: 'entra_en_corte_actual',
        recompensa: { tipo: 'ninguna' },
        enPausa: false,
        creadaEn: '2026-09-25',
      });
    }
  });

  test('"No sé el tipo" también se guarda (criterio 14.1)', () => {
    const r = aTarjeta(productoFueraDeLista(base(), true, t, catalogo), pais, 'id1', '2026-09-25');
    expect(r.ok && r.tarjeta.productoDesconocido).toBe(true);
  });

  test('sin moneda de facturación pide elegirla', () => {
    expect(aTarjeta({ ...base(), monedaFacturacion: null }, pais, 'id1', '2026-09-25')).toEqual({ ok: false, errores: ['monedaVacia'] });
  });

  test('convierte recompensas, aceptando coma decimal', () => {
    const b = { ...base(), recompensa: { ...base().recompensa, tipo: 'cashback' as const, porcentajeCashback: '1,5' } };
    const r = aTarjeta(b, pais, 'id1', '2026-09-25');
    expect(r.ok && r.tarjeta.recompensa).toEqual({ tipo: 'cashback', porcentaje: 1.5 });

    const puntos = { ...base(), recompensa: { ...base().recompensa, tipo: 'puntos' as const, regla: 'por_porcentaje' as const, porcentajePuntos: '2' } };
    const rp = aTarjeta(puntos, pais, 'id1', '2026-09-25');
    expect(rp.ok && rp.tarjeta.recompensa).toEqual({ tipo: 'puntos', regla: { tipo: 'por_porcentaje', porcentaje: 2 }, valorPunto: 1, valorPuntoConfirmado: false });
  });

  test('la fecha y la recompensa en dólares solo se guardan con doble balance', () => {
    const b: BorradorTarjeta = {
      ...base(),
      separarFechaUsd: true,
      fechaLimiteUsd: { tipo: 'dia_del_mes', valor: '23' },
      recompensaUsdDistinta: true,
      recompensaUsd: { ...base().recompensa, tipo: 'cashback', porcentajeCashback: '2' },
    };
    const soloPesos = aTarjeta(b, pais, 'id1', '2026-09-25');
    expect(soloPesos.ok && soloPesos.tarjeta.fechaLimiteUsd).toBeFalsy();
    expect(soloPesos.ok && soloPesos.tarjeta.recompensaUsd).toBeFalsy();

    const doble = aTarjeta({ ...b, monedaFacturacion: 'doble_balance' }, pais, 'id1', '2026-09-25');
    expect(doble.ok && doble.tarjeta.fechaLimiteUsd).toEqual({ tipo: 'dia_del_mes', dia: 23 });
    expect(doble.ok && doble.tarjeta.recompensaUsd).toEqual({ tipo: 'cashback', porcentaje: 2 });
  });

  test('devuelve los errores de validación', () => {
    const r = aTarjeta({ ...base(), diaCorte: '', ultimos4: '12' }, pais, 'id1', '2026-09-25');
    expect(r).toEqual({ ok: false, errores: ['diaCorteInvalido', 'ultimos4Invalido'] });
  });

  test('editar conserva todos los datos de la tarjeta', () => {
    const r = aTarjeta(
      {
        ...base(),
        ultimos4: '4821',
        monedaFacturacion: 'doble_balance',
        separarFechaUsd: true,
        fechaLimiteUsd: { tipo: 'dias_despues_corte', valor: '18' },
        recompensa: { ...base().recompensa, tipo: 'puntos', regla: 'por_monto', puntos: '2', porCadaMonto: '200', valorPunto: '0.5' },
      },
      pais,
      'id1',
      '2026-09-25',
    );
    if (!r.ok) throw new Error(r.errores.join());
    const otraVez = aTarjeta(borradorDesde(r.tarjeta), pais, 'id1', '2026-09-25');
    expect(otraVez).toEqual(r);
  });
});

test('tarjetas con dólares', () => {
  expect(tieneDolares({ monedaFacturacion: 'doble_balance' })).toBe(true);
  expect(tieneDolares({ monedaFacturacion: 'solo_usd' })).toBe(true);
  expect(tieneDolares({ monedaFacturacion: 'solo_principal' })).toBe(false);
});
