import type { Preferencias, Tarjeta } from '../../tipos/tipos';
import { preferenciasIniciales } from '../../datos/preferencias';
import { conEstadoPro, conPlan, necesitaElegir, puedeAgregarTarjeta, tarjetasEnPlan } from '../plan';
import { ahorroAnual, type OfertaPro } from '../servicio';

function tarjeta(id: string, creadaEn: string, extra: Partial<Tarjeta> = {}): Tarjeta {
  return {
    id,
    alias: `Tarjeta ${id}`,
    emisorId: null,
    productoId: null,
    productoDesconocido: false,
    diaCorte: 5,
    fechaLimite: { tipo: 'dias_despues_corte', dias: 20 },
    ajusteDiaNoHabil: 'adelantar',
    compraEnDiaDeCorte: 'entra_en_corte_actual',
    monedaFacturacion: 'solo_principal',
    recompensa: { tipo: 'ninguna' },
    enPausa: false,
    creadaEn,
    ...extra,
  };
}

const A = tarjeta('A', '2026-09-01');
const B = tarjeta('B', '2026-09-02', { monedaFacturacion: 'doble_balance' });
const C = tarjeta('C', '2026-08-15');
const D = tarjeta('D', '2026-09-20', { enPausa: true });
const gratis: Preferencias = preferenciasIniciales('DO', 'es-DO');
const pro: Preferencias = { ...gratis, plan: 'pro' };
const ids = (ts: Tarjeta[]) => ts.map(t => t.id);

describe('límite del plan gratis (15.5)', () => {
  it('permite 2 tarjetas; la 3.ª pide Pro', () => {
    expect(puedeAgregarTarjeta([], 'gratis')).toBe(true);
    expect(puedeAgregarTarjeta([A], 'gratis')).toBe(true);
    expect(puedeAgregarTarjeta([A, B], 'gratis')).toBe(false);
    expect(puedeAgregarTarjeta([A, B, C, D], 'pro')).toBe(true);
  });

  it('una tarjeta con doble balance cuenta como una sola', () => {
    expect(puedeAgregarTarjeta([B], 'gratis')).toBe(true);
    expect(tarjetasEnPlan([A, B], gratis)).toEqual([A, B]);
  });

  it('con 2 tarjetas en el plan gratis, las 2 siguen funcionando', () => {
    expect(tarjetasEnPlan([A, B], gratis)).toEqual([A, B]);
    expect(necesitaElegir([A, B], gratis)).toBe(false);
  });
});

describe('al vencer Pro (15.5)', () => {
  it('no borra nada: mientras no elija, Tino usa las 2 más antiguas y pide elegir', () => {
    const todas = [A, B, C, D];
    expect(ids(tarjetasEnPlan(todas, gratis))).toEqual(['A', 'C']);
    expect(necesitaElegir(todas, gratis)).toBe(true);
    expect(todas).toHaveLength(4);
  });

  it('usa las 2 que el usuario eligió, incluida una en pausa', () => {
    const elegidas = { ...gratis, tarjetasDelPlan: ['D', 'B'] };
    expect(ids(tarjetasEnPlan([A, B, C, D], elegidas))).toEqual(['B', 'D']);
    expect(necesitaElegir([A, B, C, D], elegidas)).toBe(false);
  });

  it('si una elegida se borró, completa con la más antigua', () => {
    const elegidas = { ...gratis, tarjetasDelPlan: ['B', 'X'] };
    expect(ids(tarjetasEnPlan([A, B, C, D], elegidas))).toEqual(['B', 'C']);
  });

  it('con Pro activo usa todas', () => {
    expect(tarjetasEnPlan([A, B, C, D], { ...pro, tarjetasDelPlan: ['A', 'B'] })).toEqual([A, B, C, D]);
  });

  it('al volver a Pro se olvida la elección; al vencer se conserva hasta elegir de nuevo', () => {
    const elegidas = { ...gratis, tarjetasDelPlan: ['A', 'B'] };
    expect(conPlan(elegidas, 'pro')).toEqual({ ...gratis, plan: 'pro' });
    expect(conPlan(pro, 'gratis')).toEqual(gratis);
    expect(conPlan(gratis, 'gratis')).toBe(gratis);
  });
});

describe('estado que informa la tienda (D59)', () => {
  it('guarda el fin de la prueba solo mientras Pro está activo', () => {
    const enPrueba = conEstadoPro(gratis, { pro: true, finPrueba: '2026-11-05' });
    expect(enPrueba).toEqual({ ...gratis, plan: 'pro', finPruebaPro: '2026-11-05' });
    // Sin cambios, el mismo objeto: no se vuelve a guardar.
    expect(conEstadoPro(enPrueba, { pro: true, finPrueba: '2026-11-05' })).toBe(enPrueba);
    // Canceló la prueba o ya pagó: sin fecha. Venció: gratis y sin fecha.
    expect(conEstadoPro(enPrueba, { pro: true, finPrueba: null })).toEqual({ ...gratis, plan: 'pro' });
    expect(conEstadoPro(enPrueba, { pro: false, finPrueba: null })).toEqual(gratis);
  });
});

describe('ahorro del plan anual', () => {
  const oferta = (tipo: OfertaPro['tipo'], precioValor: number): OfertaPro => ({ id: tipo, tipo, precio: '', precioValor, precioPorMes: null, prueba: null });
  const mensual = oferta('mensual', 2.49);

  it('compara con 12 meses del mensual', () => {
    expect(ahorroAnual(oferta('anual', 19.99), [mensual])).toBe(33);
    expect(ahorroAnual(oferta('lanzamiento', 14.99), [mensual])).toBe(50);
  });

  it('nada si no hay mensual, si es el mensual o si el ahorro es mínimo', () => {
    expect(ahorroAnual(oferta('anual', 19.99), [])).toBeNull();
    expect(ahorroAnual(mensual, [mensual])).toBeNull();
    expect(ahorroAnual(oferta('anual', 29.5), [mensual])).toBeNull();
  });
});
