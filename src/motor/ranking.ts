import type {
  EntradaMotor,
  Etiqueta,
  FechaISO,
  ModoEnfoque,
  ResultadoMotor,
  ResultadoTarjeta,
  Tarjeta,
} from '../tipos/tipos';
import { aFecha, corteAnterior, fechaLimite, numeroDe, proximoCorte } from './fechas';
import { fechasDeCobro } from './ingresos';
import { valorRecompensa } from './recompensas';
import { redondear2 } from './redondeo';

type Trio = [dias: number, puntos: number, cashback: number];

// Sección 5.4: pesos del MVP (días / puntos / cashback).
export const PESOS_MVP: Partial<Record<ModoEnfoque, Trio>> = {
  liquidez: [80, 10, 10],
  puntos: [20, 70, 10],
  cashback: [20, 10, 70],
  equilibrado: [40, 30, 30],
};

// Los modos de v2 no tienen pesos en el MVP (decisión D7 de docs/progreso.md).
export class ErrorModoNoDisponible extends Error {}

const PENALIZACION_CORTE_CERCANO = 10;
const PENALIZACION_VENCE_ANTES_DEL_COBRO = 15;
const PENALIZACION_CONVERSION_MAXIMA = 100;
const UMBRAL_CORTE_CERCANO = 3;
const DIFERENCIAL_CAMBIARIO = 6;

interface Medida {
  tarjeta: Tarjeta;
  diasGracia: number;
  fechaPago: number;
  proximoCorte: number;
  diasParaCorte: number;
  puntos: number;
  cashback: number;
  penalizacion: number;
  etiquetas: Etiqueta[];
  semaforo: ResultadoTarjeta['semaforo'];
}

// El motor es una función pura: la fecha de hoy llega en la entrada (sección 5).
export function calcularRanking(e: EntradaMotor): ResultadoMotor {
  const pesosModo = PESOS_MVP[e.preferencias.enfoque.modo];
  if (!pesosModo) throw new ErrorModoNoDisponible(`El modo ${e.preferencias.enfoque.modo} no está disponible en el MVP`);

  const hoy = numeroDe(e.hoy);
  const feriados: ReadonlySet<FechaISO> = new Set(e.pais.feriados);
  const monto = e.compra ? e.compra.monto : e.pais.montoReferencia;
  // La moneda secundaria del país (USD en RD) activa las reglas de compras en dólares (decisión D8).
  const enSecundaria = !!e.compra && e.pais.monedaSecundaria !== null && e.compra.moneda === e.pais.monedaSecundaria;
  const umbral = e.preferencias.umbralCorteCercanoDias ?? UMBRAL_CORTE_CERCANO;

  // Sección 5.3: exclusiones.
  const excluidas: ResultadoMotor['excluidas'] = [];
  const medidas: Medida[] = [];
  for (const tarjeta of e.tarjetas) {
    if (tarjeta.enPausa) {
      excluidas.push({ tarjetaId: tarjeta.id, motivo: 'en_pausa' });
      continue;
    }
    if (enSecundaria && tarjeta.monedaFacturacion === 'solo_local') {
      excluidas.push({ tarjetaId: tarjeta.id, motivo: 'solo_local_excluida' });
      continue;
    }
    medidas.push(medir(tarjeta));
  }

  function medir(tarjeta: Tarjeta): Medida {
    // Sección 5.1: fechas.
    const corte = proximoCorte(hoy, tarjeta);
    const regla =
      enSecundaria && tarjeta.monedaFacturacion === 'doble_balance' && tarjeta.fechaLimiteUsd
        ? tarjeta.fechaLimiteUsd
        : tarjeta.fechaLimite;
    const pago = fechaLimite(corte, regla, tarjeta.ajusteDiaNoHabil, feriados);

    // Sección 5.2: recompensas.
    const recompensa = enSecundaria && tarjeta.recompensaUsd ? tarjeta.recompensaUsd : tarjeta.recompensa;
    const { puntos, cashback } = valorRecompensa(recompensa, monto, !!e.compra);

    // Sección 5.3: penalizaciones.
    let penalizacion = 0;
    const etiquetas: Etiqueta[] = [];
    const diasParaCorte = corte - hoy;
    if (diasParaCorte <= umbral) {
      penalizacion += PENALIZACION_CORTE_CERCANO;
      etiquetas.push('corta_pronto');
    }
    if (e.ingresos.length > 0 && fechasDeCobro(e.ingresos, hoy, pago, feriados).size === 0) {
      penalizacion += PENALIZACION_VENCE_ANTES_DEL_COBRO;
      etiquetas.push('vence_antes_del_cobro');
    }
    if (enSecundaria && e.preferencias.pagoBalanceUsd === 'con_dolares' && tarjeta.monedaFacturacion === 'solo_principal') {
      const diferencial = e.preferencias.diferencialCambiarioPct ?? DIFERENCIAL_CAMBIARIO;
      penalizacion += Math.min(PENALIZACION_CONVERSION_MAXIMA, diferencial * 10);
    }

    // Sección 5.5: semáforo del ciclo.
    const anterior = corte !== hoy ? corteAnterior(corte, tarjeta.diaCorte) : hoy;
    const ciclo = corte - anterior;
    const transcurrido = hoy - anterior;
    const semaforo = diasParaCorte <= umbral ? 'rojo' : transcurrido < ciclo / 3 ? 'verde' : 'amarillo';

    return {
      tarjeta,
      diasGracia: pago - hoy,
      fechaPago: pago,
      proximoCorte: corte,
      diasParaCorte,
      puntos,
      cashback,
      penalizacion,
      etiquetas,
      semaforo,
    };
  }

  // Sección 5.4: una dimensión sin valor en ninguna candidata reparte su peso entre las demás.
  const maximo = (valores: number[]) => (valores.length ? Math.max(...valores) : 0);
  const maximos: Trio = [
    maximo(medidas.map(m => m.diasGracia)),
    maximo(medidas.map(m => m.puntos)),
    maximo(medidas.map(m => m.cashback)),
  ];
  const activas = maximos.map(m => m > 0);
  const totalActivo = pesosModo.reduce((suma, peso, i) => (activas[i] ? suma + peso : suma), 0);
  const pesos = totalActivo ? pesosModo.map((peso, i) => (activas[i] ? (peso * 100) / totalActivo : 0)) : pesosModo;

  const conAlias = medidas.map(m => {
    const valores: Trio = [m.diasGracia, m.puntos, m.cashback];
    const normalizado = valores.map((v, i) => (maximos[i] > 0 ? (v / maximos[i]) * 100 : 0));
    const suma = pesos.reduce((total, peso, i) => total + (peso / 100) * normalizado[i], 0);
    const resultado: ResultadoTarjeta = {
      tarjetaId: m.tarjeta.id,
      diasGracia: m.diasGracia,
      fechaPago: aFecha(m.fechaPago),
      proximoCorte: aFecha(m.proximoCorte),
      diasParaCorte: m.diasParaCorte,
      valorRecompensa: redondear2(m.puntos + m.cashback),
      normalizado: {
        dias: redondear2(normalizado[0]),
        puntos: redondear2(normalizado[1]),
        cashback: redondear2(normalizado[2]),
      },
      penalizacion: m.penalizacion,
      puntaje: redondear2(suma - m.penalizacion),
      etiquetas: m.etiquetas,
      semaforo: m.semaforo,
    };
    return { resultado, alias: m.tarjeta.alias };
  });

  // Orden: puntaje de mayor a menor; en empate, más días; luego alias.
  conAlias.sort(
    (a, b) =>
      b.resultado.puntaje - a.resultado.puntaje ||
      b.resultado.diasGracia - a.resultado.diasGracia ||
      compararTexto(a.alias, b.alias),
  );

  return {
    ranking: conAlias.map(c => c.resultado),
    excluidas,
    pesosAplicados: { dias: redondear2(pesos[0]), puntos: redondear2(pesos[1]), cashback: redondear2(pesos[2]) },
  };
}

// Comparación por código de carácter, igual que la referencia; no depende del idioma del teléfono.
function compararTexto(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
