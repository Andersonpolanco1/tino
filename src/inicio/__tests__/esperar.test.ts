import type { ConfigPais, EntradaMotor, Tarjeta } from '../../tipos/tipos';
import { calcularRanking } from '../../motor';
import { preferenciasIniciales } from '../../datos/preferencias';
import { consejoEsperar } from '../esperar';

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

function tarjeta(id: string, diaCorte: number, dia: number): Tarjeta {
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
    recompensa: { tipo: 'ninguna' },
    enPausa: false,
    creadaEn: '2026-09-01',
  };
}

const entrada = (tarjetas: Tarjeta[], hoy = '2026-10-06'): EntradaMotor => ({ hoy, tarjetas, ingresos: [], preferencias: preferenciasIniciales('DO', 'es-DO'), pais });
const consejo = (e: EntradaMotor) => consejoEsperar(e, calcularRanking(e).ranking);

// Decisión D103.
test('todas por cortar: el primer día después de un corte que da al menos 10 días más', () => {
  // X corta el 8 y paga el 28; Y corta el 7 y paga el 27. Hoy, 6 de octubre: 22 y 21 días.
  expect(consejo(entrada([tarjeta('X', 8, 28), tarjeta('Y', 7, 27)]))).toEqual({ fecha: '2026-10-08', tarjetaId: 'X', dias: 51, diasHoy: 22 });
});

test('sin consejo si alguna no está por cortar o si hay una sola', () => {
  expect(consejo(entrada([tarjeta('X', 8, 28), tarjeta('Z', 20, 10)]))).toBeNull();
  expect(consejo(entrada([tarjeta('X', 8, 28)]))).toBeNull();
});
