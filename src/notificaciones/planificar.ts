import type { AjustesAvisos, ConfigPais, FechaISO, FuenteIngreso, Preferencias, Tarjeta } from '../tipos/tipos';
import { calcularRanking } from '../motor';
import { aFecha, corteAnterior, fechaLimite, leer, numero, numeroDe, proximoCorte, ultimoDia } from '../motor/fechas';
import { avisoCobro, diaConSemana, textoFecha, type Traducir } from '../inicio/vista';

// Sección 11 de la especificación: los avisos del MVP, calculados sin tocar el sistema de
// notificaciones, para poder probarlos con fechas simuladas. Nunca incluyen montos.

export type TipoAviso = 'fechaLimite' | 'venceAntesDelCobro' | 'cambioTarjeta' | 'resumenMensual' | 'finPrueba' | 'vencimiento' | 'vencido' | 'antesDelCorte';

export interface Aviso {
  id: string;
  tipo: TipoAviso;
  fecha: FechaISO; // se muestra a la HORA_AVISO de ese día
  titulo: string;
  cuerpo: string;
}

export const HORA_AVISO = 9;
// Cuántos días hacia adelante se programan; se vuelve a planificar cada vez que cambian los
// datos o se abre la app, y iOS admite como máximo 64 avisos pendientes.
export const HORIZONTE_DIAS = 60;
export const MAXIMO_AVISOS = 60;
export const DIAS_ANTES_FECHA_LIMITE = 3;
export const DIAS_ANTES_COBRO = 5;
export const DIAS_ANTES_FIN_PRUEBA = 2;

export const AVISOS_PREDETERMINADOS: Required<AjustesAvisos> = {
  fechaLimite: true,
  venceAntesDelCobro: true,
  cambioTarjeta: true,
  resumenMensual: true,
  vencimiento: true,
  antesDelCorte: true,
};
// Antes del corte, solo si esperar un día da al menos esta cantidad de días más para pagar.
export const DIAS_MINIMOS_AL_ESPERAR = 10;

export interface EntradaAvisos {
  hoy: FechaISO;
  tarjetas: Tarjeta[];
  ingresos: FuenteIngreso[];
  preferencias: Preferencias;
  pais: ConfigPais;
  t: Traducir;
  idioma: string;
}

// Fechas límite de los estados que vencen entre hoy y el horizonte, por tarjeta.
function pagosEnHorizonte(tarjeta: Tarjeta, hoy: number, hasta: number, feriados: ReadonlySet<FechaISO>) {
  const pagos: { corte: number; pago: number; pagoUsd: number | null }[] = [];
  let corte = corteAnterior(proximoCorte(hoy, tarjeta), tarjeta.diaCorte);
  for (let k = 0; k < 4; k++) {
    const pago = fechaLimite(corte, tarjeta.fechaLimite, tarjeta.ajusteDiaNoHabil, feriados);
    const pagoUsd =
      tarjeta.monedaFacturacion === 'doble_balance' && tarjeta.fechaLimiteUsd ? fechaLimite(corte, tarjeta.fechaLimiteUsd, tarjeta.ajusteDiaNoHabil, feriados) : null;
    if (pago >= hoy && pago <= hasta) pagos.push({ corte, pago, pagoUsd });
    const { anio, mes } = leer(aFecha(corte));
    const [a, m] = mes === 12 ? [anio + 1, 1] : [anio, mes + 1];
    corte = numero({ anio: a, mes: m, dia: Math.min(tarjeta.diaCorte, ultimoDia(a, m)) });
  }
  return pagos;
}

function mejorDelDia(e: EntradaAvisos, dia: FechaISO) {
  const [primera] = calcularRanking({ hoy: dia, tarjetas: e.tarjetas, ingresos: e.ingresos, preferencias: e.preferencias, pais: e.pais }).ranking;
  return primera ?? null;
}

export function planificarAvisos(e: EntradaAvisos): Aviso[] {
  const { t, idioma } = e;
  const ajustes = { ...AVISOS_PREDETERMINADOS, ...e.preferencias.avisos };
  const feriados = new Set(e.pais.feriados);
  const hoy = numeroDe(e.hoy);
  const hasta = hoy + HORIZONTE_DIAS;
  const activas = e.tarjetas.filter(x => !x.enPausa);
  const avisos: Aviso[] = [];
  const fecha = (n: number) => textoFecha(aFecha(n), idioma);
  const agregar = (a: Aviso) => {
    if (numeroDe(a.fecha) >= hoy && numeroDe(a.fecha) <= hasta) avisos.push(a);
  };

  for (const tarjeta of activas) {
    // Desde ayer, para el aviso de "venció ayer" (D66); los demás avisos de ese pago ya pasaron
    // y agregar() los descarta.
    for (const { pago, pagoUsd } of pagosEnHorizonte(tarjeta, hoy - 1, hasta, feriados)) {
      // "Ya pagué" (decisión D45): ese estado ya no avisa.
      if (tarjeta.pagoHecho === aFecha(pago)) continue;
      // El día que vence y el siguiente, mientras no marque "Ya pagué" (decisión D66).
      if (ajustes.vencimiento) {
        agregar({
          id: `vencimiento:${tarjeta.id}:${aFecha(pago)}`,
          tipo: 'vencimiento',
          fecha: aFecha(pago),
          titulo: t('avisos.vencimientoTitulo', { alias: tarjeta.alias }),
          cuerpo: t('avisos.vencimientoCuerpo'),
        });
        agregar({
          id: `vencido:${tarjeta.id}:${aFecha(pago)}`,
          tipo: 'vencido',
          fecha: aFecha(pago + 1),
          titulo: t('avisos.vencidoTitulo', { alias: tarjeta.alias }),
          cuerpo: t('avisos.vencidoCuerpo'),
        });
      }
      // Fecha límite próxima, 3 días antes. Con doble balance menciona los dos pagos (criterio 14.1).
      if (ajustes.fechaLimite) {
        const dia = aFecha(pago - DIAS_ANTES_FECHA_LIMITE);
        const cuerpo =
          tarjeta.monedaFacturacion === 'doble_balance'
            ? pagoUsd !== null && pagoUsd !== pago
              ? t('avisos.fechaLimiteDobleFechas', { alias: tarjeta.alias, fecha: fecha(pago), fechaUsd: fecha(pagoUsd) })
              : t('avisos.fechaLimiteDoble', { alias: tarjeta.alias, fecha: fecha(pago) })
            : t('avisos.fechaLimiteCuerpo', { alias: tarjeta.alias, fecha: fecha(pago) });
        agregar({ id: `fechaLimite:${tarjeta.id}:${aFecha(pago)}`, tipo: 'fechaLimite', fecha: dia, titulo: t('avisos.fechaLimiteTitulo', { dia: diaConSemana(aFecha(pago), idioma, t) }), cuerpo });
      }
      // Vence antes de tu cobro, 5 días antes (sección 5.3).
      if (ajustes.venceAntesDelCobro) {
        const dia = aFecha(pago - DIAS_ANTES_COBRO);
        const aviso = avisoCobro(aFecha(pago), dia, e.ingresos, e.pais);
        if (aviso) {
          agregar({
            id: `venceAntesDelCobro:${tarjeta.id}:${aFecha(pago)}`,
            tipo: 'venceAntesDelCobro',
            fecha: dia,
            titulo: t('avisos.venceAntesTitulo'),
            cuerpo: t(aviso.tipo === 'antes' ? 'avisos.venceAntesCuerpo' : 'avisos.venceAntesEstimado', { alias: tarjeta.alias, fecha: fecha(pago), cobro: textoFecha(aviso.cobro, idioma) }),
          });
        }
      }
    }
  }

  // Cambio de mejor tarjeta, solo el día en que de verdad cambia (decisión D41). La
  // especificación dice "el día después de cada corte", pero el cambio cae el mismo día del
  // corte si la compra de ese día entra en el siguiente estado, o 3 días antes por "corta pronto".
  if (ajustes.cambioTarjeta && activas.length > 1) {
    let anterior = mejorDelDia(e, aFecha(hoy));
    for (let d = hoy + 1; d <= hasta; d++) {
      const mejor = mejorDelDia(e, aFecha(d));
      if (mejor && anterior && mejor.tarjetaId !== anterior.tarjetaId) {
        const alias = e.tarjetas.find(x => x.id === mejor.tarjetaId)?.alias ?? '';
        agregar({ id: `cambioTarjeta:${aFecha(d)}`, tipo: 'cambioTarjeta', fecha: aFecha(d), titulo: t('avisos.cambioTitulo'), cuerpo: t('avisos.cambioCuerpo', { alias, dias: mejor.diasGracia }) });
      }
      anterior = mejor;
    }
  }

  // El último día antes del corte, si esperar un día da muchos más días para pagar y ninguna otra
  // tarjeta es mejor ese día: con una sola tarjeta, o si todas cortan cerca (decisión D66).
  if (ajustes.antesDelCorte) {
    for (const tarjeta of activas) {
      for (let d = hoy; d <= hasta; d++) {
        const siguiente = proximoCorte(d + 1, tarjeta);
        if (siguiente === proximoCorte(d, tarjeta)) continue;
        // d es el último día cuyas compras entran en el estado que corta; d + 1, el primero del siguiente.
        const antes = fechaLimite(proximoCorte(d, tarjeta), tarjeta.fechaLimite, tarjeta.ajusteDiaNoHabil, feriados) - d;
        const despues = fechaLimite(siguiente, tarjeta.fechaLimite, tarjeta.ajusteDiaNoHabil, feriados) - (d + 1);
        if (despues - antes < DIAS_MINIMOS_AL_ESPERAR) continue;
        if (mejorDelDia(e, aFecha(d))?.tarjetaId !== tarjeta.id) continue;
        agregar({
          id: `antesDelCorte:${tarjeta.id}:${aFecha(d)}`,
          tipo: 'antesDelCorte',
          fecha: aFecha(d),
          titulo: t('avisos.antesDelCorteTitulo', { alias: tarjeta.alias }),
          cuerpo: t('avisos.antesDelCorteCuerpo', { dia: diaConSemana(aFecha(d + 1), idioma, t), despues, antes }),
        });
      }
    }
  }

  // Resumen mensual el día 1 (decisión D38): lo que Tino sabe sin compras registradas.
  if (ajustes.resumenMensual && activas.length) {
    for (let d = hoy; d <= hasta; d++) {
      const { anio, mes, dia } = leer(aFecha(d));
      if (dia !== 1) continue;
      const [a, m] = mes === 1 ? [anio - 1, 12] : [anio, mes - 1];
      const usadas = new Set<string>();
      let maximo = 0;
      for (let k = 1; k <= ultimoDia(a, m); k++) {
        const mejor = mejorDelDia(e, aFecha(numero({ anio: a, mes: m, dia: k })));
        if (!mejor) continue;
        usadas.add(mejor.tarjetaId);
        maximo = Math.max(maximo, mejor.diasGracia);
      }
      if (!usadas.size) continue;
      const nombreMes = new Intl.DateTimeFormat(idioma, { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(a, m - 1, 1)));
      agregar({
        id: `resumenMensual:${a}-${m}`,
        tipo: 'resumenMensual',
        fecha: aFecha(d),
        titulo: t('avisos.resumenTitulo', { mes: nombreMes }),
        cuerpo: t('avisos.resumenCuerpo', { mes: nombreMes, dias: maximo, count: usadas.size }),
      });
    }
  }

  // Fin de la prueba de Tino Pro, 2 días antes del cobro (decisión D59). Es lo que promete el
  // muro de pago, así que no depende de los interruptores de avisos. Sin precio ni montos.
  const finPrueba = e.preferencias.plan === 'pro' ? e.preferencias.finPruebaPro : undefined;
  if (finPrueba) {
    const fin = numeroDe(finPrueba);
    agregar({
      id: `finPrueba:${finPrueba}`,
      tipo: 'finPrueba',
      fecha: aFecha(fin - DIAS_ANTES_FIN_PRUEBA),
      titulo: t('avisos.finPruebaTitulo'),
      cuerpo: t('avisos.finPruebaCuerpo', { fecha: fecha(fin) }),
    });
  }

  return avisos.sort((x, y) => (x.fecha < y.fecha ? -1 : x.fecha > y.fecha ? 1 : x.id < y.id ? -1 : 1)).slice(0, MAXIMO_AVISOS);
}
